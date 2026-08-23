import React, { useState } from 'react';
import { X, Check, AlertCircle, Edit3 } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

export default function EditTransactionModal({ 
  transaction, 
  bankAccounts = [], 
  categories = [], 
  onSave, 
  onClose 
}) {
  const [formData, setFormData] = useState({
    id: transaction.id,
    date: transaction.date || new Date().toISOString().split('T')[0],
    type: transaction.type === 'despesa' ? 'expense' : (transaction.type === 'receita' ? 'income' : transaction.type || 'expense'),
    category: transaction.category || '',
    accountId: transaction.accountId || bankAccounts[0]?.id || '',
    payee: transaction.payee || transaction.description || '',
    product: transaction.product || '',
    value: transaction.value !== undefined ? transaction.value : '',
    status: transaction.status || 'paid',
    origin: transaction.origin || 'manual'
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Categorias dinâmicas filtradas pelo Tipo (Saída vs Entrada)
  const currentCategories = formData.type === 'income'
    ? (categories && categories.length > 0 ? categories.filter(c => c.type === 'income') : INCOME_CATEGORIES)
    : (categories && categories.length > 0 ? categories.filter(c => c.type === 'expense') : EXPENSE_CATEGORIES);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.date) {
      setErrorMsg('Por favor, informe a Data da operação.');
      return;
    }
    if (!formData.accountId) {
      setErrorMsg('Por favor, selecione a Conta bancária.');
      return;
    }
    if (!formData.payee || !formData.payee.trim()) {
      setErrorMsg('Por favor, informe o Beneficiário / Origem.');
      return;
    }
    const numVal = parseFloat(formData.value);
    if (isNaN(numVal) || numVal <= 0) {
      setErrorMsg('Por favor, informe um Valor válido maior que zero.');
      return;
    }

    onSave({
      ...formData,
      value: numVal
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0b0f19] border border-[#192234] rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,255,135,0.15)] text-left space-y-5 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-[#192234] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] flex items-center justify-center font-bold">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Editar Lançamento</h3>
              <p className="text-xs text-[#94a3b8]">Modifique os dados do registro e salve para atualizar o extrato</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748b] hover:text-white hover:bg-[#121927] transition-colors cursor-pointer shrink-0"
            title="Fechar Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensagem de Erro (se houver) */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário do Modal */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. DATA */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Data
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-[#00ff87] transition-all"
              />
            </div>

            {/* 2. TIPO */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Tipo da Operação
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full h-10 bg-[#121927] border rounded-xl px-3 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                  formData.type === 'expense'
                    ? 'border-red-500/50 text-red-400'
                    : 'border-[#00ff87]/50 text-[#00ff87]'
                }`}
              >
                <option value="expense" className="bg-[#0b0f19] text-red-400">🔴 Saída (Despesa)</option>
                <option value="income" className="bg-[#0b0f19] text-[#00ff87]">🟢 Entrada (Receita)</option>
              </select>
            </div>

            {/* 3. CATEGORIA */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Categoria
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs font-medium text-white focus:outline-none focus:border-[#00ff87] transition-all cursor-pointer"
              >
                {currentCategories.map(c => {
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

            {/* 4. CONTA BANCÁRIA */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Conta Bancária
              </label>
              <select
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs font-medium text-white focus:outline-none focus:border-[#00ff87] transition-all cursor-pointer"
              >
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-[#0b0f19] text-white">
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. BENEFICIÁRIO */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Beneficiário / Origem
              </label>
              <input
                type="text"
                name="payee"
                value={formData.payee}
                onChange={handleChange}
                placeholder="Ex: Supermercado Carrefour"
                className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00ff87] transition-all"
              />
            </div>

            {/* 6. PRODUTO / DESCRIÇÃO */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Produto / Descrição Detalhada
              </label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                placeholder="Ex: Compras do mês"
                className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00ff87] transition-all"
              />
            </div>

            {/* 7. VALOR */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Valor (R$)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold font-mono text-[#00ff87] pointer-events-none">
                  R$
                </span>
                <input
                  type="number"
                  name="value"
                  step="0.01"
                  value={formData.value}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl pl-9 pr-3 text-xs font-bold font-mono text-white placeholder-[#475569] focus:outline-none focus:border-[#00ff87] transition-all"
                />
              </div>
            </div>

            {/* 8. STATUS */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Status de Pagamento
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#00ff87] transition-all cursor-pointer"
              >
                <option value="paid" className="bg-[#0b0f19] text-[#00ff87]">🟢 Pago / Recebido</option>
                <option value="pending" className="bg-[#0b0f19] text-amber-300">⏳ A Pagar / Pendente</option>
              </select>
            </div>

          </div>

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#192234]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#121927] border border-[#192234] text-xs font-bold text-[#94a3b8] hover:text-white hover:bg-[#182236] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00ff87] text-black text-xs font-bold shadow-[0_0_20px_rgba(0,255,135,0.35)] hover:bg-[#26ff98] transition-all cursor-pointer"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Salvar Alterações</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
