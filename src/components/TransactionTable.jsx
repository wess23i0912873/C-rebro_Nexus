import React, { useState } from 'react';
import { Search, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

const CATEGORY_EMOJIS = {
  'Alimentação': '🍔',
  'Habitação': '🏠',
  'Lazer': '🎮',
  'Saúde': '🏥',
  'Transporte': '🚗',
  'Salário': '💼',
  'Salário / Renda': '💼',
  'Renda': '💼',
  'Investimentos': '📈',
  'Outros': '🏷️',
  'Geral': '📁',
  'Entrada': '🟢',
  'Saída': '🔴',
  'Transferência Interna': '🔄'
};

function getCategoryEmoji(catName) {
  if (!catName) return '🏷️';
  return CATEGORY_EMOJIS[catName] || '🏷️';
}

function getOriginBadge(tx) {
  if (tx.origin === 'extrato' || tx.product === 'Importação Extrato' || tx.id?.toString().includes('ofx') || tx.id?.toString().includes('csv') || tx.id?.toString().includes('imp')) {
    return { label: 'Extrato', emoji: '📥', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  }
  if (tx.origin === 'whatsapp') {
    return { label: 'WhatsApp', emoji: '💬', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
  }
  return { label: 'Manual', emoji: '✍️', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' };
}

export default function TransactionTable({ 
  transactions = [], 
  bankAccounts = [], 
  onDelete, 
  onUpdateStatus, 
  onUpdateCategory 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
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
    const payeeName = t.payee || t.description || '';
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
    <div className="rounded-3xl border border-[#192234] bg-[#0b0f19] shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden w-full">
      
      {/* Controles de Cabeçalho do Extrato Geral do Mês */}
      <div className="p-5 border-b border-[#192234] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d1320]/60">
        <div>
          <h4 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
            <span>Extrato Geral do Mês</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00ff87]/15 text-[#00ff87] font-mono border border-[#00ff87]/30">
              {filteredTransactions.length} itens
            </span>
          </h4>
          <p className="text-xs text-[#94a3b8]">Todos os lançamentos manuais, extratos e integrações do período</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {/* Barra de Busca */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#64748b]">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar no extrato..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121927] border border-[#192234] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#00ff87] transition-colors"
            />
          </div>

          {/* Filtro de Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#121927] border border-[#192234] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#00ff87] transition-colors cursor-pointer"
          >
            <option value="all">Todos os Lançamentos</option>
            <option value="expense">🔴 Apenas Saídas</option>
            <option value="income">🟢 Apenas Entradas</option>
            <option value="pending">⏳ Apenas Pendentes</option>
          </select>
        </div>
      </div>

      {/* Tabela Responsiva do Extrato Geral */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#192234] bg-[#0d1320] text-[#64748b] font-semibold uppercase tracking-wider text-[10px]">
              <th className="px-5 py-3.5">Data</th>
              <th className="px-5 py-3.5">Origem</th>
              <th className="px-5 py-3.5">Conta</th>
              <th className="px-5 py-3.5">Categoria (Filtrada por Tipo)</th>
              <th className="px-5 py-3.5">Beneficiário / Produto</th>
              <th className="px-5 py-3.5">Valor</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#192234]">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-xs text-[#64748b]">
                  Nenhum lançamento registrado nesta visão.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isExpense = t.type === 'expense' || t.type === 'despesa';
                const originBadge = getOriginBadge(t);
                const emoji = getCategoryEmoji(t.category);

                // Filtrar opções de categoria compatíveis com a natureza da transação (Saída vs Entrada)
                const categoryOptions = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

                return (
                  <tr key={t.id} className="hover:bg-[#121927]/60 transition-colors duration-150">
                    
                    {/* 1. Data */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[#94a3b8]">
                      {formatDate(t.date)}
                    </td>

                    {/* 2. Origem */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${originBadge.color}`}>
                        <span>{originBadge.emoji}</span>
                        <span>{originBadge.label}</span>
                      </span>
                    </td>

                    {/* 3. Conta */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-white font-medium">
                      {getAccountName(t.accountId)}
                    </td>

                    {/* 4. Categoria (Filtrada Dinamicamente pelo Tipo da Linha: Saída vs Entrada) */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {onUpdateCategory ? (
                        <select
                          value={t.category || (isExpense ? 'Alimentação' : 'Salário')}
                          onChange={(e) => onUpdateCategory(t.id, e.target.value)}
                          className={`bg-[#121927] hover:bg-[#182236] border text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                            isExpense 
                              ? 'border-red-500/30 focus:border-red-400 text-red-300' 
                              : 'border-[#00ff87]/30 focus:border-[#00ff87] text-[#00ff87]'
                          }`}
                          title={`Clique para alterar a categoria (Filtrada para ${isExpense ? 'Despesas' : 'Receitas'})`}
                        >
                          {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-[#0b0f19] text-white">
                              {opt.emoji} {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#121927] text-white border border-[#192234]">
                          <span>{emoji}</span>
                          <span>{t.category || 'Outros'}</span>
                        </span>
                      )}
                    </td>

                    {/* 5. Beneficiário & Descrição */}
                    <td className="px-5 py-3.5 max-w-[220px]">
                      <div className="flex flex-col truncate" title={t.payee || t.description}>
                        <span className="text-xs font-bold text-white truncate">{t.payee || t.description}</span>
                        {t.product && (
                          <span className="text-[10px] text-[#64748b] truncate">{t.product}</span>
                        )}
                      </div>
                    </td>

                    {/* 6. Valor */}
                    <td className={`px-5 py-3.5 whitespace-nowrap font-bold font-mono text-xs ${isExpense ? 'text-rose-400' : 'text-[#00ff87]'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(t.value)}
                    </td>

                    {/* 7. Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {t.status === 'paid' ? (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus && onUpdateStatus(t.id, 'pending')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30 hover:bg-[#00ff87]/20 transition-all cursor-pointer"
                          title="Clique para alternar para A Pagar"
                        >
                          <CheckCircle size={10} />
                          Pago
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus && onUpdateStatus(t.id, 'paid')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                          title="Clique para alternar para Pago"
                        >
                          <AlertCircle size={10} />
                          A pagar
                        </button>
                      )}
                    </td>

                    {/* 8. Ações */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <button 
                        type="button"
                        onClick={() => onDelete(t.id)}
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
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
