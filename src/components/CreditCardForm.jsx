import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  Layers, 
  AlertTriangle, 
  PlusCircle, 
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import CurrencyInput from './CurrencyInput';
import FloatingSelect from './FloatingSelect';
import { generateCreditCardInstallments } from '../lib/creditCardEngine';

export default function CreditCardForm({ 
  cards = [], 
  categories = [], 
  onSubmit 
}) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    date: today,
    cardId: cards[0]?.id || '',
    category: 'Alimentação',
    payee: '',
    product: '',
    value: '',
    installments: 1
  });

  const [errors, setErrors] = useState({});
  const [missingFields, setMissingFields] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Categorias de Despesa
  const expenseCategories = categories && categories.length > 0 
    ? categories.filter(c => c.type === 'expense') 
    : EXPENSE_CATEGORIES;

  const selectedCard = cards.find(c => c.id === formData.cardId) || cards[0];

  // Cálculo prévio das parcelas em tempo real para exibir no preview
  const installmentPreview = useMemo(() => {
    const totalVal = parseFloat(formData.value) || 0;
    const count = parseInt(formData.installments, 10) || 1;

    if (totalVal <= 0 || !selectedCard) return null;

    const installments = generateCreditCardInstallments({
      date: formData.date,
      payee: formData.payee,
      product: formData.product,
      category: formData.category,
      totalValue: totalVal,
      installmentsCount: count,
      cardId: selectedCard.id
    }, selectedCard);

    const firstDue = installments[0]?.date ? installments[0].date.split('-').reverse().join('/') : '';
    const lastDue = installments[installments.length - 1]?.date ? installments[installments.length - 1].date.split('-').reverse().join('/') : '';
    const installmentVal = installments[0]?.value || 0;

    return {
      count,
      installmentVal,
      firstDue,
      lastDue,
      totalVal,
      installments
    };
  }, [formData, selectedCard]);

  const limitAvailable = useMemo(() => {
    if (!selectedCard) return 0;
    const total = parseFloat(selectedCard.limitTotal) || 0;
    const used = parseFloat(selectedCard.limitUsed) || 0;
    return Math.max(0, Math.round((total - used) * 100) / 100);
  }, [selectedCard]);

  const isExceedingLimit = useMemo(() => {
    const totalVal = parseFloat(formData.value) || 0;
    return totalVal > limitAvailable && limitAvailable > 0;
  }, [formData.value, limitAvailable]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const missing = [];
    const newErrors = {};

    if (!formData.date) {
      missing.push('Data da Compra');
      newErrors.date = true;
    }
    if (!formData.cardId && cards.length > 0) {
      missing.push('Cartão de Crédito');
      newErrors.cardId = true;
    }
    if (!formData.payee || !formData.payee.trim()) {
      missing.push('Estabelecimento / Beneficiário');
      newErrors.payee = true;
    }
    const numVal = parseFloat(formData.value);
    if (isNaN(numVal) || numVal <= 0) {
      missing.push('Valor Total da Compra');
      newErrors.value = true;
    }

    if (missing.length > 0) {
      setMissingFields(missing);
      setErrors(newErrors);
      setShowValidationModal(true);
      return;
    }

    if (!selectedCard) {
      setMissingFields(['Nenhum cartão cadastrado na Central de Controle']);
      setShowValidationModal(true);
      return;
    }

    const count = Math.max(1, parseInt(formData.installments, 10) || 1);
    const generatedInstallments = generateCreditCardInstallments({
      date: formData.date,
      payee: formData.payee.trim(),
      product: formData.product.trim(),
      category: formData.category,
      totalValue: numVal,
      installmentsCount: count,
      cardId: selectedCard.id
    }, selectedCard);

    if (onSubmit) {
      onSubmit({
        purchaseData: {
          ...formData,
          value: numVal,
          installments: count
        },
        installments: generatedInstallments,
        card: selectedCard
      });
    }

    // Resetar campos de preenchimento
    setFormData(prev => ({
      ...prev,
      payee: '',
      product: '',
      value: '',
      installments: 1
    }));
    setErrors({});
  };

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.12)] relative w-full">
      
      {/* Cabeçalho do Lançador de Cartão */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#192234]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold">
            <CreditCard size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Lançamento no Cartão de Crédito
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Parcelamento Automático
              </span>
            </h4>
            <p className="text-[11px] text-[#94a3b8]">
              Gera a projeção de faturas futuras e atualiza o limite em tempo real
            </p>
          </div>
        </div>

        {selectedCard && (
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748b] block">Limite Disponível</span>
              <span className={`text-xs font-mono font-bold ${isExceedingLimit ? 'text-rose-400' : 'text-purple-300'}`}>
                {formatBRL(limitAvailable)}
              </span>
            </div>
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0d1320] border border-[#192234] text-center space-y-2">
          <CreditCard size={32} className="mx-auto text-purple-400/60" />
          <p className="text-sm font-bold text-white">Nenhum cartão cadastrado</p>
          <p className="text-xs text-[#94a3b8]">
            Cadastre seus cartões de crédito na <strong>Central de Controle</strong> para lançar compras e parcelamentos.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-2.5 w-full">
            
            {/* 1. DATA DA COMPRA */}
            <div className="flex flex-col w-[130px] shrink-0">
              <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
                Data Compra
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full h-[38px] bg-[#121927] border rounded-xl px-2.5 text-xs text-white focus:outline-none transition-all cursor-pointer ${
                  errors.date ? 'border-red-500 bg-red-950/20' : 'border-[#192234] focus:border-purple-400'
                }`}
              />
            </div>

            {/* 2. CARTÃO DE CRÉDITO */}
            <div className="flex flex-col w-[170px] shrink-0">
              <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 truncate">
                Cartão
              </label>
              <FloatingSelect
                value={formData.cardId}
                options={cards.map(card => ({
                  value: card.id,
                  label: card.name || 'Cartão',
                  detail: card.digits ? `•••• ${card.digits}` : '',
                  leading: <span aria-hidden="true">💳</span>,
                  triggerLabel: `${card.name || 'Cartão'}${card.digits ? ` (•••• ${card.digits})` : ''}`
                }))}
                onChange={(cardId) => {
                  setFormData(prev => ({ ...prev, cardId }));
                  if (errors.cardId) {
                    setErrors(prev => ({ ...prev, cardId: false }));
                  }
                }}
                label="Selecionar Cartão"
                emptyMessage="Nenhum cartão cadastrado"
                fallback={selectedCard && (
                  <>
                    <span aria-hidden="true">💳</span>
                    <span className="truncate">{selectedCard.name || 'Cartão'}</span>
                  </>
                )}
                className={`w-full h-[38px] bg-[#121927] border rounded-xl px-2.5 text-xs font-semibold text-white focus:outline-none transition-all cursor-pointer flex items-center gap-2 ${
                  errors.cardId ? 'border-red-500' : 'border-purple-500/40 hover:border-purple-400'
                }`}
              />
            </div>

            {/* 3. CATEGORIA */}
            <div className="flex flex-col w-[140px] shrink-0">
              <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
                Categoria
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-[38px] bg-[#121927] border border-[#192234] rounded-xl px-2 text-xs font-medium text-white focus:outline-none focus:border-purple-400 transition-all cursor-pointer"
              >
                {expenseCategories.map(c => {
                  const val = c.value || c.name;
                  const label = c.label || c.name;
                  return (
                    <option key={c.id || val} value={val} className="bg-[#0b0f19] text-white">
                      {c.emoji || '🏷️'} {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 4. ESTABELECIMENTO / BENEFICIÁRIO */}
            <div className="flex flex-col flex-1 min-w-[130px]">
              <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
                Estabelecimento
              </label>
              <input
                type="text"
                name="payee"
                value={formData.payee}
                onChange={handleChange}
                placeholder="Ex: Mercado Livre, Apple, Posto..."
                className={`w-full h-[38px] bg-[#121927] border rounded-xl px-3 text-xs text-white placeholder:text-[#475569] focus:outline-none transition-all ${
                  errors.payee ? 'border-red-500 bg-red-950/20' : 'border-[#192234] focus:border-purple-400'
                }`}
              />
            </div>

            {/* 5. PRODUTO / DETALHE */}
            <div className="flex flex-col flex-1 min-w-[120px]">
              <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
                Produto / Detalhe
              </label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                placeholder="Ex: iPhone 15 Pro Max"
                className="w-full h-[38px] bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-purple-400 transition-all"
              />
            </div>

            {/* 6. VALOR TOTAL */}
            <div className="flex flex-col w-[125px] shrink-0">
              <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1 truncate">
                Valor Total (R$)
              </label>
              <CurrencyInput
                placeholder="0,00"
                value={formData.value}
                onChange={handleChange}
                name="value"
                className={`w-full h-[38px] bg-[#121927] border rounded-xl px-3 text-xs font-mono font-bold text-white focus:outline-none transition-all text-right ${
                  errors.value ? 'border-red-500 bg-red-950/20' : 'border-purple-500/40 focus:border-purple-400'
                }`}
              />
            </div>

            {/* 7. PARCELAS (1x a 24x) */}
            <div className="flex flex-col w-[100px] shrink-0">
              <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1 truncate">
                Parcelas
              </label>
              <select
                name="installments"
                value={formData.installments}
                onChange={handleChange}
                className="w-full h-[38px] bg-[#121927] border border-purple-500/40 rounded-xl px-2 text-xs font-bold text-purple-300 focus:outline-none focus:border-purple-400 transition-all cursor-pointer"
              >
                <option value={1} className="bg-[#0b0f19] text-white">1x (À vista)</option>
                {Array.from({ length: 23 }, (_, i) => i + 2).map(n => (
                  <option key={n} value={n} className="bg-[#0b0f19] text-white">
                    {n}x parcelas
                  </option>
                ))}
              </select>
            </div>

            {/* 8. BOTÃO DE LANÇAMENTO */}
            <button
              type="submit"
              className="h-[38px] px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <PlusCircle size={15} />
              <span>Lançar no Cartão</span>
            </button>

          </div>

          {/* PREVIEW INTERATIVO DA PROJEÇÃO DE PARCELAS */}
          {installmentPreview && (
            <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                  <Clock size={14} />
                </div>
                <div>
                  <span className="font-bold text-white block">
                    {installmentPreview.count > 1 
                      ? `${installmentPreview.count}x de ${formatBRL(installmentPreview.installmentVal)} (${formatBRL(installmentPreview.totalVal)} total)`
                      : `À vista: ${formatBRL(installmentPreview.totalVal)}`}
                  </span>
                  <span className="text-[11px] text-purple-300/80">
                    {installmentPreview.count > 1 
                      ? `1ª parcela na fatura de ${installmentPreview.firstDue} • Última em ${installmentPreview.lastDue}`
                      : `Fatura com vencimento em ${installmentPreview.firstDue}`}
                  </span>
                </div>
              </div>

              {isExceedingLimit && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                  <AlertTriangle size={12} />
                  <span>Atenção: Compra excede o limite disponível ({formatBRL(limitAvailable)})</span>
                </div>
              )}
            </div>
          )}

        </form>
      )}

      {/* Modal de Validação */}
      {showValidationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b0f19] border border-red-500/40 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={20} />
              <h5 className="font-bold text-white text-sm">Campos Obrigatórios</h5>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Por favor, preencha os seguintes campos para lançar a compra no cartão:
            </p>
            <ul className="list-disc list-inside text-xs text-red-300 space-y-1">
              {missingFields.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowValidationModal(false)}
              className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
