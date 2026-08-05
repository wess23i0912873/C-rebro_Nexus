import React, { useState, useRef, useEffect } from 'react';
import { 
  PlusCircle, 
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

function getBankBadge(accName) {
  if (!accName) return { logo: '🏛️', color: '#192234', label: 'Conta' };
  const lower = accName.toLowerCase();
  if (lower.includes('nubank')) return { logo: 'Nu', color: '#820AD1', label: 'Nubank' };
  if (lower.includes('itaú') || lower.includes('itau')) return { logo: 'Itaú', color: '#EC7000', label: 'Itaú' };
  if (lower.includes('mercado')) return { logo: 'MP', color: '#009EE3', label: 'Mercado Pago' };
  if (lower.includes('inter')) return { logo: 'Inter', color: '#FF7A00', label: 'Inter' };
  if (lower.includes('caixa')) return { logo: 'Caixa', color: '#005CA9', label: 'Caixa' };
  if (lower.includes('brasil') || lower.includes('bb')) return { logo: 'BB', color: '#0038A8', label: 'Banco do Brasil' };
  if (lower.includes('dinheiro') || lower.includes('wallet') || lower.includes('físico')) return { logo: '💵', color: '#10b981', label: 'Dinheiro Físico' };
  return { logo: '🏛️', color: '#192234', label: accName };
}

export default function TransactionForm({ bankAccounts = [], onSubmit }) {
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
  const currentCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const selectedAccountObj = bankAccounts.find(a => a.id === formData.accountId) || bankAccounts[0];
  const accountBadge = getBankBadge(selectedAccountObj?.name || '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Troca dinâmica de Tipo reavalia e reseta a Categoria para a primeira compatível
    if (name === 'type') {
      const defaultCategory = value === 'income' ? INCOME_CATEGORIES[0].value : EXPENSE_CATEGORIES[0].value;
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
    if (!formData.accountId) {
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

    setErrors({});
    setFormData(prev => ({
      ...prev,
      payee: '',
      product: '',
      value: '',
    }));
  };

  return (
    <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full mb-6 animate-fade-in relative z-20">
      
      {/* Cabeçalho do Formulário */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#192234]">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] flex items-center justify-center">
            <PlusCircle size={16} />
          </div>
          <span>Lançamento Rápido de Transações</span>
        </h4>
      </div>

      {/* FORMULÁRIO EM UMA ÚNICA LINHA SEM ROLAGEM HORIZONTAL */}
      <form onSubmit={handleSubmit} noValidate className="flex items-end gap-2 w-full">
        
        {/* 1. DATA (COMPACTA) */}
        <div className="flex flex-col w-[110px] shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Data
          </label>
          <input 
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full h-[38px] bg-[#121927] border rounded-xl px-2 text-xs font-mono text-white focus:outline-none transition-all ${
              errors.date 
                ? 'border-red-500 animate-pulse bg-red-950/20' 
                : 'border-[#192234] focus:border-[#00ff87]'
            }`}
          />
        </div>

        {/* 2. TIPO */}
        <div className="flex flex-col w-[115px] shrink-0">
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
        <div className="flex flex-col w-[135px] shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Categoria
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full h-[38px] bg-[#121927] border border-[#192234] rounded-xl px-2 text-xs font-medium text-white focus:outline-none focus:border-[#00ff87] transition-all cursor-pointer"
          >
            {currentCategories.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#0b0f19] text-white">
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. CONTA BANCÁRIA (BADGE CENTRADO COMPACTO) */}
        <div className="flex flex-col w-[44px] shrink-0" ref={accountDropdownRef}>
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 text-center truncate">
            Conta
          </label>
          <div className="relative">
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
              <span 
                className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shadow-sm"
                style={{ backgroundColor: accountBadge.color }}
              >
                {accountBadge.logo}
              </span>
            </button>

            {/* Menu Suspenso Flutuante (z-50) */}
            {isAccountOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 w-60 rounded-xl bg-[#0b0f19] border border-[#192234] shadow-[0_10px_40px_rgba(0,0,0,0.9)] p-1.5 space-y-1">
                {bankAccounts.map(acc => {
                  const b = getBankBadge(acc.name);
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
                      <span className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] text-white shrink-0" style={{ backgroundColor: b.color }}>
                        {b.logo}
                      </span>
                      <span className="truncate">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 5. BENEFICIÁRIO (FLEXÍVEL) */}
        <div className="flex flex-col flex-1 min-w-[90px]">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Beneficiário
          </label>
          <input 
            type="text"
            name="payee"
            value={formData.payee}
            onChange={handleChange}
            placeholder="Ex: Carrefour"
            className={`w-full h-[38px] bg-[#121927] border rounded-xl px-2 text-xs text-white placeholder-[#475569] focus:outline-none transition-all ${
              errors.payee 
                ? 'border-red-500 animate-pulse bg-red-950/20' 
                : 'border-[#192234] focus:border-[#00ff87]'
            }`}
          />
        </div>

        {/* 6. PRODUTO / DESCRIÇÃO (FLEXÍVEL) */}
        <div className="flex flex-col flex-1 min-w-[90px]">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Produto/Descrição
          </label>
          <input 
            type="text"
            name="product"
            value={formData.product}
            onChange={handleChange}
            placeholder="Ex: Compras"
            className="w-full h-[38px] bg-[#121927] border border-[#192234] rounded-xl px-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00ff87] transition-all"
          />
        </div>

        {/* 7. VALOR (R$) (COMPACTO COM STEP DE 0.10) */}
        <div className="flex flex-col w-[95px] shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 truncate">
            Valor (R$)
          </label>
          <div className="relative flex items-center w-full">
            <span className="absolute left-2 text-xs font-bold font-mono text-[#00ff87] pointer-events-none z-10">
              R$
            </span>
            <input 
              type="number"
              name="value"
              step="0.10"
              value={formData.value}
              onChange={handleChange}
              placeholder="0,00"
              className={`w-full h-[38px] bg-[#121927] border rounded-xl pl-7 pr-1 text-xs font-bold font-mono text-white placeholder-[#475569] focus:outline-none transition-all ${
                errors.value 
                  ? 'border-red-500 animate-pulse bg-red-950/20' 
                  : 'border-[#192234] focus:border-[#00ff87]'
              }`}
            />
          </div>
        </div>

        {/* 8. STATUS (ÍCONE COMPACTO ALTERNÁVEL POR CLIQUE) */}
        <div className="flex flex-col shrink-0">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1 text-center truncate">
            Status
          </label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'paid' ? 'pending' : 'paid' }))}
            className={`w-[38px] h-[38px] rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              formData.status === 'paid'
                ? 'bg-[#00ff87]/15 border-[#00ff87]/40 text-[#00ff87] hover:bg-[#00ff87]/25'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            }`}
            title={formData.status === 'paid' ? 'Status: Pago / Concluído (Clique para alterar)' : 'Status: A pagar / Pendente (Clique para alterar)'}
          >
            {formData.status === 'paid' ? (
              <CheckCircle2 size={18} strokeWidth={2.5} />
            ) : (
              <Clock size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* 9. BOTÃO DE ADICIONAR ('+') */}
        <div className="flex flex-col shrink-0 justify-end">
          <button 
            type="submit"
            className="h-[38px] w-[38px] rounded-xl bg-[#00ff87] text-black font-bold shadow-[0_0_15px_rgba(0,255,135,0.3)] hover:bg-[#26ff98] hover:shadow-[0_0_20px_rgba(0,255,135,0.5)] flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Adicionar Lançamento no Sistema"
          >
            <PlusCircle size={20} strokeWidth={2.5} />
          </button>
        </div>

      </form>

      {/* MODAL DE VALIDAÇÃO PERSONALIZADA */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0b0f19] border border-red-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(239,68,68,0.2)] text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                Falta preencher os campos obrigatórios:
              </h3>
              <ul className="text-xs text-red-300 font-medium space-y-1 bg-red-950/30 p-3 rounded-xl border border-red-500/20">
                {missingFields.map((field, idx) => (
                  <li key={idx} className="flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-[#94a3b8]">
              Os campos pendentes foram destacadas em vermelho na tela para facilitar sua correção.
            </p>

            <button
              type="button"
              onClick={() => setShowValidationModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 font-bold text-xs transition-all cursor-pointer"
            >
              Entendi, vou corrigir
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
