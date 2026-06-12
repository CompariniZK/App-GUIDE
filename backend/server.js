import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { callGroq, ALLOWED_LANGS as GROQ_ALLOWED_LANGS, ALLOWED_SITUATIONS, MAX_USER_MESSAGE_LEN as GROQ_MAX_MSG, MAX_HISTORY_MESSAGES as GROQ_MAX_HIST } from './groqService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// ─── Fail-fast on missing secrets ──────────────────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('FATAL: ANTHROPIC_API_KEY is not set. Refusing to start.');
  process.exit(1);
}
if (!process.env.GROQ_API_KEY) {
  // Warn-only in dev so the rest of the API still works; fail-fast in prod.
  if (IS_PROD) {
    console.error('FATAL: GROQ_API_KEY is not set in production. Refusing to start.');
    process.exit(1);
  } else {
    console.warn('⚠️  GROQ_API_KEY not set — /api/groq/chat will return 503.');
  }
}

// Initialize Anthropic (Claude)
const client = new Anthropic();

// ─── Security headers ──────────────────────────────────────────────────────────
// Helmet sets a sensible default of security headers
// (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.)
app.use(helmet());

// ─── CORS: strict allowlist ────────────────────────────────────────────────────
// In production, ONLY the origins listed in ALLOWED_ORIGINS can call the API.
// React Native / Expo apps do not send a browser Origin header, so requests
// without an Origin are allowed (the rate limiter still covers them).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Native mobile apps → no Origin header → allow
      if (!origin) return callback(null, true);
      if (!IS_PROD) return callback(null, true); // Dev: allow everything
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: origin not allowed'));
    },
    methods: ['GET', 'POST'],
    credentials: false,
    maxAge: 600,
  }),
);

// ─── Body size limit ───────────────────────────────────────────────────────────
// 16KB is plenty for a chat request and shuts down payload-based DoS.
app.use(express.json({ limit: '16kb' }));

// ─── Global rate limit (per-IP) ────────────────────────────────────────────────
// Hard cap the whole API. Tune in prod; dev gets a generous allowance.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: IS_PROD ? 60 : 300, // req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use(globalLimiter);

// Tighter limit specifically for the expensive /api/chat endpoint
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: IS_PROD ? 10 : 60, // req/min per IP on chat
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Chat rate limit reached. Please try again in a minute.' },
});

// ─── Input limits ──────────────────────────────────────────────────────────────
const MAX_MESSAGE_LEN = 1000;
const ALLOWED_LANGS = new Set(['fr', 'en', 'pt', 'es', 'ar']);

// ─── Knowledge Base for RAG ────────────────────────────────────────────────────
const KNOWLEDGE_BASE = [
  {
    id: 'titre-sejour',
    title: 'Renouvellement du Titre de Séjour',
    category: 'documents',
    content: `
Pour renouveler votre titre de séjour en France :
1. Commencez la démarche 2 mois avant l'expiration (pas au-delà de 3 mois)
2. Créez un compte sur administration-etrangers-en-france.interieur.gouv.fr (ANEF)
3. Rassemblez les documents : titre actuel, passeport, justificatif domicile, photos, timbre fiscal
4. Remplissez le formulaire en ligne (45 minutes)
5. Recevez un récépissé par email (24-72h) — ce document vous permet de continuer à travailler
6. Délai total : 2-3 mois

Source officielle : administration-etrangers-en-france.interieur.gouv.fr
    `,
  },
  {
    id: 'apl-logement',
    title: 'APL — Aide au Logement',
    category: 'housing',
    content: `
Pour demander l'APL (aide au logement) :
1. Vérifiez l'éligibilité sur caf.fr (le logement doit être conventionné)
2. Créez votre compte CAF (vous devez avoir un numéro CPAM)
3. Faites la demande en ligne sur caf.fr
4. Documents : contrat bail, dernier avis imposition, RIB, titre de séjour
5. Délai : 2-4 semaines
6. L'APL est versée au propriétaire ou à vous-même

Source officielle : www.caf.fr
    `,
  },
  {
    id: 'cpam-sante',
    title: 'Inscription à la Sécurité Sociale (CPAM)',
    category: 'health',
    content: `
Pour s'inscrire à la CPAM (Sécurité Sociale) :
1. Créez un compte sur ameli.fr
2. Vérifiez votre caisse CPAM selon votre lieu de résidence
3. Rassemblez : titre de séjour, passeport, justificatif domicile, acte naissance traduit, RIB
4. Envoyez le dossier par courrier ou en agence CPAM
5. Vous recevrez un numéro de sécurité sociale provisoire
6. Désignez un médecin traitant (obligatoire pour rembursement 70%)
7. Recevez votre carte Vitale (quelques semaines)

En attendant : utilisez l'attestation de droits sur ameli.fr — même valeur que la carte

Source officielle : www.ameli.fr
    `,
  },
  {
    id: 'banque-compte',
    title: 'Ouvrir un Compte Bancaire',
    category: 'finance',
    content: `
Options pour ouvrir un compte bancaire en France :

OPTION 1 - Banques Mobiles (Plus facile pour immigrants) :
- Revolut, Wise, N26 : 10 minutes, besoin passeport + selfie
- Aucun justificatif de domicile requis
- Idéal pour commencer

OPTION 2 - Nickel (Bureau de Tabac) :
- Disponible chez les buralistes
- Besoin : pièce identité + 20€
- IBAN français immédiat

OPTION 3 - Banques Traditionnelles (BNP, Crédit Agricole, etc.) :
- Besoin : titre séjour, justificatif domicile, justificatif revenus
- Plus de services mais plus exigeant

IMPORTANT : Si rejeté, invoquez le "Droit au Compte" auprès de la Banque de France
— c'est un droit légal et la banque DOIT ouvrir un compte de base

Source officielle : www.banque-france.fr/particuliers/proteger-vos-interets/droit-au-compte
    `,
  },
  {
    id: 'permis-conduire',
    title: 'Échange du Permis de Conduire',
    category: 'transport',
    content: `
Pour échanger votre permis étranger en France :
1. Vérifiez si votre pays a un accord d'échange (Brésil OUI, Maroc OUI, etc.)
2. Si oui : pas d'examen, simple échange
3. Si non : vous devez repasser le permis en France
4. Démarche en ligne : permisdeconduire.ants.gouv.fr
5. Documents : permis original + traduction assermentée, titre de séjour, justificatif domicile, timbre 25€
6. Envoyez par courrier recommandé
7. Délai : 3-6 mois
8. Vous recevez : permis français valable 15 ans + retour permis étranger

Le récépissé vous permet de conduire pendant l'instruction

Source officielle : permisdeconduire.ants.gouv.fr
    `,
  },
  {
    id: 'france-travail',
    title: 'France Travail — Allocations Chômage',
    category: 'work',
    content: `
Pour s'inscrire à France Travail et toucher l'ARE (chômage) :

ÉLIGIBILITÉ :
- Vous devez avoir travaillé 6 mois sur les 24 derniers mois
- Perte involontaire d'emploi (licenciement/fin CDD)
- Démission généralement PAS éligible (sauf démission "légitime")

INSCRIPTION :
1. Allez sur francetravail.fr
2. Cliquez "Je m'inscris" dans les 12 mois après fin contrat
3. Besoin : titre séjour avec droit travail, attestation employeur Pôle Emploi, RIB, CV

APRÈS INSCRIPTION :
- Entretien avec conseiller pour établir PPAE (plan d'emploi)
- ACTUALISATION MENSUELLE obligatoire : indique si vous avez travaillé ce mois
- Oubli = blocage allocations

Source officielle : www.francetravail.fr
    `,
  },
];

// ─── City-Specific Knowledge ─────────────────────────────────────────────────
const CITY_CONTEXTS = {
  'la-roche-sur-yon': `
CONTEXTE LOCAL — La Roche-sur-Yon (Vendée, 85) :

SERVICES UTILES :
- CCAS : 02 51 47 48 57 | 10 rue Delille | Lun-Mer 8h30-17h30, Jeu 8h30-12h30, Ven 8h30-17h00
- Préfecture de la Vendée : 02 51 36 70 85 | 29 rue Delille | www.vendee.gouv.fr
- France Terre d'Asile (SPADA) : accueil des demandeurs d'asile
- Cimade-Vendée : aide juridique et accès aux droits des migrants
- CAF de la Vendée : www.caf.fr (département 85)
- CPAM de la Vendée : www.ameli.fr (département 85)

INFORMATIONS LOCALES :
- Population : ~55 000 habitants dont ~3 954 étrangers (7%)
- La préfecture de la Vendée gère les titres de séjour pour tout le département
- Les rendez-vous ANEF sont traités à la préfecture de La Roche-sur-Yon

Quand c'est pertinent, mentionne ces ressources locales avec leurs coordonnées exactes.
`,
};

// Whitelist of valid city IDs (prevents prompt-injection via cityId)
const ALLOWED_CITY_IDS = new Set(Object.keys(CITY_CONTEXTS));

// ─── Helper Functions ──────────────────────────────────────────────────────
function retrieveRelevantDocuments(query) {
  /**
   * Simple keyword-based retrieval
   * In production: use vector embeddings (LangChain + pgvector)
   */
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = KNOWLEDGE_BASE.map(doc => {
    const docText = (doc.title + ' ' + doc.content).toLowerCase();
    const matches = keywords.filter(kw => docText.includes(kw)).length;
    return { ...doc, relevance: matches };
  });

  return scored
    .filter(doc => doc.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3) // Top 3 results
    .map(({ relevance, ...doc }) => doc);
}

function buildSystemPrompt(retrievedDocs) {
  /**
   * System prompt for Claude to answer based on retrieved documents
   * This is the "Retrieval Augmented Generation" (RAG) pattern
   */
  let context = 'Vous êtes un assistant AI pour le guide de bureaucratie française (Boussole).';
  context += '\n\nBasez vos réponses EXCLUSIVEMENT sur les informations officielles ci-dessous.';
  context += '\n\nSi vous n\'avez pas d\'information, dites clairement que ce sujet n\'est pas couvert.';
  context += '\n\nCitez TOUJOURS la source officielle (ex: service-public.fr, ameli.fr).';

  if (retrievedDocs.length > 0) {
    context += '\n\n=== DOCUMENTS OFFICIELS ===\n\n';
    retrievedDocs.forEach((doc, i) => {
      context += `Sujet ${i + 1}: ${doc.title} (${doc.category})\n`;
      context += `${doc.content}\n\n`;
    });
  }

  return context;
}

// ─── Redact secrets from log lines ─────────────────────────────────────────────
function redactSecrets(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[REDACTED_ANTHROPIC_KEY]')
    .replace(/gsk_[A-Za-z0-9]{20,}/g, '[REDACTED_GROQ_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');
}

function safeLog(label, err) {
  const msg = err?.message || String(err);
  console.error(`[${label}]`, redactSecrets(msg));
}

// ─── API Endpoints ────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * Chat avec l'IA Boussole
 */
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const { message, language, cityId } = body;

    // ─── Strict input validation ─────────────────────────────────────────────
    if (typeof message !== 'string') {
      return res.status(400).json({ error: 'message must be a string' });
    }
    const trimmed = message.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (trimmed.length > MAX_MESSAGE_LEN) {
      return res.status(413).json({
        error: `message too long (max ${MAX_MESSAGE_LEN} characters)`,
      });
    }

    const safeLang = typeof language === 'string' && ALLOWED_LANGS.has(language)
      ? language
      : 'fr';

    // Only accept cityId if it's a known entry (prevents cityId-injection
    // from dumping arbitrary strings into the system prompt).
    const safeCityId = typeof cityId === 'string' && ALLOWED_CITY_IDS.has(cityId)
      ? cityId
      : null;

    // Step 1: Retrieve relevant documents
    const relevantDocs = retrieveRelevantDocuments(trimmed);

    // Step 2: Build system prompt with context + city
    const cityContext = safeCityId ? CITY_CONTEXTS[safeCityId] : '';
    const systemPrompt = buildSystemPrompt(relevantDocs) + cityContext;

    // Step 3: Call Claude API
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: trimmed,
        },
      ],
    });

    const assistantMessage = response.content[0]?.text;
    if (typeof assistantMessage !== 'string' || !assistantMessage) {
      throw new Error('Empty response from Claude');
    }

    // Step 4: Extract sources cited by Claude
    const sources = relevantDocs.map(doc => ({
      title: doc.title,
      category: doc.category,
    }));

    res.json({
      reply: assistantMessage,
      sources: sources.length > 0 ? sources : null,
      language: safeLang,
    });
  } catch (error) {
    // Log full (redacted) error server-side; return generic message to client.
    safeLog('chat', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/groq/chat
 * Chat avec l'IA Boussole (Groq backend).
 *
 * Body:
 *   {
 *     message:  string  (required, <= 1000 chars),
 *     history:  Array<{ role: 'user'|'assistant', content: string }>  (optional),
 *     profile?: {
 *       nationality?: string,   // 2-3 letter ISO code
 *       situation?:   string,   // one of ALLOWED_SITUATIONS
 *       language?:    'fr'|'en'|'pt'|'es'|'ar'
 *     }
 *   }
 * Returns:
 *   { reply: string }   on success
 *   { error: string }   on failure (no upstream details leaked)
 */
app.post('/api/groq/chat', chatLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const { message, history, profile } = body;

    // ─── Input validation ──────────────────────────────────────────────────
    if (typeof message !== 'string') {
      return res.status(400).json({ error: 'message must be a string' });
    }
    const trimmed = message.trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (trimmed.length > GROQ_MAX_MSG) {
      return res.status(413).json({ error: `message too long (max ${GROQ_MAX_MSG})` });
    }

    // History: must be array of plain {role, content}; we cap + sanitize in service
    let safeHistory = [];
    if (Array.isArray(history)) {
      if (history.length > GROQ_MAX_HIST) {
        return res.status(413).json({ error: `history too long (max ${GROQ_MAX_HIST})` });
      }
      safeHistory = history
        .filter(m => m && typeof m === 'object' && typeof m.content === 'string')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));
    }

    // Profile: shape coerce — anything we don't recognize is dropped
    const safeProfile = {};
    if (profile && typeof profile === 'object') {
      if (typeof profile.nationality === 'string') safeProfile.nationality = profile.nationality;
      if (typeof profile.situation === 'string') safeProfile.situation = profile.situation;
      if (typeof profile.language === 'string' && GROQ_ALLOWED_LANGS.has(profile.language)) {
        safeProfile.language = profile.language;
      }
    }

    // ─── Call Groq ────────────────────────────────────────────────────────
    const reply = await callGroq({
      userMessage: trimmed,
      history: safeHistory,
      profile: safeProfile,
    });

    res.json({ reply });
  } catch (error) {
    // Log full (redacted) error server-side
    const code = error?.code || 'UNKNOWN';
    if (code.startsWith('UPSTREAM_')) {
      safeLog('groq.upstream', `${code} ${redactSecrets(error.upstreamBody || '')}`);
    } else {
      safeLog('groq', error);
    }

    // Client-side: opaque error codes, no upstream details
    if (code === 'GROQ_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    if (code === 'NETWORK_ERROR') {
      return res.status(502).json({ error: 'Upstream network error' });
    }
    if (code === 'UPSTREAM_429') {
      return res.status(429).json({ error: 'Rate limited by upstream, please retry' });
    }
    if (code.startsWith('UPSTREAM_4')) {
      return res.status(502).json({ error: 'Upstream error' });
    }
    if (code.startsWith('UPSTREAM_5')) {
      return res.status(502).json({ error: 'Upstream unavailable' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/health
 * Health check — intentionally minimal, does not leak runtime info.
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * GET /api/guides
 * Get all guides in the knowledge base (public metadata only)
 */
app.get('/api/guides', (_req, res) => {
  const guides = KNOWLEDGE_BASE.map(({ id, title, category }) => ({
    id,
    title,
    category,
  }));
  res.json({ guides });
});

// ─── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Centralized error handler (last middleware) ──────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  safeLog('unhandled', err);
  // CORS error → 403 instead of 500
  if (err?.message?.startsWith('CORS')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ────────────────────────────────────────────────────────
// Bind to 0.0.0.0 explicitly so the server is reachable from outside the
// container in cloud environments (Railway, Render, Fly.io).
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Boussole Backend running on http://localhost:${PORT}  [${NODE_ENV}]`);
  console.log(`📝 Chat (Claude/RAG): POST http://localhost:${PORT}/api/chat`);
  console.log(`🤖 Chat (Groq):       POST http://localhost:${PORT}/api/groq/chat`);
  console.log(`💚 Health:            GET  http://localhost:${PORT}/api/health`);
  if (IS_PROD && ALLOWED_ORIGINS.length === 0) {
    console.warn('⚠️  ALLOWED_ORIGINS is empty in production — browser requests will be blocked.');
  }
});

// ─── Defensive crash handlers ──────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  safeLog('unhandledRejection', reason);
});
process.on('uncaughtException', (err) => {
  safeLog('uncaughtException', err);
});
