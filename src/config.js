/**
 * Configuração global do Cérebro Nexus
 * 
 * As variáveis VITE_SHEETS_URL e VITE_GOOGLE_CLIENT_ID não são segredos
 * e são injetadas em tempo de build pelo Vite (localmente via .env ou no GitHub Actions via Variables).
 */
export const CONFIG = {
  sheetsUrl: (import.meta.env.VITE_SHEETS_URL || '').trim(),
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim(),
};
