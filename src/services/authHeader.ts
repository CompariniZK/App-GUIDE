/**
 * authHeader — builds the Authorization header for calls to our backend.
 *
 * Protected backend routes (chat, groq, cities) require a valid Supabase
 * session. We read the current access token and return it as a Bearer header.
 * Returns an empty object if there's no session, so callers can spread it
 * unconditionally without breaking unauthenticated/dev flows.
 */
import { supabase } from './supabase';

export async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
