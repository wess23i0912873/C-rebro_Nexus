import React, { useState } from 'react';
import { Search, Tag, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function TransactionTable({ transactions = [], bankAccounts = [], onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const getAccountName = (id) => {
    const account = bankAccounts.find(a => a.id === id);
    return account ? account.name : 'Outra';
  };

  const filteredTransactions = transactions.filter(t => {
    const payeeName = t.payee || '';
    const productName = t.product || '';
    const categoryName = t.category || '';
    
    const matchesSearch = 
      payeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      filterType === 'all' || 
      t.type === filterType ||
      (filterType === 'pending' && t.status === 'pending');

    return matchesSearch && matchesType;
  });

  return (
    <div className="glass-panel rounded-2xl border border-[#1e293b] flex flex-col overflow-hidden">
      {/* Controles de Cabeçalho */}
      <div className="p-5 border-b border-[#1e293b] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#090d16]/40">
        <div>
          <h4 className="font-display font-bold text-sm text-white">Lançamentos Recentes</h4>
          <p className="text-[10px] text-[#475569]">Fluxo de caixa geral e lançamentos</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {/* Barra de Busca */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#475569]">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar lançamento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#080b11]/60 border border-[#1e293b] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
            />
          </div>

          {/* Filtro de Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#080b11]/60 border border-[#1e293b] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors cursor-pointer"
          >
            <option value="all">Todos os Lançamentos</option>
            <option value="expense">Apenas Saídas</option>
            <option value="income">Apenas Entradas</option>
            <option value="pending">Apenas Pendentes</option>
          </select>
        </div>
      </div>

      {/* Tabela Responsiva para Monitor Desktop */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#1e293b] bg-[#090d16]/20">
              <th className="px-6 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Conta</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Beneficiário / Produto</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/40">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-xs text-[#475569]">
                  Nenhum lançamento registrado nesta visão.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isExpense = t.type === 'expense';
                
                return (
                  <tr key={t.id} className="hover:bg-[#0f1524]/20 transition-colors duration-150">
                    {/* Data */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono text-[#94a3b8]">
                      {formatDate(t.date)}
                    </td>

                    {/* Conta */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-white font-medium">
                      {getAccountName(t.accountId)}
                    </td>

                    {/* Categoria */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#172033] text-[#94a3b8] border border-white/5">
                        <Tag size={10} className="text-[var(--color-brand-secondary)]" />
                        {t.category}
                      </span>
                    </td>

                    {/* Beneficiário & Descrição */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{t.payee}</span>
                        {t.product && (
                          <span className="text-[10px] text-[#475569] mt-0.5">{t.product}</span>
                        )}
                      </div>
                    </td>

                    {/* Valor */}
                    <td className={`px-6 py-3.5 whitespace-nowrap text-xs font-bold font-mono ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(t.value)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {t.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={10} />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertCircle size={10} />
                          A pagar
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-center">
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="p-1.5 rounded-lg text-[#475569] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Excluir Lançamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
