import { ChatMessage, UserProfile } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

const LANG_NAMES: Record<string, string> = {
  fr: 'français',
  en: 'English',
  pt: 'português',
  es: 'español',
  ar: 'العربية',
};

function buildSystemPrompt(profile?: UserProfile | null): string {
  const lang = profile?.language || 'fr';
  const langName = LANG_NAMES[lang] || 'français';

  return `Tu es Boussole, un assistant IA spécialisé dans l'aide aux immigrants en France.

Ton rôle :
- Répondre aux questions sur la bureaucratie française (titres de séjour, carte Vitale, CAF, logement, travail, etc.)
- Donner des étapes claires et concrètes basées sur les procédures officielles
- Citer les sources officielles (service-public.fr, legifrance.gouv.fr) quand possible
- IMPORTANT : Réponds TOUJOURS en ${langName}

Contexte utilisateur : nationalité ${profile?.nationality || 'inconnue'}, situation: ${profile?.situation || 'inconnue'}, langue préférée: ${langName}

Règles :
- Sois concis et pratique, avec des étapes numérotées
- Indique toujours les documents nécessaires
- Mentionne les délais habituels
- Si tu n'es pas sûr, dis-le clairement et oriente vers la préfecture ou le service compétent
- N'invente jamais d'informations juridiques`;
}

export async function callBoussoleAI(
  userMessage: string,
  history: ChatMessage[],
  profile?: UserProfile | null,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('API_NOT_CONFIGURED');
  }

  // Build conversation history in Gemini format
  const contents = history
    .filter(m => !m.isLoading && m.id !== '0')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(profile) }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from Gemini response
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text;
}
