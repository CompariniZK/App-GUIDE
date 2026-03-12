import { ChatMessage, UserProfile } from '../types';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

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
  if (!ANTHROPIC_API_KEY) {
    throw new Error('API_NOT_CONFIGURED');
  }

  const messages = history
    .filter(m => !m.isLoading && m.id !== '0')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  messages.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(profile),
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Claude API error:', error);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}
