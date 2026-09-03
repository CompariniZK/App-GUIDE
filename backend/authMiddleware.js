// ============================================================================
// authMiddleware.js — require a valid Supabase session on protected API routes
// ----------------------------------------------------------------------------
// The client sends "Authorization: Bearer <supabase access_token>". We verify
// it with Supabase (which checks the JWT signature + expiry) and attach the
// resolved user to req.user. This stops anonymous callers from burning the
// Claude/Groq quota or scraping the cities endpoints.
//
// Fail policy:
//   • production without Supabase env → 503 (fail CLOSED, never open a hole)
//   • dev without Supabase env        → pass through (local convenience)
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const IS_PROD = (process.env.NODE_ENV || 'development') === 'production';

let _client = null;
function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export function authConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export async function requireAuth(req, res, next) {
  const supabase = getClient();
  if (!supabase) {
    if (IS_PROD) return res.status(503).json({ error: 'Auth not configured.' });
    return next(); // dev only: no Supabase keys locally → don't block
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
    req.user = data.user; // available to downstream handlers
    return next();
  } catch {
    return res.status(401).json({ error: 'Could not verify session.' });
  }
}
