import React, { useState } from 'react';
import { Search, Trash2, Pencil, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import EditTransactionModal from './EditTransactionModal';
import BankIcon from './BankIcon';

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

function getOriginBadge(tx) {
  if (tx.type === 'transfer') {
    return { label: 'Transferência', emoji: '🔄', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
  }
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
  categories = [],
  onDelete, 
  onEdit,
  onUpdateStatus, 
  onUpdateCategory 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingTx, setEditingTx] = useState(null);

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

  const getAccountInfo = (id) => {
    const account = bankAccounts.find(a => a.id === id);
    if (!account) return { name: 'Outra', icon: '/imagens/icones_de_banco/icone_banco-outros.png' };
    return { name: account.name, icon: account.icon || account.image };
  };

  const getDynamicCategoryEmoji = (catName) => {
    if (!catName) return '🏷️';
    if (categories && categories.length > 0) {
      const found = categories.find(c => c.name === catName || c.value === catName);
      if (found && found.emoji) return found.emoji;
    }
    return CATEGORY_EMOJIS[catName] || '🏷️';
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
      filterType === 'all' ? true : 
      filterType === 'income' ? (t.type === 'income' || t.type === 'receita') : 
      filterType === 'transfer' ? (t.type === 'transfer') :
      (t.type === 'expense' || t.type === 'despesa');
    
    return matchesSearch && matchesType;
  });

  const handleSaveEditedTx = (updatedTx) => {
    if (onEdit) {
      onEdit(updatedTx);
    }
    setEditingTx(null);
  };

  return (
    <div className="glass-card rounded-3xl border border-[#192234] shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden w-full">
      
      {/* Modal de Edição */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          bankAccounts={bankAccounts}
          categories={categories}
          onSave={handleSaveEditedTx}
          onClose={() => setEditingTx(null)}
        />
      )}

      {/* Header da Tabela com Busca e Filtro */}
      <div className="p-6 border-b border-[#192234] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-lg text-white tracking-tight">Extrato Geral do Mês</h3>
          <p className="text-xs text-[#94a3b8]">Histórico completo e consolidado de todas as movimentações</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" size={15} />
            <input 
              type="text"
              placeholder="Buscar beneficiário, produto ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121927] border border-[#192234] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#00ff87] transition-all"
            />
          </div>

          {/* Filtro por Tipo */}
          <div className="flex rounded-xl bg-[#121927] p-1 border border-[#192234]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'all' 
                  ? 'bg-[#00ff87] text-black shadow-sm font-bold' 
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'expense' 
                  ? 'bg-red-500 text-white shadow-sm font-bold' 
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Saídas
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'income' 
                  ? 'bg-emerald-500 text-black shadow-sm font-bold' 
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterType('transfer')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'transfer' 
                  ? 'bg-cyan-500 text-black shadow-sm font-bold' 
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Transferências
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#192234] bg-[#0c121e]/80 text-[#64748b] uppercase tracking-wider font-mono text-[10px]">
              <th className="px-5 py-3.5 font-bold">Data</th>
              <th className="px-5 py-3.5 font-bold">Origem</th>
              <th className="px-5 py-3.5 font-bold">Conta</th>
              <th className="px-5 py-3.5 font-bold">Categoria</th>
              <th className="px-5 py-3.5 font-bold">Beneficiário / Detalhe</th>
              <th className="px-5 py-3.5 font-bold">Valor</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
              <th className="px-5 py-3.5 font-bold text-center">Ações</th>
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
                const isTransfer = t.type === 'transfer';
                const isExpense = t.type === 'expense' || t.type === 'despesa';
                const originBadge = getOriginBadge(t);
                const emoji = getDynamicCategoryEmoji(t.category);
                const accInfo = getAccountInfo(t.accountId);
                const destAccInfo = t.destinationAccountId ? getAccountInfo(t.destinationAccountId) : null;

                // Filtrar opções de categoria compatíveis com a natureza da transação (Saída vs Entrada)
                const categoryOptions = isExpense
                  ? (categories && categories.length > 0 ? categories.filter(c => c.type === 'expense') : EXPENSE_CATEGORIES)
                  : (categories && categories.length > 0 ? categories.filter(c => c.type === 'income') : INCOME_CATEGORIES);

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
                      {isTransfer && destAccInfo ? (
                        <span className="inline-flex items-center gap-1.5">
                          <BankIcon src={accInfo.icon} bankName={accInfo.name} size="xs" />
                          <span className="truncate max-w-[80px]">{accInfo.name}</span>
                          <ArrowRight size={11} className="text-cyan-400 shrink-0" />
                          <BankIcon src={destAccInfo.icon} bankName={destAccInfo.name} size="xs" />
                          <span className="truncate max-w-[80px]">{destAccInfo.name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <BankIcon src={accInfo.icon} bankName={accInfo.name} size="xs" />
                          <span>{accInfo.name}</span>
                        </span>
                      )}
                    </td>

                    {/* 4. Categoria */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {isTransfer ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          <span>🔄</span>
                          <span>Transferência</span>
                        </span>
                      ) : onUpdateCategory ? (
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
                          {categoryOptions.map(opt => {
                            const val = opt.value || opt.name;
                            const label = opt.label || opt.name;
                            return (
                              <option key={opt.id || val} value={val} className="bg-[#0b0f19] text-white">
                                {opt.emoji || '🏷️'} {label}
                              </option>
                            );
                          })}
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
                    <td className={`px-5 py-3.5 whitespace-nowrap font-bold font-mono text-xs ${
                      isTransfer ? 'text-cyan-400' : isExpense ? 'text-rose-400' : 'text-[#00ff87]'
                    }`}>
                      {isTransfer ? '↔ ' : isExpense ? '-' : '+'}{formatCurrency(t.value)}
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

                    {/* 8. Ações (Editar & Excluir) */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          type="button"
                          onClick={() => setEditingTx(t)}
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-[#00ff87] hover:bg-[#00ff87]/10 transition-colors cursor-pointer"
                          title="Editar Lançamento"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => onDelete(t.id)}
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Excluir Lançamento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
