/**
 * Motor de Cartões de Crédito & Parcelamento Automático
 * Cérebro Nexus
 */

/**
 * Gera a lista de parcelas projetadas para uma compra no cartão de crédito
 * @param {Object} purchaseData - Dados da compra (date, payee, product, category, totalValue, installmentsCount, cardId)
 * @param {Object} card - Objeto do cartão de crédito selecionado (com closingDay e dueDay)
 * @returns {Array} Lista de transações geradas para cada parcela
 */
export function generateCreditCardInstallments(purchaseData, card) {
  const {
    date: purchaseDateStr,
    payee,
    product,
    category = 'Outros',
    totalValue = 0,
    installmentsCount = 1,
    cardId
  } = purchaseData;

  const total = parseFloat(totalValue) || 0;
  const numInstallments = Math.max(1, parseInt(installmentsCount, 10) || 1);

  if (total <= 0 || !card) return [];

  // Divisão com precisão de centavos
  const baseInstallmentVal = Math.floor((total / numInstallments) * 100) / 100;
  const remainder = Math.round((total - baseInstallmentVal * numInstallments) * 100) / 100;

  // Analisa a data da compra
  const [pYear, pMonth, pDay] = (purchaseDateStr || new Date().toISOString().split('T')[0])
    .split('-')
    .map(Number);

  const closingDay = parseInt(card.closingDay, 10) || 1;
  const dueDay = parseInt(card.dueDay, 10) || 10;

  // Determinar o mês/ano da 1ª fatura
  // Se comprou ANTES do dia de fechamento: fatura fecha no mês atual.
  // Se comprou NO dia de fechamento ou DEPOIS: fatura já fechou, 1ª parcela vai para a próxima fatura!
  let invoiceMonthIndex = pMonth - 1; // 0-indexed
  let invoiceYear = pYear;

  if (pDay >= closingDay) {
    invoiceMonthIndex += 1;
    if (invoiceMonthIndex > 11) {
      invoiceMonthIndex = 0;
      invoiceYear += 1;
    }
  }

  // Se o dia do vencimento for menor que o dia do fechamento (ex: fecha dia 28, vence dia 05 do mês seguinte)
  if (dueDay < closingDay) {
    invoiceMonthIndex += 1;
    if (invoiceMonthIndex > 11) {
      invoiceMonthIndex = 0;
      invoiceYear += 1;
    }
  }

  const purchaseId = `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const installments = [];

  for (let i = 1; i <= numInstallments; i++) {
    // Calcula o ano e mês da parcela i
    let instMonth = invoiceMonthIndex + (i - 1);
    let instYear = invoiceYear;

    while (instMonth > 11) {
      instMonth -= 12;
      instYear += 1;
    }

    // Garante que o dia de vencimento seja válido para o mês específico (ex: fevereiro dia 28)
    const maxDaysInMonth = new Date(instYear, instMonth + 1, 0).getDate();
    const validDueDay = Math.min(dueDay, maxDaysInMonth);

    const formattedMonth = String(instMonth + 1).padStart(2, '0');
    const formattedDay = String(validDueDay).padStart(2, '0');
    const dueDateStr = `${instYear}-${formattedMonth}-${formattedDay}`;

    // A primeira parcela absorve os centavos restantes para garantir soma perfeita
    const installmentVal = i === 1 
      ? Math.round((baseInstallmentVal + remainder) * 100) / 100 
      : baseInstallmentVal;

    const detailText = numInstallments > 1 
      ? `${product ? product + ' ' : ''}(Parcela ${i}/${numInstallments})`
      : (product || 'Compra no Crédito');

    installments.push({
      id: `ctx-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      purchaseId,
      cardId: card.id,
      date: dueDateStr, // Data em que a fatura vence
      purchaseDate: purchaseDateStr, // Data em que a compra foi feita
      paymentMethod: 'credit',
      type: 'expense',
      category: category || 'Outros',
      payee: payee ? payee.trim() : 'Compra no Cartão',
      product: detailText,
      value: installmentVal,
      installmentNumber: i,
      installmentsTotal: numInstallments,
      totalPurchaseValue: total,
      status: 'pending', // Faturas pendentes de pagamento
      origin: 'credit_card'
    });
  }

  return installments;
}

/**
 * Calcula o total de faturas e limite usado de um cartão baseado nas transações
 * @param {Object} card 
 * @param {Array} transactions 
 * @returns {Object} { currentBill, nextBill, totalPending, limitUsed }
 */
export function calculateCardTotals(card, transactions = []) {
  if (!card) return { currentBill: 0, nextBill: 0, totalPending: 0, limitUsed: 0 };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const cardTxs = transactions.filter(t => t.cardId === card.id && t.paymentMethod === 'credit');

  let currentBill = 0;
  let nextBill = 0;
  let totalPending = 0;

  cardTxs.forEach(t => {
    const val = parseFloat(t.value) || 0;
    if (t.status !== 'paid') {
      totalPending += val;
    }

    if (!t.date) return;
    const parts = t.date.split('-');
    if (parts.length === 3) {
      const tYear = parseInt(parts[0], 10);
      const tMonth = parseInt(parts[1], 10) - 1;

      if (tYear === currentYear && tMonth === currentMonth) {
        currentBill += val;
      } else if (
        (tYear === currentYear && tMonth === currentMonth + 1) ||
        (tYear === currentYear + 1 && currentMonth === 11 && tMonth === 0)
      ) {
        nextBill += val;
      }
    }
  });

  const limitUsed = Math.round(totalPending * 100) / 100;

  return {
    currentBill: Math.round(currentBill * 100) / 100,
    nextBill: Math.round(nextBill * 100) / 100,
    totalPending: limitUsed,
    limitUsed
  };
}
