/**
 * Parser de Extratos Bancários com Identificação de Movimentações Internas
 * e Interceptação de Titulares (Human-in-the-Loop)
 */

/**
 * Converte e limpa de forma estrita qualquer string de moeda no padrão BRL ou internacional.
 */
export function parseBRLAmount(valStr) {
  if (typeof valStr === 'number') {
    if (isNaN(valStr) || Math.abs(valStr) > 100000000) return null;
    return valStr;
  }
  if (!valStr) return null;

  let clean = valStr.toString().replace(/^\uFEFF/, '').trim();
  if (!clean) return null;

  if (/[a-zA-Z]/.test(clean.replace(/R\$/gi, ''))) return null;

  clean = clean.replace(/R\$\s?/gi, '').replace(/\s/g, '');

  if (clean.includes(',') && clean.includes('.')) {
    if (clean.indexOf('.') < clean.indexOf(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return null;

  if (Math.abs(num) > 100000000) return null;

  return num;
}

/**
 * Valida e converte qualquer string de data flexível em { formatted: "DD/MM/YYYY", dateObj: Date }
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  let trimmed = dateStr.toString().replace(/^\uFEFF/, '').trim();
  if (!trimmed) return null;

  const matchBR = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (matchBR) {
    const day = parseInt(matchBR[1], 10);
    const month = parseInt(matchBR[2], 10);
    let year = parseInt(matchBR[3], 10);
    if (year < 100) year += 2000;

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      const formatted = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      const dateObj = new Date(year, month - 1, day);
      return { formatted, dateObj };
    }
  }

  const matchISO = trimmed.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
  if (matchISO) {
    const year = parseInt(matchISO[1], 10);
    const month = parseInt(matchISO[2], 10);
    const day = parseInt(matchISO[3], 10);

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      const formatted = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      const dateObj = new Date(year, month - 1, day);
      return { formatted, dateObj };
    }
  }

  const matchOFX = trimmed.match(/^(\d{4})(\d{2})(\d{2})/);
  if (matchOFX) {
    const year = parseInt(matchOFX[1], 10);
    const month = parseInt(matchOFX[2], 10);
    const day = parseInt(matchOFX[3], 10);

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      const formatted = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      const dateObj = new Date(year, month - 1, day);
      return { formatted, dateObj };
    }
  }

  return null;
}

/**
 * Verifica se a descrição pertence a uma movimentação interna de saldo / reserva / rendimento.
 */
export function checkInternalTransfer(description) {
  if (!description) return false;
  const clean = description.trim().toLowerCase();

  if (clean.startsWith('dinheiro reservado') || clean.startsWith('dinheiro retirado')) {
    return true;
  }

  const exactKeywords = [
    'rendimentos',
    'rendimento',
    'saldo inicial',
    'initial balance',
    'saldo final',
    'saldo anterior',
    'saldo disponível',
    'saldo disponivel',
    'reserva de emergencia',
    'reserva de emergência'
  ];

  return exactKeywords.some(kw => clean === kw || clean.startsWith(kw));
}

/**
 * Interceptação de Titulares (Wesley Duarte & Stefany Silva)
 * Retorna { requiresOwnerReview: boolean, autoPreselectedReal: boolean }
 */
export function checkOwnerReview(description) {
  if (!description) return { requiresOwnerReview: false, autoPreselectedReal: false };
  const clean = description.toLowerCase();

  const ownerNames = [
    "wesley duarte barbosa",
    "wesley duarte",
    "stefany andré da silva",
    "stefany andre da silva",
    "stefany andre",
    "stefany andré",
    "stefany silva",
    "stefany da silva",
    "stefany da silva andre",
    "stefany da silva andré"
  ];

  const matchesOwner = ownerNames.some(name => clean.includes(name));

  if (!matchesOwner) {
    return { requiresOwnerReview: false, autoPreselectedReal: false };
  }

  // Pré-seleção automática: se contém salário, salario ou renda -> autoPreselectedReal = true
  const salaryKeywords = ["salário", "salario", "renda"];
  const autoPreselectedReal = salaryKeywords.some(kw => clean.includes(kw));

  return {
    requiresOwnerReview: true,
    autoPreselectedReal
  };
}

/**
 * Função utilitária para extrair o valor de uma tag OFX
 */
function getOfxTagValue(blockText, tagName) {
  if (!blockText) return '';
  const regexInline = new RegExp(`<${tagName}>([^<\\r\\n]+)`, 'i');
  const matchInline = blockText.match(regexInline);
  if (matchInline && matchInline[1]) {
    return matchInline[1].trim();
  }

  const regexBlock = new RegExp(`<${tagName}>([\\s\\S]*?)(?:</${tagName}>|<|$)`, 'i');
  const matchBlock = blockText.match(regexBlock);
  if (matchBlock && matchBlock[1]) {
    return matchBlock[1].trim();
  }

  return '';
}

/**
 * Parser Estrito para Conteúdo OFX
 */
export function parseOFXContent(content, fileName) {
  if (!content || typeof content !== 'string') {
    throw new Error('Conteúdo OFX inválido');
  }

  const transactions = [];
  const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>))/gi;
  let match;

  while ((match = trnRegex.exec(content)) !== null) {
    const block = match[1];

    if (block.includes('<LEDGERBAL>') || block.includes('<BALAMT>')) continue;

    const rawType = getOfxTagValue(block, 'TRNTYPE');
    const rawDate = getOfxTagValue(block, 'DTPOSTED');
    const rawAmt = getOfxTagValue(block, 'TRNAMT');
    const fitId = getOfxTagValue(block, 'FITID') || `ofx-${transactions.length + 1}`;

    const parsedDate = parseDate(rawDate);
    const value = parseBRLAmount(rawAmt);

    if (!parsedDate || value === null || isNaN(value)) continue;

    const nameVal = getOfxTagValue(block, 'NAME');
    const memoVal = getOfxTagValue(block, 'MEMO');
    const payeeVal = getOfxTagValue(block, 'PAYEE');

    let realDescription = '';
    if (memoVal && nameVal) {
      if (memoVal.toLowerCase().includes(nameVal.toLowerCase())) {
        realDescription = memoVal;
      } else if (nameVal.toLowerCase().includes(memoVal.toLowerCase())) {
        realDescription = nameVal;
      } else {
        realDescription = `${nameVal} - ${memoVal}`;
      }
    } else {
      realDescription = memoVal || nameVal || payeeVal || '';
    }

    realDescription = realDescription
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    if (!realDescription) {
      realDescription = `Lançamento OFX ${rawType ? `(${rawType})` : ''}`.trim();
    }

    // 1. Verificar se é movimentação interna de saldo/reserva
    const isInternal = checkInternalTransfer(realDescription);
    
    // 2. Interceptação de Titulares (Wesley Duarte & Stefany Silva)
    const { requiresOwnerReview, autoPreselectedReal } = checkOwnerReview(realDescription);

    const isReceita = value > 0 || (value === 0 && (rawType.toUpperCase().includes('CREDIT') || rawType.toUpperCase().includes('DEP')));
    const type = isReceita ? 'receita' : 'despesa';

    transactions.push({
      id: fitId,
      date: parsedDate.formatted,
      dateObj: parsedDate.dateObj,
      description: realDescription,
      value: Math.abs(value),
      signedValue: value,
      type,
      category: isInternal ? 'Transferência Interna' : (isReceita ? 'Entrada' : 'Saída'),
      isInternalTransfer: isInternal,
      requiresOwnerReview,
      autoPreselectedReal
    });
  }

  if (transactions.length === 0) {
    throw new Error('Nenhuma transação válida encontrada no arquivo OFX');
  }

  return buildParsedResult(transactions, fileName);
}

/**
 * Parser Estrito para Conteúdo CSV
 */
export function parseCSVContent(content, fileName) {
  if (!content || typeof content !== 'string') {
    throw new Error('Conteúdo CSV inválido');
  }

  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    throw new Error('Arquivo CSV está vazio');
  }

  const sampleLines = lines.slice(0, 15).join('\n');
  let delimiter = ';';
  const countSemicolons = (sampleLines.match(/;/g) || []).length;
  const countCommas = (sampleLines.match(/,/g) || []).length;
  const countTabs = (sampleLines.match(/\t/g) || []).length;

  if (countCommas > countSemicolons && countCommas > countTabs) {
    delimiter = ',';
  } else if (countTabs > countSemicolons && countTabs > countCommas) {
    delimiter = '\t';
  }

  let dateColIdx = -1;
  let descColIdx = -1;
  let amountColIdx = -1;
  let typeColIdx = -1;
  let headerRowIdx = -1;

  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const cols = splitCSVLine(lines[i], delimiter).map(c => c.toLowerCase().trim());
    
    let tempDateIdx = -1;
    let tempDescIdx = -1;
    let tempAmtIdx = -1;

    cols.forEach((colName, idx) => {
      if (tempDateIdx === -1 && (colName.includes('data') || colName.includes('date') || colName.includes('fecha'))) {
        tempDateIdx = idx;
      }
      if (tempDescIdx === -1 && (colName.includes('desc') || colName.includes('memo') || colName.includes('hist') || colName.includes('titul') || colName.includes('operac') || colName.includes('detalh') || colName.includes('motivo') || colName.includes('conceito'))) {
        tempDescIdx = idx;
      }
      if (tempAmtIdx === -1 && (colName.includes('valor') || colName.includes('amount') || colName.includes('monto') || colName.includes('quantia') || colName.includes('importe')) && !colName.includes('saldo')) {
        tempAmtIdx = idx;
      }
      if (typeColIdx === -1 && (colName.includes('tipo') || colName.includes('type') || colName.includes('natureza'))) {
        typeColIdx = idx;
      }
    });

    if (tempDateIdx !== -1 && (tempAmtIdx !== -1 || tempDescIdx !== -1)) {
      dateColIdx = tempDateIdx;
      descColIdx = tempDescIdx;
      amountColIdx = tempAmtIdx;
      headerRowIdx = i;
      break;
    }
  }

  const transactions = [];

  for (let i = 0; i < lines.length; i++) {
    if (i === headerRowIdx) continue;

    const line = lines[i];
    if (!line) continue;

    const cols = splitCSVLine(line, delimiter);
    if (cols.length < 2) continue;

    let dateParsed = null;
    if (dateColIdx !== -1 && dateColIdx < cols.length) {
      dateParsed = parseDate(cols[dateColIdx]);
    }

    let amountParsed = null;
    if (amountColIdx !== -1 && amountColIdx < cols.length) {
      amountParsed = parseBRLAmount(cols[amountColIdx]);
    }

    let realDescription = '';
    if (descColIdx !== -1 && descColIdx < cols.length) {
      realDescription = cols[descColIdx];
    }

    let rawType = '';
    if (typeColIdx !== -1 && typeColIdx < cols.length) {
      rawType = cols[typeColIdx];
    }

    if (!dateParsed || amountParsed === null || !realDescription) {
      let hDate = null;
      let hAmount = null;
      let hDescParts = [];

      for (let c = 0; c < cols.length; c++) {
        const colVal = cols[c].trim();
        if (!colVal) continue;

        if (!hDate) {
          const pDate = parseDate(colVal);
          if (pDate) {
            hDate = pDate;
            continue;
          }
        }

        if (hAmount === null) {
          const pAmt = parseBRLAmount(colVal);
          if (pAmt !== null) {
            hAmount = pAmt;
            continue;
          }
        }

        if (!parseDate(colVal) && parseBRLAmount(colVal) === null) {
          hDescParts.push(colVal);
        }
      }

      if (!dateParsed) dateParsed = hDate;
      if (amountParsed === null) amountParsed = hAmount;
      if (!realDescription && hDescParts.length > 0) {
        realDescription = hDescParts.join(' ');
      }
    }

    if (!dateParsed || amountParsed === null || isNaN(amountParsed)) {
      continue;
    }

    realDescription = realDescription
      .replace(/^["']|["']$/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    if (!realDescription) {
      realDescription = 'Movimentação Bancária';
    }

    const isInternal = checkInternalTransfer(realDescription);
    const { requiresOwnerReview, autoPreselectedReal } = checkOwnerReview(realDescription);

    let isReceita = amountParsed > 0;
    if (amountParsed === 0 && rawType) {
      const lowerT = rawType.toLowerCase();
      if (lowerT.includes('cred') || lowerT.includes('entrad') || lowerT.includes('receit')) {
        isReceita = true;
      }
    }
    const type = isReceita ? 'receita' : 'despesa';

    transactions.push({
      id: `csv-tx-${i}-${Math.random().toString(36).substring(2, 7)}`,
      date: dateParsed.formatted,
      dateObj: dateParsed.dateObj,
      description: realDescription,
      value: Math.abs(amountParsed),
      signedValue: amountParsed,
      type,
      category: isInternal ? 'Transferência Interna' : (isReceita ? 'Entrada' : 'Saída'),
      isInternalTransfer: isInternal,
      requiresOwnerReview,
      autoPreselectedReal
    });
  }

  if (transactions.length === 0) {
    throw new Error('Nenhuma transação válida encontrada no arquivo CSV');
  }

  return buildParsedResult(transactions, fileName);
}

function splitCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

function buildParsedResult(transactions, fileName) {
  transactions.sort((a, b) => {
    if (a.dateObj && b.dateObj) return a.dateObj.getTime() - b.dateObj.getTime();
    return 0;
  });

  const validDates = transactions.filter(t => t.dateObj).map(t => t.dateObj.getTime());
  let startDate = '';
  let endDate = '';

  if (validDates.length > 0) {
    const minTime = Math.min(...validDates);
    const maxTime = Math.max(...validDates);
    
    const dStart = new Date(minTime);
    const dEnd = new Date(maxTime);

    startDate = `${String(dStart.getDate()).padStart(2, '0')}/${String(dStart.getMonth() + 1).padStart(2, '0')}/${dStart.getFullYear()}`;
    endDate = `${String(dEnd.getDate()).padStart(2, '0')}/${String(dEnd.getMonth() + 1).padStart(2, '0')}/${dEnd.getFullYear()}`;
  } else {
    startDate = transactions[0]?.date || '';
    endDate = transactions[transactions.length - 1]?.date || '';
  }

  const externalTransactions = transactions.filter(t => !t.isInternalTransfer);

  const totalIncomes = externalTransactions
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.value, 0);

  const totalExpenses = externalTransactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.value, 0);

  const internalCount = transactions.filter(t => t.isInternalTransfer).length;
  const ownerReviewCount = transactions.filter(t => t.requiresOwnerReview).length;

  return {
    fileName,
    startDate,
    endDate,
    totalIncomes,
    totalExpenses,
    transactions,
    internalCount,
    ownerReviewCount
  };
}

/**
 * Detecta a assinatura do banco dentro do conteúdo do arquivo (OFX ou CSV)
 * Retorna { id, name, logo, color } se houver assinatura clara, ou null se for neutro.
 */
export function detectBankFromFile(content) {
  if (!content || typeof content !== 'string') return null;
  const clean = content.toLowerCase();

  // Mercado Pago
  if (
    clean.includes('mercado pago') || 
    clean.includes('mercadopago') || 
    clean.includes('mercadolibre') || 
    clean.includes('mercado livre')
  ) {
    return { id: 'mercadopago', name: 'Mercado Pago', logo: 'MP', color: '#009EE3' };
  }

  // Nubank
  if (
    clean.includes('nubank') || 
    clean.includes('nu pagamentos') || 
    clean.includes('nu financeira') || 
    clean.includes('<bankid>260')
  ) {
    return { id: 'nubank', name: 'Nubank', logo: 'Nu', color: '#820AD1' };
  }

  // Banco Inter
  if (
    clean.includes('banco inter') || 
    clean.includes('inter medium') || 
    clean.includes('<bankid>077') || 
    clean.includes('<bankid>77')
  ) {
    return { id: 'inter', name: 'Banco Inter', logo: 'Inter', color: '#FF7A00' };
  }

  // Caixa Econômica
  if (
    clean.includes('caixa economica') || 
    clean.includes('caixa econômica') || 
    clean.includes('cef') || 
    clean.includes('<bankid>104')
  ) {
    return { id: 'caixa', name: 'Caixa Econômica', logo: 'Caixa', color: '#005CA9' };
  }

  // Banco do Brasil
  if (
    clean.includes('banco do brasil') || 
    clean.includes('<bankid>001') || 
    clean.includes('<bankid>1')
  ) {
    return { id: 'bb', name: 'Banco do Brasil', logo: 'BB', color: '#0038A8' };
  }

  return null;
}

export function processStatementFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Nenhum arquivo fornecido'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const fileExt = file.name.split('.').pop().toLowerCase();

        let parsed = null;
        if (fileExt === 'ofx' || content.includes('<OFX>') || content.includes('<STMTTRN>')) {
          parsed = parseOFXContent(content, file.name);
        } else if (fileExt === 'csv' || fileExt === 'txt') {
          parsed = parseCSVContent(content, file.name);
        } else {
          try {
            parsed = parseOFXContent(content, file.name);
          } catch {
            parsed = parseCSVContent(content, file.name);
          }
        }

        if (parsed) {
          parsed.detectedBank = detectBankFromFile(content);
        }

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo no computador'));
    };

    reader.readAsText(file, 'ISO-8859-1');
  });
}
