import { ChatMessage, UserProfile } from '../types';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `Tu es Boussole, un assistant IA spécialisé dans l'aide aux immigrants en France.

Ton rôle :
- Répondre aux questions sur la bureaucratie française (titres de séjour, carte Vitale, CAF, logement, travail, etc.)
- Donner des étapes claires et concrètes basées sur les procédures officielles
- Citer les sources officielles (service-public.fr, legifrance.gouv.fr) quand possible
- Répondre dans la langue de l'utilisateur (français, anglais, portugais, espagnol ou arabe)

Règles :
- Sois concis et pratique, avec des étapes numérotées
- Indique toujours les documents nécessaires
- Mentionne les délais habituels
- Si tu n'es pas sûr, dis-le clairement et oriente vers la préfecture ou le service compétent
- N'invente jamais d'informations juridiques`;

export async function callBoussoleAI(
  userMessage: string,
  history: ChatMessage[],
  profile?: UserProfile | null,
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return (
      'L\'assistant IA n\'est pas encore configuré.\n\n' +
      'Pour l\'activer, ajoutez votre clé API Anthropic dans le fichier `.env` :\n' +
      '`EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxxxx`\n\n' +
      'En attendant, consultez nos **Guides** dans l\'onglet dédié !'
    );
  }

  const contextInfo = profile
    ? `\nContexte utilisateur : nationalité ${profile.nationality}, situation: ${profile.situation}, langue: ${profile.language}`
    : '';

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
      system: SYSTEM_PROMPT + contextInfo,
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
