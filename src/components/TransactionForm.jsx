import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

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

  const categories = [
    { value: 'Alimentação', label: 'Alimentação' },
    { value: 'Habitação', label: 'Habitação' },
    { value: 'Lazer', label: 'Lazer' },
    { value: 'Saúde', label: 'Saúde' },
    { value: 'Transporte', label: 'Transporte' },
    { value: 'Salário', label: 'Salário / Renda' },
    { value: 'Investimentos', label: 'Investimentos' },
    { value: 'Outros', label: 'Outros' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.value || isNaN(parseFloat(formData.value))) return;
    
    // Garantir que temos um accountId associado
    const selectedAccountId = formData.accountId || (bankAccounts[0]?.id || '');
    
    onSubmit({
      ...formData,
      accountId: selectedAccountId,
      value: parseFloat(formData.value)
    });

    // Limpar os campos mais variáveis, mas manter data/tipo/categoria/conta para facilitar múltiplos lançamentos
    setFormData(prev => ({
      ...prev,
      payee: '',
      product: '',
      value: '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[#1e293b] glow-card mb-6">
      <h4 className="font-display font-bold text-sm text-white mb-4 flex items-center gap-2">
        <PlusCircle size={16} className="text-[var(--color-brand-primary)]" />
        Lançamento Rápido
      </h4>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-end">
        {/* Data */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Data</label>
          <input 
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full bg-[var(--color-bg-input)] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
          />
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full bg-[var(--color-bg-input)] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
          >
            <option value="expense">Saída (Despesa)</option>
            <option value="income">Entrada (Receita)</option>
          </select>
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Categoria</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full bg-[var(--color-bg-input)] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Conta */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Conta</label>
          <select
            name="accountId"
            value={formData.accountId || (bankAccounts[0]?.id || '')}
            onChange={handleChange}
            required
            className="w-full bg-[var(--color-bg-input)] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
          >
            <option value="" disabled>Selecione...</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        {/* Beneficiário */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Beneficiário</label>
          <input 
            type="text"
            name="payee"
            value={formData.payee}
            onChange={handleChange}
            placeholder="Ex: Supermercado"
            required
            className="w-full bg-[var(--color-bg-input)] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white placeholder-[#27354f] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
          />
        </div>

        {/* Descrição / Produto */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Produto/Descrição</label>
          <input 
            type="text"
            name="product"
            value={formData.product}
            onChange={handleChange}
            placeholder="Ex: Compras semanais"
            className="w-full bg-[var(--color-bg-input)] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white placeholder-[#27354f] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
          />
        </div>

        {/* Valor */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Valor (R$)</label>
          <input 
            type="number"
            name="value"
            step="0.01"
            value={formData.value}
            onChange={handleChange}
            placeholder="0,00"
            required
            className="w-full bg-[var(--color-bg-input)] border border-[#1e293b] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#27354f] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-[var(--color-bg-input)] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
            >
              <option value="paid">Pago</option>
              <option value="pending">A pagar</option>
            </select>
          </div>
          
          <button 
            type="submit"
            className="h-[34px] w-[34px] flex items-center justify-center bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] text-white rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 transform active:scale-95 cursor-pointer"
          >
            <PlusCircle size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
