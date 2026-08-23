import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  CheckCircle2,
  Inbox,
  Scale
} from 'lucide-react';
import VisualDateRangePicker from './VisualDateRangePicker';
import CardVisual from './CardVisual';
import ReconciliationModal from './ReconciliationModal';

export default function Dashline({ 
  bankAccounts = [], 
  transactions = [], 
  cards = [], 
  recurringItems = [], 
  categories = [],
  onAddTransaction,
  onEditAccount
}) {
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  // Estados dos 3 cards do topo (padrão null = Mês Atual)
  const [saldoRange, setSaldoRange] = useState({ start: null, end: null });
  const [entradasRange, setEntradasRange] = useState({ start: null, end: null });
  const [saidasRange, setSaidasRange] = useState({ start: null, end: null });

  // Estados dos Rankings
  const [rankingGastosRange, setRankingGastosRange] = useState({ start: null, end: null });
  const [rankingRendasRange, setRankingRendasRange] = useState({ start: null, end: null });

  // Verificação de Filtro Ativo em Cada Card
  const isSaldoFiltered = Boolean(saldoRange.start && saldoRange.end);
  const isEntradasFiltered = Boolean(entradasRange.start && entradasRange.end);
  const isSaidasFiltered = Boolean(saidasRange.start && saidasRange.end);

  const isGastosRankingFiltered = Boolean(rankingGastosRange.start && rankingGastosRange.end);
  const isRendasRankingFiltered = Boolean(rankingRendasRange.start && rankingRendasRange.end);

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

  // Cálculos dinâmicos reais
  const calcTotalBalance = bankAccounts.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);
  const totalBalance = Math.round(calcTotalBalance * 100) / 100;
  
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

  // Rankings baseados em transações reais + categorias cadastradas
  const dynamicExpenseRanking = useMemo(() => {
    const sourceTxs = isGastosRankingFiltered 
      ? filterByRange(transactions.filter(t => (t.type === 'expense' || t.type === 'despesa') && parseFloat(t.value) > 0), rankingGastosRange)
      : transactions.filter(t => (t.type === 'expense' || t.type === 'despesa') && parseFloat(t.value) > 0);

    if (sourceTxs.length === 0) return [];
    
    const catMap = {};
    let total = 0;
    sourceTxs.forEach(t => {
      const cat = t.category || 'Outros';
      const val = parseFloat(t.value) || 0;
      catMap[cat] = (catMap[cat] || 0) + val;
      total += val;
    });
    
    const colors = ['#00ff87', '#10b981', '#059669', '#047857', '#064e3b', '#065f46', '#34d399'];
    return Object.entries(catMap)
      .map(([catName, amount], idx) => {
        const catObj = categories.find(c => c.name === catName || c.value === catName);
        const icon = catObj?.emoji || '🏷️';
        const percentage = total > 0 ? parseFloat(((amount / total) * 100).toFixed(1)) : 0;
        return {
          icon,
          category: catName,
          amount: Math.round(amount * 100) / 100,
          percentage,
          color: colors[idx % colors.length]
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, isGastosRankingFiltered, rankingGastosRange]);

  const dynamicIncomeRanking = useMemo(() => {
    const sourceTxs = isRendasRankingFiltered 
      ? filterByRange(transactions.filter(t => (t.type === 'income' || t.type === 'receita') && parseFloat(t.value) > 0), rankingRendasRange)
      : transactions.filter(t => (t.type === 'income' || t.type === 'receita') && parseFloat(t.value) > 0);

    if (sourceTxs.length === 0) return [];

    const catMap = {};
    let total = 0;
    sourceTxs.forEach(t => {
      const cat = t.category || 'Salário';
      const val = parseFloat(t.value) || 0;
      catMap[cat] = (catMap[cat] || 0) + val;
      total += val;
    });

    const colors = ['#00ff87', '#10b981', '#059669', '#047857', '#064e3b'];
    return Object.entries(catMap)
      .map(([catName, amount], idx) => {
        const catObj = categories.find(c => c.name === catName || c.value === catName);
        const icon = catObj?.emoji || '💼';
        const percentage = total > 0 ? parseFloat(((amount / total) * 100).toFixed(1)) : 0;
        return {
          icon,
          category: catName,
          amount: Math.round(amount * 100) / 100,
          percentage,
          color: colors[idx % colors.length]
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, isRendasRankingFiltered, rankingRendasRange]);

  const currentExpenseRankingTotal = dynamicExpenseRanking.reduce((acc, curr) => acc + curr.amount, 0);
  const currentIncomeRankingTotal = dynamicIncomeRanking.reduce((acc, curr) => acc + curr.amount, 0);

  // Evolução Mensal Dinâmica Real
  const monthlyProfitData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'short' });
      return [{ month: currentMonth, entradas: 0, saidas: 0, lucro: 0 }];
    }

    const monthMap = {};
    transactions.forEach(t => {
      if (!t.date) return;
      const parts = t.date.split('-');
      if (parts.length < 2) return;
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const d = new Date(y, m, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      
      if (!monthMap[label]) {
        monthMap[label] = { month: label, entradas: 0, saidas: 0, lucro: 0, timestamp: d.getTime() };
      }
      
      const val = parseFloat(t.value) || 0;
      if (t.type === 'income' || t.type === 'receita') {
        monthMap[label].entradas += val;
      } else {
        monthMap[label].saidas += val;
      }
      monthMap[label].lucro = monthMap[label].entradas - monthMap[label].saidas;
    });

    return Object.values(monthMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [transactions]);

  // Transações Recentes
  const recentTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return transactions.slice(0, 5).map((t, idx) => ({
      id: t.id || `tx-${idx}`,
      date: t.date ? t.date.split('-').reverse().join('/') : '',
      title: t.payee || t.description || t.product || 'Lançamento',
      category: t.category || 'Geral',
      amount: parseFloat(t.value) || 0,
      type: (t.type === 'income' || t.type === 'receita') ? 'income' : 'expense'
    }));
  }, [transactions]);

  // Análise Dinâmica de Cartões
  const cardAnalytics = useMemo(() => {
    const totalCurrentBills = cards.reduce((acc, c) => acc + (parseFloat(c.currentBill !== undefined ? c.currentBill : c.limitUsed || 0)), 0);
    const cardLimitTotal = cards.reduce((acc, c) => acc + (parseFloat(c.limitTotal) || 0), 0);
    const cardLimitUsed = cards.reduce((acc, c) => acc + (parseFloat(c.limitUsed) || 0), 0);
    const committedPct = totalEntradas > 0 ? (totalCurrentBills / totalEntradas) * 100 : 0;

    return {
      total: totalCurrentBills,
      limitTotal: cardLimitTotal,
      limitUsed: cardLimitUsed,
      committedPercentage: parseFloat(committedPct.toFixed(1))
    };
  }, [cards, totalEntradas]);

  const lucroMes = totalEntradas - totalSaidas;
  const retencaoPercent = totalEntradas > 0 ? ((lucroMes / totalEntradas) * 100).toFixed(1) : '0.0';
  const comprometidoPercent = totalEntradas > 0 ? ((totalSaidas / totalEntradas) * 100).toFixed(1) : '0.0';

  // Formatação BRL
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* HEADER DE INDICADORES & BOTÃO DE CONCILIAÇÃO BANCÁRIA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">Visão Geral & Indicadores</h3>
          <p className="text-xs text-[#94a3b8]">Métricas consolidadas do seu patrimônio e fluxo de caixa</p>
        </div>

        <button
          type="button"
          onClick={() => setIsReconcileOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00ff87]/15 border border-[#00ff87]/40 text-[#00ff87] font-bold text-xs hover:bg-[#00ff87]/25 hover:shadow-[0_0_20px_rgba(0,255,135,0.3)] transition-all cursor-pointer group"
        >
          <Scale size={16} className="group-hover:rotate-12 transition-transform" />
          <span>Conciliar Saldos Bancários</span>
          <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse ml-0.5" />
        </button>
      </div>

      {/* ==========================================
          LINHA 1 (TOPO ABSOLUTO): 3 CARDS PRINCIPAIS
         ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Saldo Geral */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] relative group hover:border-[#00ff87]/40 transition-all glow-neon-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20">
                <Wallet size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Saldo Geral</span>
            </div>

            <VisualDateRangePicker 
              startDate={saldoRange.start} 
              endDate={saldoRange.end} 
              onApplyRange={(start, end) => setSaldoRange({ start, end })}
              onReset={() => setSaldoRange({ start: null, end: null })}
            />
          </div>

          <div className="mt-2">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {formatBRL(totalBalance)}
            </h3>
            <p className="text-[11px] text-[#64748b] font-mono mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87]" />
              {bankAccounts.length > 0 ? `Soma de ${bankAccounts.length} conta(s) ativas` : 'Nenhuma conta cadastrada'}
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
          LINHA 2: RANKINGS LADO A LADO
         ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RANKING 1: GASTOS POR CATEGORIA */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#192234]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ArrowDownRight size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Ranking de Gastos por Categoria</h4>
                <p className="text-[11px] text-[#64748b]">Total acumulado no período</p>
              </div>
            </div>

            <VisualDateRangePicker 
              startDate={rankingGastosRange.start} 
              endDate={rankingGastosRange.end} 
              onApplyRange={(start, end) => setRankingGastosRange({ start, end })}
              onReset={() => setRankingGastosRange({ start: null, end: null })}
            />
          </div>

          {dynamicExpenseRanking.length === 0 ? (
            <div className="py-12 text-center text-[#64748b] space-y-2">
              <Inbox size={28} className="mx-auto text-[#334155]" />
              <p className="text-xs">Nenhuma despesa registrada para exibir o ranking.</p>
            </div>
          ) : (
            <div className="space-y-3.5 mt-4">
              {dynamicExpenseRanking.map((item, idx) => (
                <div key={idx} className="group flex items-center justify-between p-3 rounded-xl bg-[#0b0f19] border border-[#192234] hover:border-[#00ff87]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 rounded-lg bg-[#121927] border border-[#192234]">{item.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-white block">{item.category}</span>
                      <span className="text-[10px] text-[#64748b] font-mono">{item.percentage}% do total</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white font-mono">{formatBRL(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RANKING 2: RENDAS POR CATEGORIA */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#192234]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ArrowUpRight size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Ranking de Rendas por Categoria</h4>
                <p className="text-[11px] text-[#64748b]">Total faturado no período</p>
              </div>
            </div>

            <VisualDateRangePicker 
              startDate={rankingRendasRange.start} 
              endDate={rankingRendasRange.end} 
              onApplyRange={(start, end) => setRankingRendasRange({ start, end })}
              onReset={() => setRankingRendasRange({ start: null, end: null })}
            />
          </div>

          {dynamicIncomeRanking.length === 0 ? (
            <div className="py-12 text-center text-[#64748b] space-y-2">
              <Inbox size={28} className="mx-auto text-[#334155]" />
              <p className="text-xs">Nenhuma receita registrada para exibir o ranking.</p>
            </div>
          ) : (
            <div className="space-y-3.5 mt-4">
              {dynamicIncomeRanking.map((item, idx) => (
                <div key={idx} className="group flex items-center justify-between p-3 rounded-xl bg-[#0b0f19] border border-[#192234] hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 rounded-lg bg-[#121927] border border-[#192234]">{item.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-white block">{item.category}</span>
                      <span className="text-[10px] text-[#64748b] font-mono">{item.percentage}% do faturamento</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono">{formatBRL(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ==========================================
          LINHA 3: EVOLUÇÃO MENSAL E CARTÕES
         ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO DE EVOLUÇÃO MENSAL (2 COLUNAS) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-[#192234] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#192234]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20">
                <TrendingUp size={18} />
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">Evolução Mensal (Entradas vs Saídas)</h4>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[#94a3b8]">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[#94a3b8]">Saídas</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProfitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#192234', borderRadius: '12px' }}
                  formatter={(val) => [formatBRL(val), '']}
                />
                <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ANÁLISE DE CARTÕES E COMPROMETIMENTO (1 COLUNA) */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#192234]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <CreditCard size={18} />
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">Comprometimento em Cartões</h4>
            </div>
            <span className="text-xs font-mono font-bold text-[#00ff87]">
              {cardAnalytics.committedPercentage}% da renda
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#0b0f19] border border-[#192234] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#94a3b8]">Faturas Vigentes</span>
                <span className="font-bold text-white font-mono">{formatBRL(cardAnalytics.total)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#94a3b8]">Limite Total Cadastrado</span>
                <span className="font-bold text-[#94a3b8] font-mono">{formatBRL(cardAnalytics.limitTotal)}</span>
              </div>
              <div className="w-full bg-[#192234] h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-[#00ff87] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${cardAnalytics.limitTotal > 0 ? Math.min(100, (cardAnalytics.limitUsed / cardAnalytics.limitTotal) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Mini Galeria dos Cartões */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {cards.map(c => (
                <div key={c.id} className="shrink-0">
                  <CardVisual card={c} variant="badge" />
                </div>
              ))}
              {cards.length === 0 && (
                <p className="text-[11px] text-[#64748b] text-center w-full py-2">
                  Nenhum cartão cadastrado na Central de Controle.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#192234] flex items-center justify-between text-[11px] text-[#64748b]">
            <span>Retenção Líquida: <strong className="text-white">{retencaoPercent}%</strong></span>
            <span>Comprometido: <strong className="text-white">{comprometidoPercent}%</strong></span>
          </div>
        </div>

      </div>

      {/* ==========================================
          LINHA 4: TRANSAÇÕES RECENTES
         ========================================== */}
      <div className="glass-card p-6 rounded-2xl border border-[#192234] space-y-4">
        <h4 className="text-sm font-bold text-white tracking-tight pb-3 border-b border-[#192234]">
          Últimos Lançamentos
        </h4>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-[#64748b] space-y-1">
            <Inbox size={24} className="mx-auto text-[#334155]" />
            <p className="text-xs">Nenhum lançamento registrado no sistema.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0b0f19] border border-[#192234] hover:border-[#00ff87]/30 transition-all text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <div>
                    <span className="font-bold text-white block">{t.title}</span>
                    <span className="text-[10px] text-[#64748b]">{t.category} • {t.date}</span>
                  </div>
                </div>
                <span className={`font-bold font-mono ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONCILIAÇÃO BANCÁRIA */}
      <ReconciliationModal
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
        bankAccounts={bankAccounts}
        onAddTransaction={onAddTransaction}
        onEditAccount={onEditAccount}
      />

    </div>
  );
}
