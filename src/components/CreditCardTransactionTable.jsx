import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Trash2, 
  Calendar, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import BankIcon from './BankIcon';

export default function CreditCardTransactionTable({
  transactions = [],
  cards = [],
  categories = [],
  onDeleteInstallment,
  onDeletePurchase,
  onUpdateStatus
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCardFilter, setSelectedCardFilter] = useState('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');

  // Filtra apenas transações de Cartão de Crédito
  const creditTransactions = transactions.filter(t => t.cardId || t.paymentMethod === 'credit');

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

  const getCardInfo = (cardId) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return { name: 'Cartão de Crédito', digits: '', icon: null, bankName: '' };
    return card;
  };

  const filteredTransactions = creditTransactions.filter(t => {
    const payeeName = t.payee || t.description || '';
    const productName = t.product || '';
    const categoryName = t.category || '';

    const matchesSearch = 
      payeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCard = selectedCardFilter === 'all' || t.cardId === selectedCardFilter;

    const matchesMonth = selectedMonthFilter === 'all' || (t.date && t.date.startsWith(selectedMonthFilter));

    return matchesSearch && matchesCard && matchesMonth;
  });

  const totalFaturasGeral = filteredTransactions.reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0);

  return (
    <div className="glass-card rounded-3xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)] overflow-hidden w-full space-y-4 p-5 animate-fade-in">
      
      {/* CABEÇALHO DO EXTRATO DE CARTÕES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#192234]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Extrato Geral do Mês - Cartões de Crédito
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {creditTransactions.length} parcelas lançadas
              </span>
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Compras parceladas, faturas a vencer e projeções futuras
            </p>
          </div>
        </div>

        {/* Totalizador Rápido das Faturas Filtradas */}
        <div className="flex items-center gap-3 bg-[#0d1320] px-4 py-2 rounded-2xl border border-purple-500/20">
          <span className="text-xs text-[#94a3b8]">Total da Visão:</span>
          <span className="text-sm font-black font-mono text-purple-300">
            {formatCurrency(totalFaturasGeral)}
          </span>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS & FILTROS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Campo de Busca */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            placeholder="Buscar por estabelecimento, produto ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-[#121927] border border-[#192234] text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-purple-400 transition-all"
          />
        </div>

        {/* Filtros por Cartão */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCardFilter}
            onChange={(e) => setSelectedCardFilter(e.target.value)}
            className="h-9 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs font-semibold text-white focus:outline-none focus:border-purple-400 transition-all cursor-pointer"
          >
            <option value="all" className="bg-[#0b0f19] text-white">Todos os Cartões</option>
            {cards.map(c => (
              <option key={c.id} value={c.id} className="bg-[#0b0f19] text-white">
                💳 {c.name} {c.digits ? `(•••• ${c.digits})` : ''}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* TABELA DE LANÇAMENTOS NO CRÉDITO */}
      <div className="overflow-x-auto custom-scrollbar border border-[#192234] rounded-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0e1422] text-[#94a3b8] uppercase text-[10px] tracking-wider border-b border-[#192234]">
              <th className="px-4 py-3 font-bold">Vencimento Fatura</th>
              <th className="px-4 py-3 font-bold">Cartão</th>
              <th className="px-4 py-3 font-bold">Categoria</th>
              <th className="px-4 py-3 font-bold">Estabelecimento / Produto</th>
              <th className="px-4 py-3 font-bold text-center">Parcela</th>
              <th className="px-4 py-3 font-bold text-right">Valor da Parcela</th>
              <th className="px-4 py-3 font-bold text-center">Status</th>
              <th className="px-4 py-3 font-bold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#192234]">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-xs text-[#64748b]">
                  Nenhuma compra no cartão de crédito encontrada nesta visão.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const cardInfo = getCardInfo(t.cardId);
                const isPaid = t.status === 'paid';
                const isInstallment = t.installmentsTotal > 1;

                return (
                  <tr key={t.id} className="hover:bg-[#121927]/60 transition-colors">
                    
                    {/* 1. Data de Vencimento da Fatura */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[#94a3b8]">
                      <div>
                        <span className="font-bold text-white block">{formatDate(t.date)}</span>
                        {t.purchaseDate && (
                          <span className="text-[10px] text-[#64748b]">Compra: {formatDate(t.purchaseDate)}</span>
                        )}
                      </div>
                    </td>

                    {/* 2. Cartão */}
                    <td className="px-4 py-3 whitespace-nowrap text-white font-medium">
                      <div className="flex items-center gap-2">
                        <BankIcon src={cardInfo.icon || cardInfo.image} bankName={cardInfo.name} size="xs" />
                        <div>
                          <span className="font-bold text-xs block">{cardInfo.name}</span>
                          {cardInfo.digits && (
                            <span className="text-[10px] text-[#64748b] font-mono">•••• {cardInfo.digits}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Categoria */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-950/30 text-purple-200 border border-purple-500/30">
                        <span>🏷️</span>
                        <span>{t.category || 'Outros'}</span>
                      </span>
                    </td>

                    {/* 4. Estabelecimento / Produto */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex flex-col truncate" title={t.payee || t.description}>
                        <span className="text-xs font-bold text-white truncate">{t.payee || t.description}</span>
                        {t.product && (
                          <span className="text-[10px] text-[#94a3b8] truncate">{t.product}</span>
                        )}
                      </div>
                    </td>

                    {/* 5. Parcela */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {isInstallment ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          <Layers size={11} />
                          <span>{t.installmentNumber}/{t.installmentsTotal}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#121927] text-[#94a3b8] border border-[#192234]">
                          À vista
                        </span>
                      )}
                    </td>

                    {/* 6. Valor */}
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold font-mono text-xs text-purple-300">
                      {formatCurrency(t.value)}
                    </td>

                    {/* 7. Status */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {isPaid ? (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus && onUpdateStatus(t.id, 'pending')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30 hover:bg-[#00ff87]/20 transition-all cursor-pointer"
                          title="Fatura Paga (Clique para alternar para Aberta)"
                        >
                          <CheckCircle2 size={11} />
                          <span>Paga</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus && onUpdateStatus(t.id, 'paid')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                          title="Fatura Aberta (Clique para marcar como Paga)"
                        >
                          <Clock size={11} />
                          <span>Aberta</span>
                        </button>
                      )}
                    </td>

                    {/* 8. Ações */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Excluir Parcela Individual */}
                        <button
                          type="button"
                          onClick={() => onDeleteInstallment && onDeleteInstallment(t.id)}
                          className="p-1.5 rounded-lg bg-[#121927] text-[#64748b] hover:text-red-400 hover:border-red-500/40 border border-[#192234] transition-all cursor-pointer"
                          title="Excluir apenas esta parcela"
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* Excluir Compra Completa (Todas as Parcelas) */}
                        {isInstallment && t.purchaseId && (
                          <button
                            type="button"
                            onClick={() => onDeletePurchase && onDeletePurchase(t.purchaseId)}
                            className="px-2 py-1 rounded-lg bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-500/30 text-[10px] font-bold transition-all cursor-pointer"
                            title="Cancelar toda a compra e excluir todas as parcelas"
                          >
                            Excluir Tudo
                          </button>
                        )}

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
