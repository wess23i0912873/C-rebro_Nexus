import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Clock,
  Sparkles,
  PieChart as PieIcon,
  Percent,
  CheckCircle2,
  Inbox,
  Plus
} from 'lucide-react';
import VisualDateRangePicker from './VisualDateRangePicker';
import CardVisual from './CardVisual';

export default function CardsModule({ 
  cards = [], 
  transactions = [], 
  bankAccounts = [] 
}) {
  const activeCards = cards || [];

  // Estados de Calendário
  const [cartoesTotalRange, setCartoesTotalRange] = useState({ start: null, end: null });
  const [entradasRange, setEntradasRange] = useState({ start: null, end: null });
  const [saidasRange, setSaidasRange] = useState({ start: null, end: null });
  
  // Estado específico de Mês para Comprometimento de Renda
  const [selectedComprometimentoMonth, setSelectedComprometimentoMonth] = useState(null);
  const [rankingCartoesRange, setRankingCartoesRange] = useState({ start: null, end: null });

  // Estado dos Accordions dos Cartões
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper para filtrar transações por intervalo de datas
  const filterByRange = (txList, range) => {
    if (!range.start || !range.end) return txList;
    const start = new Date(range.start).setHours(0, 0, 0, 0);
    const end = new Date(range.end).setHours(23, 59, 59, 999);
    return txList.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date).getTime();
      return tDate >= start && tDate <= end;
    });
  };

  // Verificação de Filtros Ativos
  const isCartoesTotalFiltered = Boolean(cartoesTotalRange.start && cartoesTotalRange.end);
  const isEntradasFiltered = Boolean(entradasRange.start && entradasRange.end);
  const isSaidasFiltered = Boolean(saidasRange.start && saidasRange.end);
  const isComprometimentoFiltered = Boolean(selectedComprometimentoMonth);
  const isRankingCartoesFiltered = Boolean(rankingCartoesRange.start && rankingCartoesRange.end);

  // Título Dinâmico em Português
  const getComprometimentoMonthTitle = () => {
    if (!selectedComprometimentoMonth) {
      const rawMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
      return `Faturas do mês de ${rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1)}`;
    }
    const rawMonth = selectedComprometimentoMonth.toLocaleDateString('pt-BR', { month: 'long' });
    const capitalizedMonth = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
    return `Faturas do mês de ${capitalizedMonth}`;
  };

  // Somatório das faturas atuais dos cartões reais
  const sumCurrentBills = activeCards.reduce((acc, c) => acc + (parseFloat(c.currentBill !== undefined ? c.currentBill : c.limitUsed || 0)), 0);
  const sumNextBills = activeCards.reduce((acc, c) => acc + (parseFloat(c.nextBill !== undefined ? c.nextBill : (c.limitUsed ? c.limitUsed * 0.5 : 0))), 0);

  // Totais Reais de Entradas e Saídas
  const filteredIncomeTxs = filterByRange(
    transactions.filter(t => t.type === 'income' || t.type === 'receita'),
    entradasRange
  );
  const totalEntradas = Math.round(
    filteredIncomeTxs.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0) * 100
  ) / 100;

  const filteredExpenseTxs = filterByRange(
    transactions.filter(t => t.type === 'expense' || t.type === 'despesa'),
    saidasRange
  );
  const totalSaidas = Math.round(
    filteredExpenseTxs.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0) * 100
  ) / 100;

  const totalGastoCartoes = isCartoesTotalFiltered ? sumCurrentBills : sumCurrentBills;
  const faturasVigente = sumCurrentBills;
  const faturasProximo = sumNextBills;

  const comprometidoVigentePercent = totalEntradas > 0 ? ((faturasVigente / totalEntradas) * 100).toFixed(1) : '0.0';
  const comprometidoProximoPercent = totalEntradas > 0 ? ((faturasProximo / totalEntradas) * 100).toFixed(1) : '0.0';

  // Ranking dinâmico de cartões
  const dynamicCardRanking = useMemo(() => {
    const cardTxs = isRankingCartoesFiltered
      ? filterByRange(transactions.filter(t => (t.type === 'expense' || t.type === 'despesa') && parseFloat(t.value) > 0), rankingCartoesRange)
      : transactions.filter(t => (t.type === 'expense' || t.type === 'despesa') && parseFloat(t.value) > 0);

    if (cardTxs.length === 0) return [];

    const catMap = {};
    let total = 0;
    cardTxs.forEach(t => {
      const cat = t.category || 'Outros';
      const val = parseFloat(t.value) || 0;
      catMap[cat] = (catMap[cat] || 0) + val;
      total += val;
    });

    const colors = ['#00ff87', '#10b981', '#059669', '#047857', '#064e3b'];
    return Object.entries(catMap)
      .map(([category, amount], idx) => ({
        icon: '🏷️',
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: total > 0 ? parseFloat(((amount / total) * 100).toFixed(1)) : 0,
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, isRankingCartoesFiltered, rankingCartoesRange]);

  const rankingTotal = dynamicCardRanking.reduce((acc, curr) => acc + curr.amount, 0);

  // Formatação BRL
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">

      {/* ==========================================
          1. TOPO (MÉTRICAS GLOBAIS)
         ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Gasto no Mês (Cartões) */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] relative group hover:border-[#00ff87]/40 transition-all glow-neon-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20">
                <CreditCard size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Total em Faturas</span>
            </div>

            <VisualDateRangePicker 
              startDate={cartoesTotalRange.start} 
              endDate={cartoesTotalRange.end} 
              onApplyRange={(start, end) => setCartoesTotalRange({ start, end })}
              onReset={() => setCartoesTotalRange({ start: null, end: null })}
            />
          </div>

          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {formatBRL(totalGastoCartoes)}
            </h3>
            <p className="text-[11px] text-[#64748b] font-mono mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87]" />
              {activeCards.length > 0 ? `Soma de ${activeCards.length} cartão(ões) cadastrados` : 'Nenhum cartão cadastrado'}
            </p>
          </div>
        </div>

        {/* Card 2: Total Entradas */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] relative group hover:border-[#00ff87]/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ArrowUpRight size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Total Entradas</span>
            </div>

            <VisualDateRangePicker 
              startDate={entradasRange.start} 
              endDate={entradasRange.end} 
              onApplyRange={(start, end) => setEntradasRange({ start, end })}
              onReset={() => setEntradasRange({ start: null, end: null })}
            />
          </div>

          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {formatBRL(totalEntradas)}
            </h3>
            <p className="text-[11px] text-[#64748b] font-mono mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {isEntradasFiltered ? 'Filtro por período aplicado' : 'Faturamento total do período'}
            </p>
          </div>
        </div>

        {/* Card 3: Total Saídas */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] relative group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ArrowDownRight size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Total Saídas</span>
            </div>

            <VisualDateRangePicker 
              startDate={saidasRange.start} 
              endDate={saidasRange.end} 
              onApplyRange={(start, end) => setSaidasRange({ start, end })}
              onReset={() => setSaidasRange({ start: null, end: null })}
            />
          </div>

          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {formatBRL(totalSaidas)}
            </h3>
            <p className="text-[11px] text-[#64748b] font-mono mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {isSaidasFiltered ? 'Filtro por período aplicado' : 'Despesas totais do período'}
            </p>
          </div>
        </div>

      </div>

      {/* ==========================================
          2. COMPROMETIMENTO DE RENDA POR FATURAS
         ========================================== */}
      <div className="glass-card p-6 rounded-2xl border border-[#192234] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#192234]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20 shadow-[0_0_15px_rgba(0,255,135,0.15)]">
              <Percent size={22} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">Comprometimento de Renda das Faturas</h4>
              <p className="text-xs text-[#94a3b8]">Impacto percentual do pagamento das faturas sobre a renda total</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <VisualDateRangePicker 
              isMonthOnly={true}
              selectedMonth={selectedComprometimentoMonth}
              onSelectMonth={(monthDate) => setSelectedComprometimentoMonth(monthDate)}
              onReset={() => setSelectedComprometimentoMonth(null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mês Vigente */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-[#192234] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94a3b8] font-bold">{getComprometimentoMonthTitle()}</span>
              <span className="text-sm font-black text-white font-mono">{formatBRL(faturasVigente)}</span>
            </div>
            <div className="w-full bg-[#192234] h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  parseFloat(comprometidoVigentePercent) > 60 ? 'bg-rose-500' : parseFloat(comprometidoVigentePercent) > 35 ? 'bg-amber-400' : 'bg-[#00ff87]'
                }`}
                style={{ width: `${Math.min(100, parseFloat(comprometidoVigentePercent))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#64748b]">
              <span>Comprometimento: <strong className="text-white">{comprometidoVigentePercent}%</strong></span>
              <span>Renda: {formatBRL(totalEntradas)}</span>
            </div>
          </div>

          {/* Próximo Mês */}
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-[#192234] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94a3b8] font-bold">Projeção para o Próximo Mês</span>
              <span className="text-sm font-black text-white font-mono">{formatBRL(faturasProximo)}</span>
            </div>
            <div className="w-full bg-[#192234] h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  parseFloat(comprometidoProximoPercent) > 60 ? 'bg-rose-500' : parseFloat(comprometidoProximoPercent) > 35 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, parseFloat(comprometidoProximoPercent))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#64748b]">
              <span>Comprometimento: <strong className="text-white">{comprometidoProximoPercent}%</strong></span>
              <span>Renda: {formatBRL(totalEntradas)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          3. MEUS CARTÕES (CARDS REAIS EM ACCORDION)
         ========================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#192234]">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#00ff87]" />
            <h4 className="text-sm font-bold text-white tracking-tight">Meus Cartões Cadastrados</h4>
          </div>
          <span className="text-xs text-[#64748b]">{activeCards.length} cartão(ões)</span>
        </div>

        {activeCards.length === 0 ? (
          <div className="glass-card p-10 rounded-3xl border border-[#192234] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#121927] border border-[#192234] flex items-center justify-center mx-auto text-[#64748b]">
              <CreditCard size={24} />
            </div>
            <h5 className="text-sm font-bold text-white">Nenhum cartão cadastrado</h5>
            <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
              Cadastre seus cartões de crédito na Central de Controle para acompanhar limites, faturas e vencimentos em tempo real.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeCards.map((card) => {
              const isExpanded = expandedCards[card.id];
              const limitTotal = parseFloat(card.limitTotal) || 0;
              const limitUsed = parseFloat(card.limitUsed) || 0;
              const availableLimit = Math.max(0, limitTotal - limitUsed);
              const usedPct = limitTotal > 0 ? (limitUsed / limitTotal) * 100 : 0;

              return (
                <div 
                  key={card.id}
                  className="glass-card rounded-2xl border border-[#192234] hover:border-[#00ff87]/30 transition-all overflow-hidden"
                >
                  {/* Header do Card Accordion */}
                  <div 
                    onClick={() => toggleExpand(card.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#0e1422]/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <CardVisual card={card} variant="thumbnail" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white">{card.name}</h5>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            card.owner === 'noiva' 
                              ? 'bg-pink-500/10 text-pink-300 border-pink-500/30' 
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {card.owner === 'noiva' ? 'Noiva' : 'Eu'}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748b] font-mono mt-0.5">
                          {card.digits ? `Final ${card.digits}` : 'Cartão Ativo'} • Vencimento: dia {card.dueDay || '10'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] text-[#64748b] uppercase font-bold block">Fatura Atual</span>
                        <span className="text-sm font-black text-white font-mono">
                          {formatBRL(card.currentBill !== undefined ? card.currentBill : limitUsed)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#64748b] uppercase font-bold block">Limite Disponível</span>
                        <span className="text-sm font-bold text-[#00ff87] font-mono">
                          {formatBRL(availableLimit)}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[#121927] text-[#94a3b8]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {isExpanded && (
                    <div className="p-5 bg-[#080c14]/70 border-t border-[#192234] space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#94a3b8]">Limite Utilizado: <strong>{formatBRL(limitUsed)}</strong> ({usedPct.toFixed(1)}%)</span>
                          <span className="text-[#94a3b8]">Limite Total: <strong>{formatBRL(limitTotal)}</strong></span>
                        </div>
                        <div className="w-full bg-[#192234] h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#00ff87] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, usedPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
