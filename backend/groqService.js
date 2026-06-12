/**
 * Groq service — Boussole backend
 *
 * Moves the Groq integration server-side so:
 *  1. The API key (GROQ_API_KEY) never ships to the mobile client.
 *  2. Users on VPNs / flagged IPs still get answers (call originates from the server).
 *  3. Rate limiting + auditing happen in one place.
 *  4. The (very large) French legal base + system prompt are not bundled into the
 *     mobile app, saving bandwidth and keeping the prompt opaque to the client.
 *
 * Hardening:
 *  - Strict whitelists for profile fields (any unknown value is dropped).
 *  - All user-controlled strings flow through `sanitizeForPrompt()` before
 *    being interpolated.
 *  - Errors are returned as opaque codes; raw upstream bodies are NEVER echoed.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Caps — must match (or be stricter than) the client-side caps in src/services/ai.ts
const MAX_USER_MESSAGE_LEN = 1000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_MESSAGE_LEN = 2000;

// Whitelists — anything else is replaced with a safe default.
const ALLOWED_LANGS = new Set(['fr', 'en', 'pt', 'es', 'ar']);
const ALLOWED_SITUATIONS = new Set([
  'student', 'worker', 'asylum-seeker', 'refugee', 'family',
  'resident', 'tourist', 'entrepreneur', 'retired', 'other',
  // Also accept the situation enum used by the mobile UI:
  'new_arrival',
]);

const LANG_NAMES = {
  fr: 'français',
  en: 'English',
  pt: 'português',
  es: 'español',
  ar: 'العربية',
};

// ─── Sanitizer (anti-prompt-injection) ────────────────────────────────────────
function sanitizeForPrompt(value, maxLen = 64) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[`${}<>\r\n]/g, '')
    .replace(/\[(SYSTEM|INST|ASSISTANT|USER)[^\]]*\]/gi, '')
    .slice(0, maxLen)
    .trim();
}

// ─── French legal base ────────────────────────────────────────────────────────
const FRENCH_LEGAL_BASE = `
═══ BASE JURIDIQUE — DROIT DES ÉTRANGERS EN FRANCE ═══

▸ CODE DE L'ENTRÉE ET DU SÉJOUR DES ÉTRANGERS ET DU DROIT D'ASILE (CESEDA)

ENTRÉE SUR LE TERRITOIRE :
- Art. L311-1 à L311-3 : Conditions générales d'entrée (visa, passeport valide)
- Art. L312-1 à L312-7 : Refus d'entrée, zones d'attente
- Art. L313-1 : Obligation de visa long séjour pour séjour > 3 mois

TITRES DE SÉJOUR — DISPOSITIONS GÉNÉRALES :
- Art. L411-1 : Obligation de détenir un titre de séjour pour tout étranger > 18 ans séjournant en France > 3 mois
- Art. L412-1 : Conditions générales de délivrance (absence de menace à l'ordre public)
- Art. L413-1 à L413-7 : Durée de validité des titres, renouvellement
- Art. L414-1 à L414-13 : Carte de séjour temporaire (1 an)
- Art. L421-1 à L421-35 : Cartes de séjour "salarié", "travailleur temporaire", "entrepreneur"
- Art. L422-1 à L422-14 : Carte "étudiant" et "recherche d'emploi / création d'entreprise"
- Art. L423-1 à L423-23 : Cartes "vie privée et familiale" (liens personnels et familiaux)
- Art. L424-1 à L424-25 : Carte de séjour pluriannuelle (jusqu'à 4 ans)
- Art. L426-1 à L426-22 : Carte de résident (10 ans)
- Art. L431-1 à L431-3 : Retrait et non-renouvellement des titres

PASSEPORT TALENT :
- Art. L421-9 à L421-24 : Carte "passeport talent" (chercheur, artiste, investisseur, salarié qualifié, entreprise innovante, projet économique)
- Art. L421-13 : Salarié qualifié (rémunération ≥ 2× SMIC)
- Art. L421-16 : Carte bleue européenne (diplôme + contrat ≥ 1 an + salaire ≥ 1,5× salaire moyen)

REGROUPEMENT FAMILIAL :
- Art. L434-1 à L434-9 : Conditions du regroupement familial
- Art. L434-2 : Ressources stables ≥ SMIC, logement adapté, séjour régulier ≥ 18 mois
- Art. L434-7 : Membres de famille éligibles (conjoint + enfants < 18 ans)
- Art. L423-1 : Conjoint de Français — carte "vie privée et familiale"
- Art. L423-7 : Parent d'enfant français

DROIT D'ASILE :
- Art. L511-1 : Droit de demander l'asile sur le territoire français
- Art. L521-1 à L521-7 : Enregistrement de la demande (GUDA, guichet unique)
- Art. L531-1 à L531-32 : Examen par l'OFPRA (Office Français de Protection des Réfugiés et Apatrides)
- Art. L531-12 : Entretien personnel avec un officier de protection
- Art. L531-24 : Délai de décision OFPRA — 6 mois (procédure normale)
- Art. L531-26 : Procédure accélérée — 15 jours
- Art. L532-1 à L532-8 : Statut de réfugié (Convention de Genève 1951, art. 1A§2)
- Art. L532-4 : Protection subsidiaire (risques de peine de mort, torture, menaces graves)
- Art. L541-1 à L541-4 : Recours devant la CNDA (Cour nationale du droit d'asile) — délai 1 mois
- Art. L551-1 à L551-16 : Conditions matérielles d'accueil (hébergement CADA, ADA)
- Art. L553-1 : Allocation pour demandeur d'asile (ADA) — versée par l'OFII
- Art. L554-1 : Hébergement en CADA — géré par l'OFII

PROTECTION SUBSIDIAIRE ET APATRIDIE :
- Art. L512-1 à L512-4 : Définition de la protection subsidiaire
- Art. L582-1 : Statut d'apatride

NATURALISATION ET NATIONALITÉ :
- Art. 21-1 à 21-27-1 du Code civil : Acquisition de la nationalité française
- Art. 21-2 : Naturalisation par déclaration (conjoint de Français, après 4 ans de mariage + communauté de vie)
- Art. 21-15 : Naturalisation par décret — conditions : résidence ≥ 5 ans, assimilation, moralité, insertion professionnelle
- Art. 21-16 : Réduction à 2 ans si diplôme de l'enseignement supérieur français
- Art. 21-7 : Droit du sol — enfant né en France de parents étrangers, nationalité à 18 ans (résidence ≥ 5 ans depuis 11 ans)
- Art. 21-11 : Réclamation anticipée dès 16 ans par l'enfant
- Art. 21-12 : Déclaration par les parents dès 13 ans (résidence ≥ 5 ans depuis 8 ans)

ÉLOIGNEMENT ET MESURES D'EXPULSION :
- Art. L611-1 à L611-3 : Obligation de quitter le territoire français (OQTF)
- Art. L612-1 à L612-12 : Délai de départ volontaire (30 jours en principe)
- Art. L613-1 à L613-7 : Interdiction de retour sur le territoire français (IRTF)
- Art. L631-1 à L631-3 : Expulsion (menace grave à l'ordre public)
- Art. L632-1 : Catégories protégées contre l'expulsion (résidents > 10 ans, mineurs, etc.)
- Art. L741-1 à L744-11 : Rétention administrative (centres de rétention, durée max 90 jours)

▸ CODE DU TRAVAIL — TRAVAILLEURS ÉTRANGERS

- Art. L5221-1 à L5221-11 : Autorisation de travail obligatoire pour les étrangers
- Art. L5221-2 : Titre de séjour autorisant le travail
- Art. L5221-5 : Opposition de la situation de l'emploi (sauf métiers en tension)
- Art. R5221-20 : Liste des métiers en tension (arrêté du 1er avril 2021, mis à jour)
- Art. L5221-7 : Étudiants étrangers — droit de travailler 60% de la durée annuelle (964h/an)
- Art. L8251-1 : Interdiction d'emploi d'étranger sans titre — sanctions employeur
- Art. L8252-1 à L8252-4 : Droits du salarié étranger en situation irrégulière (3 mois de salaire minimum si licencié)

▸ CODE DE LA SÉCURITÉ SOCIALE — PROTECTION SOCIALE

- Art. L160-1 : Protection universelle maladie (PUMa) — toute personne résidant en France de manière stable et régulière
- Art. L160-5 : Condition de résidence stable (> 3 mois)
- Art. L251-1 à L251-3 : Aide médicale d'État (AME) — étrangers en situation irrégulière résidant > 3 mois, sous conditions de ressources
- Art. L511-1 à L511-4 (CSS) : Allocations familiales — résidence régulière en France
- Art. L512-1 et L512-2 : Prestations familiales pour les enfants à charge
- Art. L821-1 : Allocation adulte handicapé (AAH) — titre de séjour requis
- Art. L861-1 : Complémentaire santé solidaire (CSS, ex-CMU-C)

▸ CODE DE LA CONSTRUCTION ET DE L'HABITATION — LOGEMENT

- Art. L822-1 à L822-5 : Conditions d'attribution des APL (aide personnalisée au logement)
- Art. L823-1 : Calcul de l'APL (revenus, loyer, composition du foyer)
- Art. L822-2 : Condition de régularité de séjour pour bénéficier des APL
- Art. L441-1 : Droit au logement social — conditions de séjour régulier
- Art. L300-1 : Droit au logement opposable (DALO) — applicable aux étrangers en situation régulière

▸ CODE MONÉTAIRE ET FINANCIER — DROIT AU COMPTE

- Art. L312-1 : Droit au compte bancaire — toute personne physique résidant en France ou de nationalité française
- Art. L312-1 al. 3 : Procédure Banque de France en cas de refus (désignation d'un établissement sous 1 jour ouvré)
- Art. D312-5 : Services bancaires de base gratuits (dépôt/retrait, virement, carte de paiement)

▸ CODE DE L'ÉDUCATION — SCOLARITÉ

- Art. L111-1 : Droit à l'éducation pour tous les enfants, sans distinction de nationalité
- Art. L131-1 : Instruction obligatoire de 3 à 16 ans (loi du 26 juillet 2019)
- Art. L131-5 : Inscription dans la commune de résidence
- Art. L612-3 : Accès à l'enseignement supérieur — procédure Campus France pour étudiants étrangers
- Art. D612-11 : Contribution vie étudiante et de campus (CVEC) — obligatoire

▸ CODE DE LA ROUTE — PERMIS DE CONDUIRE

- Art. R222-1 à R222-8 : Échange de permis étranger
- Art. R222-3 : Conditions d'échange (accord bilatéral, résidence normale en France, permis en cours de validité)
- Art. R222-6 : Délai d'échange — dans l'année suivant l'acquisition de la résidence normale (18 mois pour certains pays)
- Art. R222-2 : Reconnaissance du permis étranger pendant 1 an à compter de la résidence

▸ LOIS SPÉCIFIQUES IMPORTANTES

- Loi n°2024-42 du 26 janvier 2024 : Loi "immigration" — réforme du CESEDA (caution retour étudiant supprimée par le Conseil constitutionnel, contrat d'engagement au respect des principes de la République)
- Loi n°2018-778 du 10 septembre 2018 : Loi "asile et immigration" — réduction délai OFPRA, extension rétention
- Loi n°2015-925 du 29 juillet 2015 : Réforme du droit d'asile
- Loi n°2016-274 du 7 mars 2016 : Réforme du droit des étrangers (titre pluriannuel généralisé)
- Décret n°2021-360 du 31 mars 2021 : ANEF — dématérialisation des demandes de titre
- Arrêté du 1er avril 2021 : Liste des métiers en tension ouverts aux étrangers
- Convention de Genève du 28 juillet 1951 : Statut des réfugiés (art. 1A§2 : définition du réfugié)
- Protocole de New York du 31 janvier 1967 : Extension universelle de la Convention de Genève
- Directive 2011/95/UE : Qualification — normes de protection internationale (transposée en droit français)
- Règlement Dublin III (UE n°604/2013) : Détermination de l'État membre responsable de l'examen d'une demande d'asile

▸ RECOURS ET DROITS FONDAMENTAUX

- Art. L614-1 à L614-18 CESEDA : Recours contre l'OQTF devant le tribunal administratif (48h à 1 mois selon le cas)
- Art. L911-1 à L911-4 CESEDA : Droit à l'aide juridictionnelle pour les étrangers
- Art. L432-1 CESEDA : Intervention de la commission du titre de séjour (avis consultatif en cas de refus de certains titres)
- Art. 6 CEDH : Droit à un procès équitable
- Art. 8 CEDH : Droit au respect de la vie privée et familiale (souvent invoqué contre les OQTF)
- Art. 3 CEDH : Interdiction de la torture — principe de non-refoulement
- Art. 13 CEDH : Droit à un recours effectif
- Art. 14 CEDH : Interdiction de la discrimination

▸ ORGANISMES CLÉS ET ACRONYMES

- OFPRA : Office Français de Protection des Réfugiés et Apatrides — examine les demandes d'asile
- CNDA : Cour Nationale du Droit d'Asile — juridiction d'appel des décisions OFPRA
- OFII : Office Français de l'Immigration et de l'Intégration — CIR, visite médicale, ADA, CADA
- ANEF : Administration Numérique pour les Étrangers en France — portail en ligne pour les titres de séjour
- GUDA : Guichet Unique de Demande d'Asile (préfecture + OFII)
- CIR : Contrat d'Intégration Républicaine — obligatoire pour tout primo-arrivant (formation civique + linguistique)
- CPAM : Caisse Primaire d'Assurance Maladie
- CAF : Caisse d'Allocations Familiales
- ANTS : Agence Nationale des Titres Sécurisés (permis, CNI, passeport)
- DALO : Droit Au Logement Opposable
- PUMa : Protection Universelle Maladie
- AME : Aide Médicale d'État
- ADA : Allocation pour Demandeur d'Asile
- CADA : Centre d'Accueil de Demandeurs d'Asile
- OQTF : Obligation de Quitter le Territoire Français
- IRTF : Interdiction de Retour sur le Territoire Français
`;

// ─── Build system prompt with profile context ────────────────────────────────
function buildSystemPrompt(profile) {
  const lang = profile && ALLOWED_LANGS.has(profile.language) ? profile.language : 'fr';
  const langName = LANG_NAMES[lang] || 'français';

  // Nationality is a 2-letter ISO code; force a hard shape.
  const rawNat = sanitizeForPrompt(profile?.nationality, 3).toUpperCase();
  const safeNationality = /^[A-Z]{2,3}$/.test(rawNat) ? rawNat : 'inconnue';

  const rawSit = sanitizeForPrompt(profile?.situation, 32);
  const safeSituation = ALLOWED_SITUATIONS.has(rawSit) ? rawSit : 'inconnue';

  return `Tu es Boussole, un assistant IA intégré à l'application mobile "Boussole" — une application conçue pour aider les immigrants en France à naviguer dans les démarches administratives.

═══ TON RÔLE ═══
- Répondre aux questions sur la bureaucratie française (titres de séjour, carte Vitale, CAF, logement, travail, etc.)
- Donner des étapes claires et concrètes basées sur les procédures officielles
- Citer les articles de loi pertinents (CESEDA, Code civil, Code du travail, etc.) quand c'est utile
- Citer les sources officielles (service-public.fr, legifrance.gouv.fr) quand possible
- Aider l'utilisateur à naviguer dans l'application Boussole elle-même
- IMPORTANT : Réponds TOUJOURS en ${langName}

═══ CONNAISSANCE DE L'APPLICATION BOUSSOLE ═══
L'application possède 4 onglets principaux :
1. Accueil — Profil de l'utilisateur, guides recommandés selon sa situation, accès rapide
2. Guides — Liste complète de guides officiels pas-à-pas par catégorie (documents, santé, logement, travail, famille, finance, transport, éducation)
3. Chat IA — C'est ici que tu te trouves
4. Profil — Paramètres du compte, langue, nationalité, situation

═══ GUIDES DISPONIBLES DANS L'APP ═══
DOCUMENTS : Renouveler son titre de séjour (ANEF, 2-3 mois) ; Échanger son permis de conduire (ANTS)
SANTÉ : S'inscrire à la CPAM (ameli.fr)
LOGEMENT : Demander l'APL (caf.fr) ; CADA pour demandeurs d'asile (OFII)
TRAVAIL : S'inscrire à France Travail (francetravail.fr)
FAMILLE : Aides familiales CAF (allocations, PAJE, prime)
FINANCE : Ouvrir un compte bancaire (droit au compte) ; ADA (OFII)
ÉDUCATION : Inscrire un enfant à l'école ; Campus France ; Bourse CROUS
ASILE : OFPRA — demande de protection internationale

Si la question correspond à un guide, mentionne que l'utilisateur peut le consulter dans l'onglet "Guides".

${FRENCH_LEGAL_BASE}

═══ CONTEXTE UTILISATEUR ═══
Nationalité : ${safeNationality}
Situation : ${safeSituation}
Langue préférée : ${langName}

═══ RÈGLES ═══
- Sois concis et pratique, avec des étapes numérotées
- Indique toujours les documents nécessaires
- Mentionne les délais habituels
- Cite les articles de loi pertinents quand l'utilisateur pose une question juridique
- Ne cite pas systématiquement tous les articles — seulement ceux directement liés à la question
- Si l'utilisateur pose une question sur l'app, guide-le vers la bonne section
- Si tu n'es pas sûr d'une information, dis-le clairement et oriente vers la préfecture
- N'invente jamais d'informations juridiques — renvoie vers legifrance.gouv.fr en cas de doute
- Quand c'est pertinent, rappelle qu'un guide détaillé existe dans l'app`;
}

// ─── Build OpenAI/Groq-compatible message list ───────────────────────────────
function buildMessages({ profile, history, userMessage }) {
  const messages = [{ role: 'system', content: buildSystemPrompt(profile) }];

  const safeHistory = Array.isArray(history) ? history : [];
  safeHistory
    .filter(m => m && typeof m === 'object' && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .forEach(m => {
      messages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content.slice(0, MAX_HISTORY_MESSAGE_LEN),
      });
    });

  messages.push({ role: 'user', content: userMessage.slice(0, MAX_USER_MESSAGE_LEN) });
  return messages;
}

// Sleep helper
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Try to parse a delay (ms) from a Retry-After header (seconds or HTTP-date)
function retryAfterMs(headers) {
  const h = headers.get('retry-after');
  if (!h) return null;
  // numeric seconds
  const secs = Number(h);
  if (Number.isFinite(secs) && secs > 0) return Math.min(secs * 1000, 15000);
  // HTTP-date
  const date = Date.parse(h);
  if (!Number.isNaN(date)) {
    const ms = date - Date.now();
    return ms > 0 ? Math.min(ms, 15000) : null;
  }
  return null;
}

// ─── Call Groq with retry on 429/5xx ─────────────────────────────────────────
async function callGroqOnce(apiKey, messages) {
  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });
  } catch (networkErr) {
    const err = new Error('NETWORK_ERROR');
    err.code = 'NETWORK_ERROR';
    err.cause = networkErr?.message || 'unknown';
    throw err;
  }

  if (!response.ok) {
    let bodyText = '';
    try { bodyText = await response.text(); } catch { /* ignore */ }
    const err = new Error(`UPSTREAM_${response.status}`);
    err.code = `UPSTREAM_${response.status}`;
    err.upstreamStatus = response.status;
    err.upstreamBody = bodyText.slice(0, 500);
    err.retryAfterMs = retryAfterMs(response.headers);
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const err = new Error('INVALID_RESPONSE');
    err.code = 'INVALID_RESPONSE';
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    const err = new Error('EMPTY_RESPONSE');
    err.code = 'EMPTY_RESPONSE';
    throw err;
  }
  return text;
}

async function callGroq({ userMessage, history, profile }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error('GROQ_NOT_CONFIGURED');
    err.code = 'GROQ_NOT_CONFIGURED';
    throw err;
  }

  const messages = buildMessages({ profile, history, userMessage });

  // Retry once on 429 or transient 5xx — Groq free tier hits TPM caps quickly.
  // The retry is invisible to the user (caller waits for the resolved promise).
  try {
    return await callGroqOnce(apiKey, messages);
  } catch (err) {
    const code = err?.code || '';
    const retriable =
      code === 'UPSTREAM_429' ||
      code === 'UPSTREAM_500' ||
      code === 'UPSTREAM_502' ||
      code === 'UPSTREAM_503';
    if (!retriable) throw err;

    // Use Retry-After if Groq sent it, otherwise 4s for 429 and 1s for 5xx
    const delay = err.retryAfterMs ?? (code === 'UPSTREAM_429' ? 4000 : 1000);
    console.warn(`[groq] ${code} — retrying after ${delay}ms`);
    await sleep(delay);

    // Single retry. If it fails again, propagate the original error class.
    return await callGroqOnce(apiKey, messages);
  }
}

export {
  callGroq,
  buildSystemPrompt,
  sanitizeForPrompt,
  ALLOWED_LANGS,
  ALLOWED_SITUATIONS,
  MAX_USER_MESSAGE_LEN,
  MAX_HISTORY_MESSAGES,
};
