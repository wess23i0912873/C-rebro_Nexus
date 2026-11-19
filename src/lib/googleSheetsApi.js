/**
 * Cliente de comunicação com o Google Apps Script (Web App)
 * 
 * Utiliza requisições POST com Content-Type text/plain para todas as operações
 * (login, leitura e sincronização em lote).
 * 
 * Por que text/plain com POST?
 * 1. O cabeçalho 'Content-Type: text/plain' é considerado CORS-safelisted pelo navegador,
 *    dispensando a requisição de pré-vôo OPTIONS (que o Apps Script não suporta nativamente).
 * 2. O Apps Script processa o POST e responde com um redirecionamento 302 para
 *    script.googleusercontent.com, que devolve os cabeçalhos 'Access-Control-Allow-Origin: *'.
 * 3. O fetch padrão com mode: 'cors' segue o redirecionamento e permite ler a resposta JSON
 *    diretamente, eliminando as limitações do JSONP e da escrita cega com no-cors.
 */

/**
 * Executa uma chamada POST para o endpoint do Google Apps Script
 * @param {string} url - URL do Web App (.../exec)
 * @param {object} payload - Dados enviados no corpo da requisição
 * @returns {Promise<any>}
 */
async function postToAppsScript(url, payload) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new Error('A URL da Planilha Google (VITE_SHEETS_URL) não está configurada.');
  }

  const cleanUrl = url.trim();

  let response;
  try {
    response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch (_networkError) {
    throw new Error('Falha de rede ao conectar com a Planilha Google. Verifique sua conexão.');
  }

  if (!response.ok) {
    throw new Error(`O servidor retornou erro HTTP ${response.status} (${response.statusText}).`);
  }

  let result;
  try {
    result = await response.json();
  } catch (_parseError) {
    throw new Error('Resposta inválida do Apps Script. Verifique se o Web App foi publicado com acesso para "Qualquer pessoa".');
  }

  if (!result || result.success !== true) {
    const errorMsg = result?.error || 'Erro desconhecido retornado pelo Apps Script.';
    const error = new Error(errorMsg);

    // Identifica se foi erro de sessão/autenticação
    if (/sessão|token|autoriza|login|acesso negado/i.test(errorMsg)) {
      error.isAuthError = true;
    }

    throw error;
  }

  return result;
}

/**
 * Autentica com o Google ID Token e obtém um token de sessão assinado pelo Apps Script
 * @param {string} url - URL do Web App
 * @param {string} idToken - Google Identity Services credential JWT
 * @returns {Promise<{ sessionToken: string, email: string, name: string, picture: string, expiresAt: number }>}
 */
export async function loginWithGoogle(url, idToken) {
  const result = await postToAppsScript(url, {
    action: 'login',
    idToken,
  });

  return {
    sessionToken: result.sessionToken,
    email: result.email,
    name: result.name || '',
    picture: result.picture || '',
    expiresAt: result.expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Lê todas as abas da Planilha Google sob a sessão do usuário autenticado
 * @param {string} url - URL do Web App
 * @param {string} sessionToken - Token de sessão assinado
 * @returns {Promise<{ accounts: Array, cards: Array, transactions: Array, subscriptions: Array, categories: Array }>}
 */
export async function readSheetData(url, sessionToken) {
  const result = await postToAppsScript(url, {
    action: 'read',
    sessionToken,
  });

  return result.data;
}

/**
 * Aplica sincronização em três vias (base x local x remoto) e retorna o estado atualizado
 * @param {string} url - URL do Web App
 * @param {string} sessionToken - Token de sessão assinado
 * @param {object} data - Dados locais atuais (snapshot local)
 * @param {object} base - Dados da última leitura sincronizada (snapshot base)
 * @returns {Promise<{ accounts: Array, cards: Array, transactions: Array, subscriptions: Array, categories: Array }>}
 */
export async function writeSheetData(url, sessionToken, data, base) {
  const result = await postToAppsScript(url, {
    action: 'sync',
    sessionToken,
    base,
    data,
  });

  // O Apps Script v2.0 já devolve o estado consolidado 'data' na mesma transação sob LockService
  return result.data;
}
