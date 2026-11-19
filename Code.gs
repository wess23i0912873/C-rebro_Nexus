/**
 * CÉREBRO NEXUS — Google Apps Script Backend (v2.0)
 * 
 * Banco de dados baseado em Planilha Google com autenticação Google OAuth (GIS),
 * emissão de tokens de sessão HMAC-SHA256 com validade de 30 dias, sincronização
 * em três vias com LockService e isolamento para evolução multiusuário.
 */

// ─── ESTRUTURA DAS ABAS E CABEÇALHOS ───────────────────────────────────────────
const SHEETS = {
  accounts: {
    name: 'Accounts',
    headers: ['id', 'name', 'type', 'icon', 'image', 'balance', 'initialBalance'],
  },
  cards: {
    name: 'Cards',
    headers: [
      'id', 'name', 'owner', 'limitTotal', 'limitUsed', 'dueDay', 'digits',
      'image', 'colorGradient', 'borderColor', 'accent',
    ],
  },
  transactions: {
    name: 'Transactions',
    headers: [
      'id', 'date', 'type', 'category', 'accountId', 'destinationAccountId',
      'payee', 'product', 'value', 'status', 'paymentMethod', 'cardId',
      'cardName', 'origin', 'purchaseId', 'installmentNumber',
      'installmentsTotal', 'installments', 'currentInstallment', 'installmentValue',
      'purchaseDate', 'totalPurchaseValue', 'description',
    ],
  },
  subscriptions: {
    name: 'Subscriptions',
    headers: ['id', 'name', 'type', 'emoji', 'value'],
  },
  categories: {
    name: 'Categories',
    headers: ['id', 'name', 'value', 'label', 'type', 'emoji'],
  },
};

// Duração da sessão: 30 dias em milissegundos
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Cria ou garante a existência das abas e cabeçalhos na planilha ativa.
 * Pode ser executada manualmente uma vez no editor do Apps Script.
 */
function setupSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (entity) {
    ensureSheet_(entity, spreadsheet);
  });
}

/**
 * Endpoint GET: status da API para validação manual no navegador.
 */
function doGet(e) {
  return output_({
    success: true,
    message: 'Cérebro Nexus API online. As requisições devem ser feitas via POST com Content-Type text/plain.',
    version: '2.0.0'
  });
}

/**
 * Endpoint POST: processa login, leitura e sincronização com CORS liberado.
 */
function doPost(e) {
  try {
    const rawContent = (e && e.postData && e.postData.contents) || '{}';
    const request = JSON.parse(rawContent);
    const action = request.action || 'sync';

    // ── 1. AÇÃO DE LOGIN (Validação do Google ID Token) ───────────────────────
    if (action === 'login') {
      return handleLogin_(request.idToken);
    }

    // ── 2. DEMAIS AÇÕES: Requerem Sessão Válida (HMAC-SHA256) ─────────────────
    const sessionToken = request.sessionToken || request.token;
    const userEmail = verifySessionToken_(sessionToken);

    // Obtém a planilha do usuário (isolamento multiusuário)
    const spreadsheet = getSpreadsheetForUser_(userEmail);

    // ── 2.1 AÇÃO DE LEITURA (READ) ───────────────────────────────────────────
    if (action === 'read') {
      const lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
        const data = {};
        Object.keys(SHEETS).forEach(function (entity) {
          data[entity] = readRecords_(entity, spreadsheet);
        });
        return output_({ success: true, data: data, email: userEmail });
      } finally {
        lock.releaseLock();
      }
    }

    // ── 2.2 AÇÃO DE SINCRONIZAÇÃO (SYNC - Três Vias) ─────────────────────────
    if (action === 'sync') {
      const lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
        applySync_(request.base, request.data, spreadsheet);
        // Retorna imediatamente o estado consolidado após a escrita sob o mesmo lock
        const updatedData = {};
        Object.keys(SHEETS).forEach(function (entity) {
          updatedData[entity] = readRecords_(entity, spreadsheet);
        });
        return output_({ success: true, data: updatedData, email: userEmail });
      } finally {
        lock.releaseLock();
      }
    }

    // ── 2.3 AÇÕES INDIVIDUAIS LEGADAS (save, edit, delete) ───────────────────
    if (action === 'save' || action === 'edit') {
      const lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
        const entity = normalizeEntity_(request.entity);
        const record = request.record;
        if (!record || record.id === undefined || record.id === null) {
          throw new Error('O registro precisa ter um id.');
        }
        const records = readRecords_(entity, spreadsheet);
        const index = records.findIndex(function (item) { return String(item.id) === String(record.id); });
        if (index < 0) records.push(record);
        else records[index] = record;
        writeRecords_(entity, records, spreadsheet);
        return output_({ success: true });
      } finally {
        lock.releaseLock();
      }
    }

    if (action === 'delete') {
      const lock = LockService.getScriptLock();
      lock.waitLock(30000);
      try {
        const entity = normalizeEntity_(request.entity);
        if (request.id === undefined || request.id === null) {
          throw new Error('Informe o id do registro a excluir.');
        }
        const records = readRecords_(entity, spreadsheet).filter(function (item) {
          return String(item.id) !== String(request.id);
        });
        writeRecords_(entity, records, spreadsheet);
        return output_({ success: true });
      } finally {
        lock.releaseLock();
      }
    }

    throw new Error('Ação inválida. Use login, read ou sync.');
  } catch (error) {
    return output_({ success: false, error: error.message || String(error) });
  }
}

// ─── AUTENTICAÇÃO E SESSÃO (GOOGLE OAUTH + HMAC-SHA256) ───────────────────────

/**
 * Valida o Google ID token contra o endpoint oficial do Google OAuth2
 * e verifica se o e-mail está na lista de permissões.
 */
function handleLogin_(idToken) {
  if (!idToken) {
    throw new Error('ID Token do Google não fornecido.');
  }

  const clientId = getScriptProperty_('GOOGLE_CLIENT_ID');
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID não configurado em Script Properties.');
  }

  // Validação segura chamando a API do Google
  const tokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  const response = UrlFetchApp.fetch(tokenInfoUrl, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    throw new Error('Token do Google inválido ou expirado.');
  }

  const tokenInfo = JSON.parse(response.getContentText());

  // 1. Conferir Client ID (aud)
  if (tokenInfo.aud !== clientId) {
    throw new Error('Client ID do token não confere com o GOOGLE_CLIENT_ID configurado.');
  }

  // 2. Conferir se o e-mail foi verificado pelo Google
  const isEmailVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;
  if (!isEmailVerified) {
    throw new Error('O e-mail da conta Google não está verificado.');
  }

  // 3. Conferir expiração do token do Google
  if (tokenInfo.exp && (parseInt(tokenInfo.exp, 10) * 1000 <= Date.now())) {
    throw new Error('O token do Google expirou.');
  }

  // 4. Conferir lista de e-mails permitidos (ALLOWED_EMAILS)
  const userEmail = (tokenInfo.email || '').trim().toLowerCase();
  if (!userEmail) {
    throw new Error('Não foi possível identificar o e-mail na conta Google.');
  }

  checkEmailAllowed_(userEmail);

  // 5. Gerar token de sessão próprio assinado com HMAC-SHA256 (30 dias)
  const sessionToken = createSessionToken_(userEmail);

  return output_({
    success: true,
    sessionToken: sessionToken,
    email: userEmail,
    name: tokenInfo.name || '',
    picture: tokenInfo.picture || '',
    expiresAt: Date.now() + SESSION_DURATION_MS
  });
}

/**
 * Cria um token de sessão assinado: base64Safe(payload) + '.' + base64Safe(assinaturaHMAC)
 */
function createSessionToken_(email) {
  const payload = {
    email: email.toLowerCase(),
    exp: Date.now() + SESSION_DURATION_MS,
    iat: Date.now()
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Utilities.base64EncodeWebSafe(payloadJson);
  const secret = getSessionSecret_();

  const signatureBytes = Utilities.computeHmacSha256Signature(payloadB64, secret);
  const signatureB64 = Utilities.base64EncodeWebSafe(signatureBytes);

  return payloadB64 + '.' + signatureB64;
}

/**
 * Valida o token de sessão HMAC-SHA256. Retorna o e-mail se válido.
 */
function verifySessionToken_(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.indexOf('.') === -1) {
    throw new Error('Sessão ausente ou inválida. Faça login com o Google.');
  }

  const parts = sessionToken.split('.');
  if (parts.length !== 2) {
    throw new Error('Formato do token de sessão inválido.');
  }

  const payloadB64 = parts[0];
  const providedSignatureB64 = parts[1];

  // Recalcula a assinatura esperada
  const secret = getSessionSecret_();
  const expectedSignatureBytes = Utilities.computeHmacSha256Signature(payloadB64, secret);
  const expectedSignatureB64 = Utilities.base64EncodeWebSafe(expectedSignatureBytes);

  // Comparação segura de assinaturas
  if (!constantTimeEquals_(providedSignatureB64, expectedSignatureB64)) {
    throw new Error('Assinatura da sessão inválida. Faça login novamente.');
  }

  // Decodifica e valida os dados da sessão
  let payload;
  try {
    const payloadBytes = Utilities.base64DecodeWebSafe(payloadB64);
    const payloadStr = Utilities.newBlob(payloadBytes).getDataAsString();
    payload = JSON.parse(payloadStr);
  } catch (e) {
    throw new Error('Erro ao decodificar a sessão. Faça login novamente.');
  }

  if (!payload || !payload.email || !payload.exp) {
    throw new Error('Conteúdo da sessão inválido.');
  }

  if (Date.now() > payload.exp) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  // Garante que o e-mail continua autorizado
  checkEmailAllowed_(payload.email);

  return payload.email;
}

/**
 * Verifica se o e-mail está na lista ALLOWED_EMAILS das propriedades do script.
 */
function checkEmailAllowed_(email) {
  const rawAllowed = getScriptProperty_('ALLOWED_EMAILS');
  if (!rawAllowed) {
    throw new Error('ALLOWED_EMAILS não configurado em Script Properties. Adicione seu e-mail.');
  }

  const allowedList = rawAllowed
    .split(',')
    .map(function (item) { return item.trim().toLowerCase(); })
    .filter(Boolean);

  if (allowedList.length === 0) {
    throw new Error('Lista ALLOWED_EMAILS está vazia. Adicione ao menos um e-mail autorizado.');
  }

  if (allowedList.indexOf(email.toLowerCase()) === -1) {
    throw new Error('Acesso negado: o e-mail ' + email + ' não tem autorização neste sistema.');
  }
}

/**
 * Obtém ou gera o segredo de assinatura da sessão (SESSION_SECRET).
 */
function getSessionSecret_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('SESSION_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + '-' + Utilities.getUuid() + '-' + Date.now();
    props.setProperty('SESSION_SECRET', secret);
  }
  return secret;
}

/**
 * Lê propriedade do Script de forma segura.
 */
function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

/**
 * Comparação em tempo constante para evitar ataques de timing.
 */
function constantTimeEquals_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─── ISOLAMENTO PARA EVOLUÇÃO MULTIUSUÁRIO ───────────────────────────────────

/**
 * Retorna a planilha correspondente ao usuário autenticado.
 * 
 * NOTA DE ARQUITETURA MULTIUSUÁRIO (PREPARAÇÃO FUTURA):
 * Hoje esta função retorna sempre a planilha vinculada ao Apps Script (SpreadsheetApp.getActiveSpreadsheet()).
 * No futuro, para permitir que múltiplos usuários tenham suas próprias planilhas isoladas no Google Drive,
 * esta função poderá buscar ou criar dinamicamente uma planilha no Drive do proprietário nomeada com o e-mail do usuário.
 * 
 * @param {string} email - E-mail do usuário autenticado na sessão
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} A planilha correspondente
 */
function getSpreadsheetForUser_(email) {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ─── SINCRONIZAÇÃO EM TRÊS VIAS (BASE / LOCAL / REMOTO) ───────────────────────

function applySync_(base, incoming, spreadsheet) {
  if (!base || !incoming) {
    throw new Error('Sincronização inválida: faltam os dados-base ou os dados atuais.');
  }

  Object.keys(SHEETS).forEach(function (entity) {
    if (!Array.isArray(base[entity]) || !Array.isArray(incoming[entity])) {
      throw new Error('Dados inválidos para a aba ' + SHEETS[entity].name + '.');
    }
  });

  Object.keys(SHEETS).forEach(function (entity) {
    const current = readRecords_(entity, spreadsheet);
    const merged = mergeRecords_(current, base[entity], incoming[entity]);
    writeRecords_(entity, merged, spreadsheet);
  });
}

function mergeRecords_(current, base, incoming) {
  const currentById = indexRecords_(current);
  const baseById = indexRecords_(base);
  const incomingById = indexRecords_(incoming);

  Object.keys(baseById).forEach(function (id) {
    if (!Object.prototype.hasOwnProperty.call(incomingById, id)) {
      delete currentById[id];
    } else if (stableJson_(baseById[id]) !== stableJson_(incomingById[id])) {
      currentById[id] = incomingById[id];
    }
  });

  Object.keys(incomingById).forEach(function (id) {
    if (!Object.prototype.hasOwnProperty.call(baseById, id)) {
      currentById[id] = incomingById[id];
    }
  });

  const orderedIds = [];
  const seen = {};
  incoming.forEach(function (record) {
    const id = String(record.id);
    if (Object.prototype.hasOwnProperty.call(currentById, id) && !seen[id]) {
      orderedIds.push(id);
      seen[id] = true;
    }
  });
  Object.keys(currentById).forEach(function (id) {
    if (!seen[id]) orderedIds.push(id);
  });
  return orderedIds.map(function (id) { return currentById[id]; });
}

function indexRecords_(records) {
  const result = {};
  records.forEach(function (record) {
    if (!record || record.id === undefined || record.id === null) {
      throw new Error('Todos os registros precisam ter um id.');
    }
    result[String(record.id)] = record;
  });
  return result;
}

function stableJson_(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson_).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ':' + stableJson_(value[key]);
    }).join(',') + '}';
  }
  return JSON.stringify(value);
}

function normalizeEntity_(entity) {
  if (!Object.prototype.hasOwnProperty.call(SHEETS, entity)) {
    throw new Error('Aba inválida.');
  }
  return entity;
}

// ─── LEITURA E ESCRITA NA PLANILHA ───────────────────────────────────────────

function ensureSheet_(entity, spreadsheet) {
  spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const config = SHEETS[normalizeEntity_(entity)];
  const sheet = spreadsheet.getSheetByName(config.name) || spreadsheet.insertSheet(config.name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readRecords_(entity, spreadsheet) {
  const sheet = ensureSheet_(entity, spreadsheet);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(String);
  return values.slice(1).filter(function (row) {
    return row.some(function (value) { return value !== ''; });
  }).map(function (row) {
    const record = {};
    headers.forEach(function (header, index) {
      if (!header) return;
      let value = row[index];
      if (value === '') return;
      if (typeof value === 'string' && /^[\[{]/.test(value)) {
        try { value = JSON.parse(value); } catch (error) { /* Preserva texto comum */ }
      }
      record[header] = value;
    });
    return record;
  });
}

function writeRecords_(entity, records, spreadsheet) {
  const config = SHEETS[normalizeEntity_(entity)];
  const sheet = ensureSheet_(entity, spreadsheet);
  const headers = config.headers.slice();
  records.forEach(function (record) {
    if (!record || record.id === undefined || record.id === null) {
      throw new Error('Todos os registros precisam ter um id.');
    }
    Object.keys(record).forEach(function (key) {
      if (headers.indexOf(key) === -1) headers.push(key);
    });
  });

  sheet.clearContents();
  const values = [headers].concat(records.map(function (record) {
    return headers.map(function (header) {
      const value = record[header];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      if (typeof value === 'string') return "'" + value;
      return value;
    });
  }));
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  sheet.setFrozenRows(1);
}

function output_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
