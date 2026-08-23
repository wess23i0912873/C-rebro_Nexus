/**
 * Utilitários universais de Máscara de Moeda (pt-BR)
 */

/**
 * Converte qualquer valor (float, string com vírgula ou número de centavos) em número float puro
 * @param {number|string} val 
 * @returns {number}
 */
export function parseToFloat(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  const cleanStr = String(val).trim();
  // Se for string formatada em pt-BR (ex: "24.103,35")
  if (cleanStr.includes(',') && cleanStr.includes('.')) {
    const normalized = cleanStr.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (cleanStr.includes(',')) {
    const normalized = cleanStr.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converte um valor float em string formatada em pt-BR (ex: 24103.35 -> "24.103,35")
 * @param {number|string} val 
 * @param {boolean} [showEmptyAsZero=true]
 * @returns {string}
 */
export function formatFloatToBRL(val, showEmptyAsZero = true) {
  if (val === '' || val === null || val === undefined) {
    return showEmptyAsZero ? '0,00' : '';
  }
  const num = parseToFloat(val);
  if (num === 0 && !showEmptyAsZero) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Processa a digitação da direita para a esquerda padrão brasileira (centavos -> reais -> milhares)
 * @param {string} rawInput 
 * @returns {{ floatValue: number, displayValue: string }}
 */
export function maskCurrencyInput(rawInput) {
  // Extrai apenas os dígitos numéricos
  const digitsOnly = String(rawInput || '').replace(/\D/g, '');
  
  if (!digitsOnly || digitsOnly === '0' || digitsOnly === '00') {
    return {
      floatValue: 0,
      displayValue: ''
    };
  }

  // Limita o tamanho para evitar overflow numérico (até 999 bilhões)
  const safeDigits = digitsOnly.slice(0, 14);
  const cents = parseInt(safeDigits, 10);
  const floatValue = Math.round((cents / 100) * 100) / 100;

  const displayValue = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(floatValue);

  return {
    floatValue,
    displayValue
  };
}
