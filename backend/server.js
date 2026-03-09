import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Anthropic (Claude)
const client = new Anthropic();

// Middleware
app.use(cors());
app.use(express.json());

// ─── Knowledge Base for RAG ────────────────────────────────────────────────────
// In production, this would come from a database with pgvector embeddings
// For MVP, we'll use a simple in-memory retrieval based on keywords

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

// ─── Helper Functions ──────────────────────────────────────────────────────
function retrieveRelevantDocuments(query) {
  /**
   * Simple keyword-based retrieval
   * In production: use vector embeddings (LangChain + pgvector)
   */
  const keywords = query.toLowerCase().split(' ');
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

// ─── API Endpoints ────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * Chat avec l'IA Boussole
 *
 * Body:
 * {
 *   "message": "Comment renouveler mon titre de séjour ?",
 *   "language": "fr"  // optional: fr, en, pt, es, ar
 * }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language = 'fr' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Step 1: Retrieve relevant documents
    const relevantDocs = retrieveRelevantDocuments(message);

    // Step 2: Build system prompt with context
    const systemPrompt = buildSystemPrompt(relevantDocs);

    // Step 3: Call Claude API
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022', // Using Haiku for cost efficiency (~$0.001 per query)
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const assistantMessage = response.content[0].text;

    // Step 4: Extract sources cited by Claude
    const sources = relevantDocs.map(doc => ({
      title: doc.title,
      category: doc.category,
    }));

    res.json({
      reply: assistantMessage,
      sources: sources.length > 0 ? sources : null,
      language: language,
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: process.env.NODE_ENV });
});

/**
 * GET /api/guides
 * Get all guides in the knowledge base
 */
app.get('/api/guides', (req, res) => {
  const guides = KNOWLEDGE_BASE.map(({ id, title, category }) => ({
    id,
    title,
    category,
  }));
  res.json({ guides });
});

// ─── Start Server ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Boussole Backend running on http://localhost:${PORT}`);
  console.log(`📝 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`💚 Health: GET http://localhost:${PORT}/api/health`);
});
