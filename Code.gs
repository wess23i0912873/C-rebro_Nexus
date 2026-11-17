const API_TOKEN = 'COLE_AQUI_UM_TOKEN_LONGO_E_ALEATORIO';
const SHEETS = {
  accounts: 'Accounts',
  cards: 'Cards',
  transactions: 'Transactions',
  subscriptions: 'Subscriptions',
  categories: 'Categories',
};

function doGet(e) {
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
    return output_({ success: true, data: data }, e && e.parameter && e.parameter.callback);
  } catch (error) {
    return output_({ success: false, error: error.message }, e && e.parameter && e.parameter.callback);
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
        const data = request.data || {};
        Object.keys(SHEETS).forEach(function (entity) {
          writeRecords_(entity, Array.isArray(data[entity]) ? data[entity] : []);
        });
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

function getSheet_(entity) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const name = SHEETS[normalizeEntity_(entity)];
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function readRecords_(entity) {
  const sheet = getSheet_(entity);
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
      if (typeof value === 'string' && /^[\[{]/.test(value)) {
        try { value = JSON.parse(value); } catch (error) { /* Keep ordinary text unchanged. */ }
      }
      record[header] = value;
    });
    return record;
  });
}

function writeRecords_(entity, records) {
  const sheet = getSheet_(entity);
  sheet.clearContents();
  if (!records.length) return;

  const headers = [];
  records.forEach(function (record) {
    Object.keys(record).forEach(function (key) {
      if (headers.indexOf(key) === -1) headers.push(key);
    });
  });
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
  sheet.autoResizeColumns(1, headers.length);
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
