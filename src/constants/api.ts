/**
 * ─── Configuração da API Boussole ────────────────────────────────────────────
 *
 * DESENVOLVIMENTO LOCAL:
 *   - No emulador Android/iOS:  use 'http://10.0.2.2:3000'
 *   - No celular físico:        use 'http://SEU_IP_LOCAL:3000'
 *     → Descubra seu IP: abra o terminal e rode  ipconfig  (Windows)
 *     → Copie o "Endereço IPv4" (ex: 192.168.1.42)
 *
 * PRODUÇÃO:
 *   - Troque pela URL do seu servidor hospedado (Railway, Render, etc.)
 */

const DEV_IP = '192.168.1.124'; // ← Troque pelo seu IP local se testar em celular físico

export const API_BASE_URL = __DEV__
  ? `http://${DEV_IP}:3000`
  : 'https://sua-api-em-producao.com'; // ← Preencher quando for ao ar

export const API_ENDPOINTS = {
  chat:   `${API_BASE_URL}/api/chat`,
  health: `${API_BASE_URL}/api/health`,
  guides: `${API_BASE_URL}/api/guides`,
};
