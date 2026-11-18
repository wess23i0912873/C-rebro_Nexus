const API_TOKEN = 'COLE_AQUI_UM_TOKEN_LONGO_E_ALEATORIO';
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

function setupSpreadsheet() {
  Object.keys(SHEETS).forEach(function (entity) {
    ensureSheet_(entity);
  });
}

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  try {
    authorize_(e && e.parameter && e.parameter.token);
    const data = {};
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      Object.keys(SHEETS).forEach(function (entity) {
        data[entity] = readRecords_(entity);
      });
    } finally {
      lock.releaseLock();
    }
    return output_({ success: true, data: data }, callback);
  } catch (error) {
    return output_({ success: false, error: error.message }, callback);
  }
}

function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    authorize_(request.token);

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      if (request.action === 'sync') {
        applySync_(request.base, request.data);
      } else if (request.action === 'save' || request.action === 'edit') {
        const entity = normalizeEntity_(request.entity);
        const record = request.record;
        if (!record || record.id === undefined || record.id === null) {
          throw new Error('O registro precisa ter um id.');
        }
        const records = readRecords_(entity);
        const index = records.findIndex(function (item) { return String(item.id) === String(record.id); });
        if (index < 0) records.push(record);
        else records[index] = record;
        writeRecords_(entity, records);
      } else if (request.action === 'delete') {
        const entity = normalizeEntity_(request.entity);
        if (request.id === undefined || request.id === null) {
          throw new Error('Informe o id do registro a excluir.');
        }
        const records = readRecords_(entity).filter(function (item) {
          return String(item.id) !== String(request.id);
        });
        writeRecords_(entity, records);
      } else {
        throw new Error('Ação inválida. Use sync, save, edit ou delete.');
      }
    } finally {
      lock.releaseLock();
    }

    return output_({ success: true });
  } catch (error) {
    return output_({ success: false, error: error.message });
  }
}

function applySync_(base, incoming) {
  if (!base || !incoming) {
    throw new Error('Sincronização inválida: faltam os dados-base ou os dados atuais.');
  }

  Object.keys(SHEETS).forEach(function (entity) {
    if (!Array.isArray(base[entity]) || !Array.isArray(incoming[entity])) {
      throw new Error('Dados inválidos para a aba ' + SHEETS[entity].name + '.');
    }
  });

  Object.keys(SHEETS).forEach(function (entity) {
    const merged = mergeRecords_(readRecords_(entity), base[entity], incoming[entity]);
    writeRecords_(entity, merged);
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

function authorize_(providedToken) {
  if (!API_TOKEN || API_TOKEN === 'COLE_AQUI_UM_TOKEN_LONGO_E_ALEATORIO' || providedToken !== API_TOKEN) {
    throw new Error('Token inválido. Configure o mesmo token no Code.gs e no Cérebro Nexus.');
  }
}

function normalizeEntity_(entity) {
  if (!Object.prototype.hasOwnProperty.call(SHEETS, entity)) {
    throw new Error('Aba inválida.');
  }
  return entity;
}

function ensureSheet_(entity) {
  const config = SHEETS[normalizeEntity_(entity)];
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(config.name) || spreadsheet.insertSheet(config.name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readRecords_(entity) {
  const sheet = ensureSheet_(entity);
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
        try { value = JSON.parse(value); } catch (error) { /* Preserve ordinary text. */ }
      }
      record[header] = value;
    });
    return record;
  });
}

function writeRecords_(entity, records) {
  const config = SHEETS[normalizeEntity_(entity)];
  const sheet = ensureSheet_(entity);
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

function output_(payload, callback) {
  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Callback inválido.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
