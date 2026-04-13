import { ChatMessage, UserProfile } from '../types';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
  if (!GROQ_API_KEY) {
    throw new Error('API_NOT_CONFIGURED');
  }

  // Build conversation in OpenAI-compatible format (Groq uses the same format)
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: buildSystemPrompt(profile) },
  ];

  // Add conversation history
  history
    .filter(m => !m.isLoading && m.id !== '0')
    .forEach(m => {
      messages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      });
    });

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Groq API error:', error);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Empty response from AI');
  }

  return text;
}
