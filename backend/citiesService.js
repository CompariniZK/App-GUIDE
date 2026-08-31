/**
 * Cities service — Boussole backend
 *
 * Powers dynamic, France-wide city selection and local public-service lookup,
 * using official French government open data (free, no key required):
 *
 *  1. API Géo (geo.api.gouv.fr) — search any of the ~35,000 communes.
 *  2. Annuaire de l'Administration (api-lannuaire.service-public.fr) — the
 *     official directory of local public services (mairie, préfecture, CAF,
 *     CPAM, France Travail, France Services…) with address, phone, hours.
 *
 * Results are normalized into the app's LocalResource shape and cached in
 * memory to keep the gov APIs happy and responses fast.
 */

const GEO_URL = 'https://geo.api.gouv.fr/communes';
const ANNUAIRE_URL =
  'https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records';

// ── Tiny TTL cache ───────────────────────────────────────────────────────────
function makeCache(ttlMs) {
  const store = new Map();
  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return undefined;
      if (Date.now() > hit.expires) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      store.set(key, { value, expires: Date.now() + ttlMs });
    },
  };
}

const searchCache = makeCache(24 * 60 * 60 * 1000); // 24h
const resourceCache = makeCache(24 * 60 * 60 * 1000); // 24h
let prefectureIndex = null; // { [deptCode]: normalizedResource }
let prefectureIndexExpires = 0;

// A few departments handle préfecture duties through a "Préfecture de police"
// that isn't registered under the usual pivot, so the dynamic index misses them.
// Paris (75) is the notable case — provide the stable official reference.
const STATIC_PREFECTURES = {
  '75': {
    name: 'Préfecture de police de Paris',
    type: 'prefecture',
    address: '1 rue de Lutèce, 75004, Paris',
    postalCode: '75004',
    phone: '3430',
    website: 'https://www.prefecturedepolice.interieur.gouv.fr',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function safeJsonParse(str, fallback) {
  if (typeof str !== 'string' || !str.trim()) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function firstAddress(record) {
  const arr = safeJsonParse(record.adresse, []);
  if (!Array.isArray(arr) || arr.length === 0) return null;
  // Prefer the physical "Adresse" over "Adresse postale"
  const physical = arr.find(a => a && a.type_adresse === 'Adresse') || arr[0];
  const parts = [physical.numero_voie, physical.code_postal, physical.nom_commune]
    .map(s => (s || '').trim())
    .filter(Boolean);
  return {
    address: parts.join(', '),
    postalCode: (physical.code_postal || '').trim(),
    commune: (physical.nom_commune || '').trim(),
  };
}

function firstPhone(record) {
  const arr = safeJsonParse(record.telephone, []);
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return (arr[0].valeur || '').trim() || undefined;
}

function firstWebsite(record) {
  const arr = safeJsonParse(record.site_internet, []);
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return (arr[0].valeur || '').trim() || undefined;
}

// Classify a record into one of the app's resource types using keywords in the
// service name (robust to exact pivot-code differences). Returns null to drop
// services that aren't relevant to immigrants (keeps the list focused).
function classify(name) {
  const n = (name || '').toLowerCase();

  // Exclude ancillary / back-office entries that aren't a public front desk.
  if (
    n.includes('laboratoire') ||
    n.includes('point-justice') ||
    n.includes('point justice') ||
    n.includes('archives') ||
    n.includes('cabinet du préfet') ||
    n.includes('secrétariat général') ||
    n.includes('secretariat general')
  ) {
    return null;
  }

  if (n.includes('préfecture') || n.includes('prefecture')) return 'prefecture';
  if (n.includes('mairie') || n.includes('hôtel de ville') || n.includes('hotel de ville')) return 'mairie';
  if (n.includes('caisse d’allocations') || n.includes("caisse d'allocations") || n.includes('caf ')) return 'caf';
  if (n.includes('assurance maladie') || n.includes('cpam') || n.includes('primaire d’assurance') || n.includes("primaire d'assurance")) return 'cpam';
  if (n.includes('france travail') || n.includes('pôle emploi') || n.includes('pole emploi')) return 'france_travail';
  if (n.includes('france services') || n.includes('maison de services')) return 'france_services';
  if (n.includes('ccas') || n.includes("centre communal d'action sociale") || n.includes('centre communal d’action sociale')) return 'ccas';
  if (n.includes('ofii') || n.includes("immigration et de l'intégration") || n.includes('immigration et de l’intégration')) return 'ofii';
  return null;
}

function normalizeRecord(record) {
  const type = classify(record.nom);
  if (!type) return null;
  const addr = firstAddress(record);
  return {
    name: (record.nom || '').trim(),
    type,
    address: addr ? addr.address : undefined,
    postalCode: addr ? addr.postalCode : undefined,
    phone: firstPhone(record),
    website: firstWebsite(record),
    email: (record.adresse_courriel || '').trim() || undefined,
  };
}

// ── Public: search communes ──────────────────────────────────────────────────
async function searchCommunes(query) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  const key = q.toLowerCase();
  const cached = searchCache.get(key);
  if (cached) return cached;

  const url = `${GEO_URL}?nom=${encodeURIComponent(q)}&fields=nom,code,codeDepartement,codesPostaux,population&boost=population&limit=12`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw Object.assign(new Error('GEO_ERROR'), { code: `GEO_${res.status}` });
  const data = await res.json();

  const communes = (Array.isArray(data) ? data : [])
    .filter(c => c && c.code && c.nom)
    .map(c => ({
      insee: c.code,
      name: c.nom,
      department: c.codeDepartement || (c.codesPostaux && c.codesPostaux[0] ? c.codesPostaux[0].slice(0, 2) : ''),
      postalCode: Array.isArray(c.codesPostaux) && c.codesPostaux[0] ? c.codesPostaux[0] : '',
      population: c.population || 0,
    }));

  searchCache.set(key, communes);
  return communes;
}

// ── Préfecture index (all préfectures, indexed by department) ────────────────
async function getPrefectureForDept(dept) {
  if (!dept) return null;
  if (!prefectureIndex || Date.now() > prefectureIndexExpires) {
    const index = {};
    // The ODS API caps limit at 100 and there are ~110 préfecture records, so
    // page through them (offset 0 and 100) to cover every department incl. Paris.
    for (const offset of [0, 100]) {
      const url =
        `${ANNUAIRE_URL}?where=${encodeURIComponent('pivot LIKE "prefecture"')}` +
        `&limit=100&offset=${offset}&select=nom,adresse,telephone,site_internet,adresse_courriel`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) break;
      const data = await res.json();
      const rows = data.results || [];
      for (const rec of rows) {
        const norm = normalizeRecord(rec);
        if (!norm || !norm.postalCode) continue;
        const d = norm.postalCode.slice(0, 2);
        // Keep the first main préfecture per department (classify already drops
        // sous-préfectures? no — keep the record whose name starts with Préfecture).
        if (/^pr[ée]fecture/i.test(norm.name) && !/sous/i.test(norm.name) && !index[d]) {
          index[d] = norm;
        }
      }
      if (rows.length < 100) break; // no more pages
    }
    prefectureIndex = index;
    prefectureIndexExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  }
  return (prefectureIndex && prefectureIndex[dept]) || STATIC_PREFECTURES[dept] || null;
}

// ── Public: resources for a commune ──────────────────────────────────────────
// Derive the department code from an INSEE commune code.
// Metropolitan: first 2 digits. Corsica: 2A/2B. Overseas (DOM): first 3 digits.
function deptFromInsee(insee) {
  const c = (insee || '').toUpperCase();
  if (c.startsWith('2A') || c.startsWith('2B')) return c.slice(0, 2);
  if (c.startsWith('97') || c.startsWith('98')) return c.slice(0, 3);
  return c.slice(0, 2);
}

async function getCommuneResources(insee, dept) {
  const code = (insee || '').trim();
  if (!/^[0-9A-B]{5}$/i.test(code)) return { resources: [] };
  const department = (dept || '').trim() || deptFromInsee(code);

  const key = code;
  const cached = resourceCache.get(key);
  if (cached) return cached;

  // Commune-level services (mairie, CCAS, France Services, local CAF/CPAM agencies…)
  const url =
    `${ANNUAIRE_URL}?refine=${encodeURIComponent(`code_insee_commune:"${code}"`)}` +
    `&limit=100&select=nom,adresse,telephone,site_internet,adresse_courriel`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw Object.assign(new Error('ANNUAIRE_ERROR'), { code: `ANNUAIRE_${res.status}` });
  const data = await res.json();

  const seen = new Set();
  const resources = [];
  for (const rec of data.results || []) {
    const norm = normalizeRecord(rec);
    if (!norm) continue;
    const dedupeKey = `${norm.type}|${norm.name}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    resources.push(norm);
  }

  // Add the department's préfecture (rarely registered to the user's commune)
  try {
    const pref = await getPrefectureForDept(department);
    if (pref && !resources.some(r => r.type === 'prefecture')) {
      resources.unshift(pref);
    }
  } catch {
    /* préfecture is best-effort */
  }

  // Prefer the "main" préfecture record (name starting with "Préfecture") over
  // ancillary ones (numeric help point, secretariat…).
  const prefRank = (r) => (/^pr[ée]fecture\b/i.test(r.name) ? 0 : 1);

  // Cap how many of each type we show — a user needs one of most services.
  const perTypeCap = {
    prefecture: 1, mairie: 1, ccas: 1, caf: 2,
    cpam: 1, france_travail: 2, france_services: 3, ofii: 1,
  };
  const counts = {};
  const capped = resources
    .slice()
    .sort((a, b) => prefRank(a) - prefRank(b))
    .filter(r => {
      const cap = perTypeCap[r.type] ?? 2;
      counts[r.type] = (counts[r.type] || 0) + 1;
      return counts[r.type] <= cap;
    });

  // Final display order: préfecture, mairie, then the rest.
  const order = { prefecture: 0, mairie: 1, ccas: 2, caf: 3, cpam: 4, france_travail: 5, france_services: 6, ofii: 7 };
  capped.sort((a, b) => (order[a.type] ?? 99) - (order[b.type] ?? 99));

  const result = { resources: capped.slice(0, 15) };
  resourceCache.set(key, result);
  return result;
}

export { searchCommunes, getCommuneResources };
