import React, { useState, useRef, useEffect } from 'react';
import { 
  PlusCircle, 
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import BankIcon from './BankIcon';
import CurrencyInput from './CurrencyInput';
import { findBankPreset } from '../constants/assetOptions';

function getBankBadge(acc) {
  if (!acc) return { logo: '🏛️', color: '#192234', label: 'Conta' };
  if (typeof acc === 'object') {
    if (acc.emoji) return { logo: acc.emoji, color: '#192234', label: acc.name };
    return getBankBadge(acc.name);
  }
  const accName = String(acc);
  const lower = accName.toLowerCase();
  if (lower.includes('nubank')) return { logo: '🟣', color: '#820AD1', label: 'Nubank' };
  if (lower.includes('itaú') || lower.includes('itau')) return { logo: '🟠', color: '#EC7000', label: 'Itaú' };
  if (lower.includes('mercado')) return { logo: '🔵', color: '#009EE3', label: 'Mercado Pago' };
  if (lower.includes('inter')) return { logo: '🟧', color: '#FF7A00', label: 'Inter' };
  if (lower.includes('caixa')) return { logo: '🟦', color: '#005CA9', label: 'Caixa' };
  if (lower.includes('brasil') || lower.includes('bb')) return { logo: '🟨', color: '#0038A8', label: 'Banco do Brasil' };
  if (lower.includes('dinheiro') || lower.includes('wallet') || lower.includes('físico')) return { logo: '💵', color: '#10b981', label: 'Dinheiro Físico' };
  return { logo: '🏛️', color: '#192234', label: accName };
}

export default function TransactionForm({ bankAccounts = [], categories = [], onSubmit }) {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    date: today,
    type: 'expense',
    category: 'Alimentação',
    accountId: bankAccounts[0]?.id || '',
    payee: '',
    product: '',
    value: '',
    status: 'paid'
  });

  // Estado para controle da dropdown customizada da Conta Bancária
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountDropdownRef = useRef(null);

  // Estados de Validação Personalizada
  const [errors, setErrors] = useState({});
  const [missingFields, setMissingFields] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Fechar dropdown de conta se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Categorias dinâmicas filtradas pelo Tipo (Saída vs Entrada)
  const currentCategories = formData.type === 'income' 
    ? (categories && categories.length > 0 ? categories.filter(c => c.type === 'income') : INCOME_CATEGORIES)
    : (categories && categories.length > 0 ? categories.filter(c => c.type === 'expense') : EXPENSE_CATEGORIES);

  const selectedAccountObj = bankAccounts.find(a => a.id === formData.accountId) || bankAccounts[0];
  const accountBadge = getBankBadge(selectedAccountObj);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Troca dinâmica de Tipo reavalia e reseta a Categoria para a primeira compatível
    if (name === 'type') {
      const incomeCats = categories && categories.length > 0 ? categories.filter(c => c.type === 'income') : INCOME_CATEGORIES;
      const expenseCats = categories && categories.length > 0 ? categories.filter(c => c.type === 'expense') : EXPENSE_CATEGORIES;
      const defaultCategory = value === 'income' 
        ? (incomeCats[0]?.value || incomeCats[0]?.name || 'Salário') 
        : (expenseCats[0]?.value || expenseCats[0]?.name || 'Alimentação');
      
      setFormData(prev => ({
        ...prev,
        type: value,
        category: defaultCategory
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const missing = [];
    const newErrors = {};

    if (!formData.date) {
      missing.push('Data da Operação');
      newErrors.date = true;
    }
    if (!formData.accountId && bankAccounts.length > 0) {
      missing.push('Conta Bancária');
      newErrors.accountId = true;
    }
    if (!formData.payee || !formData.payee.trim()) {
      missing.push('Beneficiário / Origem');
      newErrors.payee = true;
    }
    if (!formData.value || isNaN(parseFloat(formData.value)) || parseFloat(formData.value) <= 0) {
      missing.push('Valor (R$)');
      newErrors.value = true;
    }

    if (missing.length > 0) {
      setMissingFields(missing);
      setErrors(newErrors);
      setShowValidationModal(true);
      return;
    }

    const selectedAccountId = formData.accountId || (bankAccounts[0]?.id || '');
    
    onSubmit({
      ...formData,
      accountId: selectedAccountId,
      value: parseFloat(formData.value)
    });

    // Resetar campos editáveis mantendo data, tipo e conta
    setFormData(prev => ({
      ...prev,
      payee: '',
      product: '',
      value: '',
      status: 'paid'
    }));
    setErrors({});
  };

  return (
    <div className="w-full">
      {/* MODAL DE VALIDAÇÃO PERSONALIZADO */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0b0f19] border border-red-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle size={26} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Campos Obrigatórios Pendentes</h3>
              <p className="text-xs text-[#94a3b8]">
                Para registrar o lançamento com precisão, preencha os seguintes itens:
              </p>
            </div>

            <div className="bg-[#121927] border border-[#192234] rounded-2xl p-4 text-left space-y-2">
              {missingFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                  <span>{field}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowValidationModal(false)}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              Entendido, vou preencher
            </button>
          </div>
        </div>
      )}

      {/* FORMULÁRIO BARRA INTEGRADA COMPACTA & ULTRA MODERNA */}
      <form 
        onSubmit={handleSubmit}
        className="glass-card p-4 rounded-3xl border border-[#192234] shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-wrap lg:flex-nowrap items-end gap-3 w-full relative z-30"
      >
        {/* 1. DATA */}
        <div className="flex flex-col w-[130px] shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Data
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full h-[38px] bg-[#121927] border rounded-xl px-2 text-xs font-mono text-white focus:outline-none transition-all cursor-pointer ${
              errors.date ? 'border-red-500 bg-red-950/20' : 'border-[#192234] focus:border-[#00ff87]'
            }`}
          />
        </div>

        {/* 2. TIPO */}
        <div className="flex flex-col w-[110px] shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Tipo
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`w-full h-[38px] bg-[#121927] border rounded-xl px-2 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
              formData.type === 'expense' 
                ? 'border-red-500/80 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                : 'border-[#00ff87]/80 text-[#00ff87] shadow-[0_0_10px_rgba(0,255,135,0.2)]'
            }`}
          >
            <option value="expense" className="bg-[#0b0f19] text-red-400">🔴 Saída</option>
            <option value="income" className="bg-[#0b0f19] text-[#00ff87]">🟢 Entrada</option>
          </select>
        </div>

        {/* 3. CATEGORIA (FILTRADA DINAMICAMENTE PELO TIPO) */}
        <div className="flex flex-col w-[140px] shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Categoria
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full h-[38px] bg-[#121927] border border-[#192234] rounded-xl px-2 text-xs font-medium text-white focus:outline-none focus:border-[#00ff87] transition-all cursor-pointer"
          >
            {currentCategories.map((c) => {
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

        {/* 4. CONTA BANCÁRIA (BADGE CENTRADO COMPACTO) */}
        <div className="flex flex-col w-[54px] shrink-0 relative z-40" ref={accountDropdownRef}>
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 text-center truncate">
            Conta
          </label>
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className={`w-full h-[38px] rounded-xl bg-[#121927] border ${
                errors.accountId 
                  ? 'border-red-500 animate-pulse bg-red-950/20' 
                  : 'border-[#192234] hover:border-[#00ff87]/50'
              } flex items-center justify-center transition-all cursor-pointer`}
              title={selectedAccountObj?.name || 'Selecionar Conta'}
            >
              <BankIcon 
                src={selectedAccountObj?.icon || selectedAccountObj?.image} 
                bankName={selectedAccountObj?.name} 
                size="sm" 
              />
            </button>

            {/* Menu Suspenso Flutuante (z-[100]) */}
            {isAccountOpen && (
              <div className="absolute top-full left-0 mt-1 z-[100] w-60 rounded-xl bg-[#0b0f19] border border-[#192234] shadow-[0_10px_40px_rgba(0,0,0,0.95)] p-1.5 space-y-1">
                {bankAccounts.map(acc => {
                  const isSelected = formData.accountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, accountId: acc.id }));
                        setIsAccountOpen(false);
                        if (errors.accountId) {
                          setErrors(prev => ({ ...prev, accountId: false }));
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/30' : 'text-white hover:bg-[#121927]'
                      }`}
                    >
                      <BankIcon src={acc.icon || acc.image} bankName={acc.name} size="sm" />
                      <span className="truncate">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 5. BENEFICIÁRIO (FLEXÍVEL) */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Beneficiário
          </label>
          <input
            type="text"
            name="payee"
            value={formData.payee}
            onChange={handleChange}
            placeholder="Ex: Supermercado"
            className={`w-full h-[38px] bg-[#121927] border rounded-xl px-3 text-xs text-white placeholder-[#475569] focus:outline-none transition-all ${
              errors.payee ? 'border-red-500 bg-red-950/20' : 'border-[#192234] focus:border-[#00ff87]'
            }`}
          />
        </div>

        {/* 6. PRODUTO (FLEXÍVEL) */}
        <div className="flex flex-col flex-1 min-w-[120px]">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Produto / Detalhe
          </label>
          <input
            type="text"
            name="product"
            value={formData.product}
            onChange={handleChange}
            placeholder="Ex: Compras semanais"
            className="w-full h-[38px] bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00ff87] transition-all"
          />
        </div>

        {/* 7. VALOR */}
        <div className="flex flex-col w-[130px] shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Valor (R$)
          </label>
          <CurrencyInput
            name="value"
            value={formData.value}
            onChange={handleChange}
            placeholder="0,00"
            className={`w-full h-[38px] bg-[#121927] border rounded-xl text-xs font-bold font-mono text-white placeholder-[#475569] focus:outline-none transition-all ${
              errors.value ? 'border-red-500 bg-red-950/20' : 'border-[#192234] focus:border-[#00ff87]'
            }`}
          />
        </div>

        {/* 8. STATUS (TOGGLE VISUAL PAGO VS PENDENTE) */}
        <div className="flex flex-col w-[120px] shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Status
          </label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'paid' ? 'pending' : 'paid' }))}
            className={`w-full h-[38px] rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
              formData.status === 'paid'
                ? 'bg-[#00ff87]/15 border-[#00ff87]/40 text-[#00ff87]'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}
          >
            {formData.status === 'paid' ? (
              <>
                <CheckCircle2 size={13} strokeWidth={2.5} />
                <span>Pago</span>
              </>
            ) : (
              <>
                <Clock size={13} strokeWidth={2.5} />
                <span>A Pagar</span>
              </>
            )}
          </button>
        </div>

        {/* 9. BOTÃO DE SUBMIT ADICIONAR */}
        <div className="w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
          <button
            type="submit"
            className="w-full lg:w-auto h-[38px] px-5 rounded-xl bg-[#00ff87] text-black font-extrabold text-xs shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:bg-[#26ff98] hover:shadow-[0_0_25px_rgba(0,255,135,0.6)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle size={16} strokeWidth={2.5} />
            <span>Lançar</span>
          </button>
        </div>
      </form>
    </div>
  );
}
