/**
 * ─── Configuração da API Boussole ────────────────────────────────────────────
 *
 * DESENVOLVIMENTO LOCAL:
 *   - Emulador Android  : use 'http://10.0.2.2:3000'
 *   - Emulador iOS      : use 'http://localhost:3000'
 *   - Celular físico    : exporte EXPO_PUBLIC_API_URL com o IP da sua máquina
 *                         (ex: EXPO_PUBLIC_API_URL=http://192.168.1.42:3000)
 *
 * PRODUÇÃO:
 *   - Obrigatório definir EXPO_PUBLIC_API_URL com uma URL HTTPS válida.
 *   - O app RECUSA URLs http:// em builds de produção para evitar
 *     downgrade de TLS e man-in-the-middle.
 */

import { Platform } from 'react-native';

const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

function pickDevDefault(): string {
  // Safe localhost defaults for each emulator.
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

function resolveApiBaseUrl(): string {
  if (ENV_URL && typeof ENV_URL === 'string' && ENV_URL.trim()) {
    const url = ENV_URL.trim().replace(/\/+$/, '');
    if (!__DEV__ && !url.startsWith('https://')) {
      // Fail loudly in production rather than silently downgrading.
      throw new Error(
        '[api] EXPO_PUBLIC_API_URL must use HTTPS in production builds',
      );
    }
    return url;
  }
  if (!__DEV__) {
    // In production, refuse to fall through to a dev default.
    throw new Error(
      '[api] EXPO_PUBLIC_API_URL is not configured for production build',
    );
  }
  return pickDevDefault();
}

export const API_BASE_URL = resolveApiBaseUrl();

export const API_ENDPOINTS = {
  chat:   `${API_BASE_URL}/api/chat`,
  health: `${API_BASE_URL}/api/health`,
  guides: `${API_BASE_URL}/api/guides`,
};
