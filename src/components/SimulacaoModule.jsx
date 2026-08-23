import React, { useState, useMemo } from 'react';
import {
  Calculator,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Calendar,
  BarChart3,
  Zap,
  ShieldAlert,
  Wallet,
  RefreshCw,
  Sparkles,
  Lightbulb,
  Clock,
  Check,
  Percent,
  ChevronDown
} from 'lucide-react';

// ─── Cartões Mock (sincronizado com CardsModule) ─────────────────────────────
const MOCK_CARDS = [
  { id: 'card-1', name: 'Nubank Ultravioleta', digits: '•••• 4892', limitTotal: 15000, limitUsed: 3790.50 },
  { id: 'card-2', name: 'Mercado Pago Black',  digits: '•••• 8120', limitTotal: 10000, limitUsed: 2670.00 },
  { id: 'card-3', name: 'Itaú Personnalité',   digits: '•••• 3044', limitTotal: 20000, limitUsed: 1500.00 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const pct = (val, total) => (total > 0 ? Math.min(100, (val / total) * 100) : 0);

function getMonthLabel(offsetMonths) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
}

function getTerminationDate(monthsLeft, dueDay = 15) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsLeft);
  d.setDate(dueDay);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const monthName = d.toLocaleDateString('pt-BR', { month: 'long' });
  return {
    formattedDate: `${day}/${month}/${year}`,
    monthYear: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year}`,
    monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    year,
    rawDate: d
  };
}

// ─── Alerta de Comprometimento ────────────────────────────────────────────────
function CommitmentAlert({ commitPct }) {
  if (commitPct < 60) return null;

  if (commitPct >= 80) {
    return (
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-fade-in">
        <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
          <XCircle size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-red-300">🚨 Alerta Vermelho — Não faça essa compra agora!</p>
          <p className="text-xs text-red-400/90 mt-1">
            Essa compra comprometeria <strong>{commitPct.toFixed(1)}%</strong> da sua renda mensal. 
            Seu orçamento ficaria extremamente apertado, sem margem para emergências.
            Considere esperar, economizar mais ou reduzir o número de parcelas.
          </p>
        </div>
      </div>
    );
  }

  if (commitPct >= 70) {
    return (
      <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/40 flex items-start gap-3 shadow-[0_0_20px_rgba(249,115,22,0.15)] animate-fade-in">
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-orange-300">⚠️ Alerta Laranja — Atenção redobrada!</p>
          <p className="text-xs text-orange-400/90 mt-1">
            Esse investimento pode te prejudicar pois compromete <strong>{commitPct.toFixed(1)}%</strong> da sua renda mensal. 
            Pense em possíveis imprevistos como: problemas de saúde, gastos com moto/carro, reparos domésticos, etc.
          </p>
        </div>
      </div>
    );
  }

  // 60-70
  return (
    <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/40 flex items-start gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-fade-in">
      <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
        <AlertCircle size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-yellow-300">⚡ Alerta Amarelo — Compra com Atenção</p>
        <p className="text-xs text-yellow-400/90 mt-1">
          Esse investimento pode te prejudicar pois compromete <strong>{commitPct.toFixed(1)}%</strong> da sua renda mensal. 
          Pense em possíveis problemas como: problemas de saúde, gastos com moto/carro, consertos imprevistos, etc.
        </p>
      </div>
    </div>
  );
}

// ─── Linha do Tempo Visual ────────────────────────────────────────────────────
function CommitmentTimeline({ parcelas, monthlyInstallment, fixedExpenses, totalIncome, existingInstallments }) {
  const months = Array.from({ length: parcelas }, (_, i) => i);

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
        <Calendar size={13} className="text-[#00ff87]" />
        Linha do Tempo de Comprometimento — {parcelas} meses
      </h5>

      {/* Track */}
      <div className="relative">
        {/* Labels mês acima */}
        <div className="flex justify-between mb-2 overflow-hidden">
          {months.map((m) => (
            <div key={m} className="flex flex-col items-center" style={{ width: `${100 / parcelas}%` }}>
              <span className="text-[9px] text-[#64748b] font-mono">{getMonthLabel(m)}</span>
            </div>
          ))}
        </div>

        {/* Linha base */}
        <div className="relative h-2.5 bg-[#192234] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #00ff87 0%, #f59e0b 60%, #ef4444 100%)',
              opacity: 0.25
            }}
          />
          {/* Barra de progresso real (comprometimento) */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, pct(fixedExpenses + monthlyInstallment, totalIncome))}%`,
              background: (() => {
                const p = pct(fixedExpenses + monthlyInstallment, totalIncome);
                if (p >= 80) return '#ef4444';
                if (p >= 70) return '#f97316';
                if (p >= 60) return '#f59e0b';
                return '#00ff87';
              })()
            }}
          />
        </div>

        {/* Pontos de evento */}
        <div className="flex mt-3 overflow-hidden">
          {months.map((m) => {
            const releasedThisMonth = existingInstallments
              .filter(ei => ei.monthsLeft === m + 1)
              .reduce((acc, ei) => acc + ei.monthlyAmount, 0);

            const isRelease = releasedThisMonth > 0;
            const isLast = m === parcelas - 1;

            return (
              <div key={m} className="flex flex-col items-center" style={{ width: `${100 / parcelas}%` }}>
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 mx-auto transition-all ${
                    isLast
                      ? 'bg-[#00ff87] border-[#00ff87] shadow-[0_0_10px_rgba(0,255,135,0.7)] scale-110'
                      : isRelease
                        ? 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)] scale-110'
                        : 'bg-[#192234] border-[#2a3550]'
                  }`}
                />
                {isRelease && (
                  <span className="text-[8px] text-amber-300 font-bold mt-1 text-center leading-tight bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/30">
                    +{fmt(releasedThisMonth).replace('R$\u00a0', '')}
                  </span>
                )}
                {isLast && !isRelease && (
                  <span className="text-[8px] text-[#00ff87] font-bold mt-1 text-center bg-[#00ff87]/10 px-1 py-0.5 rounded border border-[#00ff87]/30">
                    Fim
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 mt-2 pt-2 border-t border-[#192234]/60">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
          <span className="text-[11px] text-[#94a3b8]">Fatura anterior termina (Alívio)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#00ff87] shadow-[0_0_8px_rgba(0,255,135,0.7)]" />
          <span className="text-[11px] text-[#94a3b8]">Término da nova compra</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#192234] border-2 border-[#2a3550]" />
          <span className="text-[11px] text-[#94a3b8]">Mês em pagamento</span>
        </div>
      </div>
    </div>
  );
}

// ─── Barra de Comprometimento ─────────────────────────────────────────────────
function CommitmentBar({ label, value, total, color = '#00ff87' }) {
  const p = pct(value, total);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#94a3b8]">{label}</span>
        <span className="font-bold font-mono text-white">{fmt(value)} <span className="text-[10px] text-[#64748b]">({p.toFixed(1)}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-[#192234] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${p}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function SimulacaoModule({ transactions = [], bankAccounts = [] }) {
  // ── Form State ──────────────────────────────────────────────────────────────
  const [valorBem, setValorBem] = useState('');
  const [parcelas, setParcelas] = useState(12);
  const [formaPgto, setFormaPgto] = useState('cartao');
  const [selectedCard, setSelectedCard] = useState(MOCK_CARDS[0].id);
  const [simulado, setSimulado] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  // ── Dados do App ────────────────────────────────────────────────────────────
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' || t.type === 'receita')
      .reduce((acc, t) => acc + parseFloat(t.value || 0), 0) || 9500; // Fallback garantido
  }, [transactions]);

  const fixedExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' || t.type === 'despesa')
      .reduce((acc, t) => acc + parseFloat(t.value || 0), 0) || 1396.70;
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return bankAccounts.reduce((acc, a) => acc + (a.balance || 0), 0) || 18270.50;
  }, [bankAccounts]);

  const currentCommitPct = totalIncome > 0 ? (fixedExpenses / totalIncome) * 100 : 0;

  // Simulação de parcelas existentes com prazo, dia de vencimento e valor detalhado
  const existingInstallments = useMemo(() => [
    { 
      id: 'inst-1', 
      name: 'Nubank — Sofá em 12x', 
      monthlyAmount: 153.37, 
      monthsLeft: 5, 
      dueDay: 15,
      bank: 'Nubank',
      category: 'Habitação' 
    },
    { 
      id: 'inst-2', 
      name: 'Mercado Pago — iPhone 15x', 
      monthlyAmount: 333.33, 
      monthsLeft: 9, 
      dueDay: 20,
      bank: 'Mercado Pago',
      category: 'Tecnologia'
    },
    { 
      id: 'inst-3', 
      name: 'Itaú — TV 6x', 
      monthlyAmount: 124.83, 
      monthsLeft: 3, 
      dueDay: 10,
      bank: 'Itaú Personnalité',
      category: 'Eletrônicos'
    },
  ], []);

  const totalCurrentInstallments = existingInstallments.reduce((a, e) => a + e.monthlyAmount, 0);

  // ── Resultados ──────────────────────────────────────────────────────────────
  const numericValor = parseFloat(valorBem) || 0;
  const monthlyInstallment = parcelas > 0 ? numericValor / parcelas : 0;

  const card = MOCK_CARDS.find(c => c.id === selectedCard) || MOCK_CARDS[0];
  const limitAvailable = card.limitTotal - card.limitUsed;
  const limitAfterPurchase = limitAvailable - numericValor;
  const limitCommitPct = pct(card.limitUsed + numericValor, card.limitTotal);

  const newCommitPct = totalIncome > 0
    ? ((fixedExpenses + monthlyInstallment) / totalIncome) * 100
    : 0;

  // Alívio de faturas durante o período
  const reliefInPeriod = existingInstallments
    .filter(ei => ei.monthsLeft <= parcelas)
    .reduce((acc, ei) => acc + ei.monthlyAmount * (parcelas - ei.monthsLeft), 0);

  // ─── Inteligência de Sugestão de Compra ──────────────────────────────────────
  const smartSuggestions = useMemo(() => {
    if (numericValor <= 0) return null;

    // Ordenar parcelas existentes pelo prazo de término
    const sortedByFinish = [...existingInstallments].sort((a, b) => a.monthsLeft - b.monthsLeft);

    // Marcos de liberação financeira
    let accumulatedFreed = 0;
    const milestones = sortedByFinish.map((inst, index) => {
      accumulatedFreed += inst.monthlyAmount;
      const term = getTerminationDate(inst.monthsLeft, inst.dueDay);
      const remainingExpensesAfter = Math.max(0, fixedExpenses - accumulatedFreed);
      const futureCommitWithNewPurchase = totalIncome > 0
        ? ((remainingExpensesAfter + monthlyInstallment) / totalIncome) * 100
        : 0;

      return {
        monthsToWait: inst.monthsLeft,
        targetDate: term.formattedDate,
        targetMonthYear: term.monthYear,
        freedMonthlyAmount: accumulatedFreed,
        freedCount: index + 1,
        futureCommitPct: futureCommitWithNewPurchase,
        installmentsRelieved: sortedByFinish.slice(0, index + 1)
      };
    });

    // 1. Melhor Marco de Data
    const bestDateMilestone = milestones.find(m => m.futureCommitPct < 60) || milestones[milestones.length - 1] || milestones[0];

    // 2. Parcelamento Alternativo
    const optionsToTest = [6, 10, 12, 15, 18, 24].filter(p => p !== parcelas);
    const safeOption = optionsToTest.find(p => {
      const instVal = numericValor / p;
      const cPct = ((fixedExpenses + instVal) / totalIncome) * 100;
      return cPct < 60;
    }) || (parcelas < 18 ? 18 : 24);

    const recommendedParcelas = safeOption;
    const recommendedInstallmentValue = numericValor / recommendedParcelas;
    const recommendedCommitPct = ((fixedExpenses + recommendedInstallmentValue) / totalIncome) * 100;
    const faturasLivreInRecommended = existingInstallments.filter(ei => ei.monthsLeft <= recommendedParcelas).length;

    // 3. Comparativos visuais "Comprar Agora" vs "Comprar na Melhor Data"
    // --- Cenário A: Comprar AGORA ---
    const nowCommitPct = newCommitPct;
    const nowPureFixed = fixedExpenses; // Saídas fixas puras do usuário (sem simulação)
    const nowMonthlyTotal = fixedExpenses + monthlyInstallment;
    const nowSimulatedTotalPeriod = (fixedExpenses * parcelas) + numericValor; // Saídas acumuladas no período com a nova compra
    // Alívio que ocorre DURANTE o período se comprar agora
    const nowReliefInstallments = existingInstallments.filter(ei => ei.monthsLeft <= parcelas);
    const nowReliefMonthly = nowReliefInstallments.reduce((acc, ei) => acc + ei.monthlyAmount, 0);
    const nowBestCommitAfterRelief = totalIncome > 0
      ? ((fixedExpenses - nowReliefMonthly + monthlyInstallment) / totalIncome) * 100
      : 0;

    // --- Cenário B: Comprar na DATA SUGERIDA ---
    const laterPureFixed = Math.max(0, fixedExpenses - bestDateMilestone.freedMonthlyAmount); // Saídas fixas puras na data futura
    const laterCommitPct = bestDateMilestone.futureCommitPct;
    const laterMonthlyTotal = laterPureFixed + monthlyInstallment;
    const laterSimulatedTotalPeriod = (laterPureFixed * parcelas) + numericValor; // Saídas acumuladas no período com a nova compra
    // Alívios adicionais que ocorrem se esperar + comprar
    const laterAdditionalRelief = existingInstallments
      .filter(ei => ei.monthsLeft > bestDateMilestone.monthsToWait && ei.monthsLeft <= bestDateMilestone.monthsToWait + parcelas);
    const laterAdditionalReliefMonthly = laterAdditionalRelief.reduce((acc, ei) => acc + ei.monthlyAmount, 0);
    const laterBestCommitAfterRelief = totalIncome > 0
      ? ((laterPureFixed - laterAdditionalReliefMonthly + monthlyInstallment) / totalIncome) * 100
      : 0;

    return {
      bestDateMilestone,
      recommendedParcelas,
      recommendedInstallmentValue,
      recommendedCommitPct,
      faturasLivreInRecommended,
      // Comparativo visual
      comparison: {
        now: {
          commitPct: nowCommitPct,
          pureFixed: nowPureFixed,
          monthlyTotal: nowMonthlyTotal,
          simulatedTotalPeriod: nowSimulatedTotalPeriod,
          reliefMonthly: nowReliefMonthly,
          reliefCount: nowReliefInstallments.length,
          bestCommitAfterRelief: Math.max(0, nowBestCommitAfterRelief),
        },
        later: {
          commitPct: laterCommitPct,
          pureFixed: laterPureFixed,
          monthlyTotal: laterMonthlyTotal,
          simulatedTotalPeriod: laterSimulatedTotalPeriod,
          additionalReliefMonthly: laterAdditionalReliefMonthly,
          additionalReliefCount: laterAdditionalRelief.length,
          bestCommitAfterRelief: Math.max(0, laterBestCommitAfterRelief),
          monthsToWait: bestDateMilestone.monthsToWait,
        }
      }
    };
  }, [numericValor, parcelas, monthlyInstallment, fixedExpenses, totalIncome, newCommitPct, existingInstallments]);

  const canSimulate = numericValor > 0 && parcelas > 0;

  const handleSimulate = () => {
    if (canSimulate) setSimulado(true);
  };

  const handleReset = () => {
    setSimulado(false);
    setValorBem('');
    setParcelas(12);
    setFormaPgto('cartao');
    setSelectedCard(MOCK_CARDS[0].id);
  };

  const applySuggestedParcelas = (newP) => {
    setParcelas(newP);
    setSimulado(true);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Calculator size={22} />
            </div>
            <span>Simulador de Compras & Planejamento</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#94a3b8] sm:ml-[52px]">
            Cruze o impacto da nova aquisição com o término de faturas atuais e descubra a melhor estratégia
          </p>
        </div>
        {simulado && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121927] border border-[#192234] text-xs font-bold text-[#94a3b8] hover:text-white hover:bg-[#182236] transition-all cursor-pointer shadow-md self-start sm:self-auto"
          >
            <RefreshCw size={14} />
            Nova Simulação
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">

        {/* ── Formulário Lateral (2/5) ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Situação Atual do Usuário */}
          <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-[#00ff87]" />
              <span>Situação Financeira Atual</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Saldo Geral</p>
                <p className="text-lg font-black font-mono text-[#00ff87]">{fmt(totalBalance)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Renda Fixa / Mês</p>
                <p className="text-lg font-black font-mono text-emerald-400">{fmt(totalIncome)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Saídas Fixas</p>
                <p className="text-lg font-black font-mono text-rose-400">{fmt(fixedExpenses)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Comprometimento</p>
                <p className={`text-lg font-black font-mono ${currentCommitPct >= 80 ? 'text-red-400' : currentCommitPct >= 70 ? 'text-orange-400' : currentCommitPct >= 60 ? 'text-yellow-400' : 'text-[#00ff87]'}`}>
                  {currentCommitPct.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Parcelas em andamento com badges de destaque */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Parcelas Ativas em Cartões</p>
                <span className="text-[10px] text-amber-400 font-mono font-bold">{existingInstallments.length} ativas</span>
              </div>

              <div className="space-y-2">
                {existingInstallments.map((ei) => {
                  const term = getTerminationDate(ei.monthsLeft, ei.dueDay);
                  return (
                    <div key={ei.id} className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[170px]">{ei.name}</span>
                        <span className="font-bold font-mono text-xs text-amber-400">{fmt(ei.monthlyAmount)}/mês</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#94a3b8] pt-1 border-t border-[#192234]/60">
                        <span className="flex items-center gap-1 font-mono text-amber-300/90 font-semibold">
                          <Clock size={10} />
                          Faltam {ei.monthsLeft} meses
                        </span>
                        <span className="font-mono text-[#64748b]">Término: {term.formattedDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-[10px] text-[#94a3b8]">Total mensal em parcelas:</span>
                <span className="text-xs font-black font-mono text-amber-300">{fmt(totalCurrentInstallments)}/mês</span>
              </div>
            </div>
          </div>

          {/* Formulário de Simulação */}
          <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-purple-400" />
              <span>Parâmetros da Nova Compra</span>
            </h4>

            {/* Valor do Bem */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Valor Total do Bem / Compra (R$)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold font-mono text-purple-400 pointer-events-none">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={valorBem}
                  onChange={e => { setValorBem(e.target.value); setSimulado(false); }}
                  placeholder="Ex: 3500.00"
                  className="w-full h-11 bg-[#121927] border border-[#192234] rounded-xl pl-9 pr-3 text-sm font-bold font-mono text-white placeholder-[#475569] focus:outline-none focus:border-purple-500/60 transition-all"
                />
              </div>
            </div>

            {/* Número de Parcelas */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  Nº de Parcelas Desejadas
                </label>
                <span className="text-sm font-black font-mono text-purple-400 px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30">
                  {parcelas}x
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                step={1}
                value={parcelas}
                onChange={e => { setParcelas(Number(e.target.value)); setSimulado(false); }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((parcelas - 1) / 23) * 100}%, #192234 ${((parcelas - 1) / 23) * 100}%, #192234 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-[#475569] font-mono">
                <span>1x</span>
                <span>6x</span>
                <span>12x</span>
                <span>18x</span>
                <span>24x</span>
              </div>
            </div>

            {/* Valor da Parcela Calculado */}
            {numericValor > 0 && (
              <div className="px-4 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-purple-300 font-semibold block">Parcela Estimada:</span>
                  <span className="text-[10px] text-[#94a3b8]">{parcelas}x mensais</span>
                </div>
                <span className="text-xl font-black font-mono text-purple-300">{fmt(monthlyInstallment)}</span>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setFormaPgto('cartao'); setSimulado(false); }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    formaPgto === 'cartao'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-[#121927] border-[#192234] text-[#94a3b8] hover:border-[#2a3550]'
                  }`}
                >
                  <CreditCard size={15} />
                  Cartão de Crédito
                </button>
                <button
                  type="button"
                  onClick={() => { setFormaPgto('boleto'); setSimulado(false); }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    formaPgto === 'boleto'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-[#121927] border-[#192234] text-[#94a3b8] hover:border-[#2a3550]'
                  }`}
                >
                  <Banknote size={15} />
                  Boleto / À Vista
                </button>
              </div>
            </div>

            {/* Seleção de Cartão */}
            {formaPgto === 'cartao' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">
                  Cartão Utilizado (Afeta Limite)
                </label>
                <div className="space-y-2">
                  {MOCK_CARDS.map(c => {
                    const available = c.limitTotal - c.limitUsed;
                    const isSelected = selectedCard === c.id;
                    const canAfford = available >= numericValor;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedCard(c.id); setSimulado(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/15 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                            : 'bg-[#121927] border-[#192234] hover:border-[#2a3550]'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-left">
                          <CreditCard size={14} className={isSelected ? 'text-purple-400' : 'text-[#64748b]'} />
                          <div>
                            <p className={`font-bold ${isSelected ? 'text-purple-300' : 'text-[#94a3b8]'}`}>{c.name}</p>
                            <p className="text-[9px] text-[#64748b]">{c.digits}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold font-mono text-xs ${canAfford ? 'text-[#00ff87]' : 'text-red-400'}`}>
                            {fmt(available)}
                          </p>
                          <p className="text-[9px] text-[#64748b]">disponível</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botão Simular */}
            <button
              type="button"
              onClick={handleSimulate}
              disabled={!canSimulate}
              className={`w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                canSimulate
                  ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] active:scale-[0.98]'
                  : 'bg-[#192234] text-[#475569] cursor-not-allowed'
              }`}
            >
              <Calculator size={18} />
              <span>{simulado ? 'Recalcular Simulação' : 'Simular Impacto Completo'}</span>
            </button>
          </div>
        </div>

        {/* ── Painel de Resultados & Insights (3/5) ── */}
        <div className="xl:col-span-3 space-y-5">

          {!simulado ? (
            /* ── Estado Vazio Inicial ── */
            <div className="h-full min-h-[440px] flex flex-col items-center justify-center p-10 rounded-3xl bg-[#0b0f19] border border-dashed border-[#192234] text-center space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400/60 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <Calculator size={32} />
              </div>
              <div className="max-w-md">
                <h4 className="text-base font-bold text-white">Aguardando dados para simular</h4>
                <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed">
                  Informe o valor da compra e o parcelamento para cruzar os dados com seus ganhos fixos, faturas atuais e gerar a análise preditiva inteligente.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
                {[
                  'Sugestão Inteligente de Compra',
                  'Destaque no Alívio de Faturas',
                  'Linha do Tempo Visual',
                  'Alertas de Comprometimento'
                ].map(f => (
                  <div key={f} className="px-3 py-2.5 rounded-xl bg-[#0d1320] border border-[#192234] text-[10px] text-[#94a3b8] font-semibold flex items-center gap-1.5 text-left">
                    <Sparkles size={12} className="text-purple-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Resultados Detalhados da Simulação ── */
            <div className="space-y-6">

              {/* 1. Alerta de Comprometimento de Renda */}
              <CommitmentAlert commitPct={newCommitPct} />

              {/* 2. SUGESTÃO INTELIGENTE — COMPACTA & COLAPSÁVEL */}
              {smartSuggestions && (
                <div className={`rounded-3xl bg-gradient-to-br from-purple-950/40 via-[#0b0f19] to-[#080c14] border transition-all duration-500 relative overflow-hidden ${
                  suggestionOpen
                    ? 'border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.22)]'
                    : 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.10)] hover:border-purple-500/50'
                }`}>

                  {/* Background Glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

                  {/* ── Header Clicável (sempre visível) ── */}
                  <button
                    type="button"
                    onClick={() => setSuggestionOpen(!suggestionOpen)}
                    className="w-full flex items-center justify-between px-5 py-4 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                        suggestionOpen
                          ? 'bg-purple-500/25 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                          : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                      }`}>
                        <Lightbulb size={18} className={suggestionOpen ? 'animate-pulse' : ''} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                          <span>Sugestão Inteligente de Compra</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30 uppercase font-bold">
                            IA Analítica
                          </span>
                        </h4>
                        {!suggestionOpen && (
                          <p className="text-[11px] text-[#94a3b8] mt-0.5 flex items-center gap-1.5">
                            <span>Data ideal:</span>
                            <span className="font-mono font-bold text-[#00ff87]">{smartSuggestions.bestDateMilestone.targetDate}</span>
                            <span className="text-[#475569]">•</span>
                            <span>Comprometimento cai para</span>
                            <span className="font-mono font-bold text-[#00ff87]">{smartSuggestions.bestDateMilestone.futureCommitPct.toFixed(1)}%</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                      suggestionOpen
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 rotate-180'
                        : 'bg-[#121927] border-[#192234] text-[#64748b] group-hover:border-purple-500/40 group-hover:text-purple-400'
                    }`}>
                      <ChevronDown size={16} />
                    </div>
                  </button>

                  {/* ── Conteúdo Expandível ── */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    suggestionOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-5 pb-5 space-y-5">

                      {/* Separador superior */}
                      <div className="h-px bg-purple-500/20" />

                      {/* ═══ CARD 1: Melhor Momento para Comprar ═══ */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-purple-400" />
                          <h5 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Melhor Momento para Comprar</h5>
                        </div>

                        {/* Data em DESTAQUE CENTRAL */}
                        <div className="flex items-center justify-center">
                          <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500/20 via-[#00ff87]/10 to-purple-500/20 border border-[#00ff87]/40 text-center shadow-[0_0_25px_rgba(0,255,135,0.15)]">
                            <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-bold mb-0.5">Data Recomendada</p>
                            <p className="text-2xl font-black font-mono text-[#00ff87] tracking-wide">
                              {smartSuggestions.bestDateMilestone.targetDate}
                            </p>
                            <p className="text-[11px] text-[#94a3b8] mt-0.5">
                              {smartSuggestions.bestDateMilestone.targetMonthYear} — livre de <strong className="text-amber-300">{smartSuggestions.bestDateMilestone.freedCount} parcela(s)</strong>
                            </p>
                          </div>
                        </div>

                        {/* ── COMPARATIVO VISUAL: Agora vs. Data Sugerida ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                          {/* Cenário A: Se Comprar AGORA */}
                          <div className="p-4 rounded-2xl bg-[#0d1320] border border-red-500/20 hover:border-red-500/40 transition-all space-y-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                                <XCircle size={14} className="text-red-400" />
                                Se comprar agora
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 font-bold border border-red-500/30">Hoje</span>
                            </div>

                            {/* Barra de Comprometimento Agora */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-[#94a3b8]">Comprometimento de Renda</span>
                                <span className={`font-black font-mono ${
                                  smartSuggestions.comparison.now.commitPct >= 80 ? 'text-red-400' :
                                  smartSuggestions.comparison.now.commitPct >= 70 ? 'text-orange-400' :
                                  smartSuggestions.comparison.now.commitPct >= 60 ? 'text-yellow-400' : 'text-[#00ff87]'
                                }`}>{smartSuggestions.comparison.now.commitPct.toFixed(1)}%</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-[#192234] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.min(100, smartSuggestions.comparison.now.commitPct)}%`,
                                    background: smartSuggestions.comparison.now.commitPct >= 80 ? '#ef4444' :
                                      smartSuggestions.comparison.now.commitPct >= 70 ? '#f97316' :
                                      smartSuggestions.comparison.now.commitPct >= 60 ? '#f59e0b' : '#00ff87'
                                  }}
                                />
                              </div>
                            </div>

                            {/* Bloco de Alívio no Período Estruturado */}
                            <div className="p-3 rounded-xl bg-[#121927] border border-[#192234] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-[#94a3b8] font-medium flex items-center gap-1.5">
                                  <CheckCircle2 size={12} className="text-emerald-400" />
                                  Alívio de Faturas no Período
                                </span>
                                {smartSuggestions.comparison.now.reliefCount > 0 ? (
                                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold font-mono border border-emerald-500/30">
                                    {smartSuggestions.comparison.now.reliefCount} fatura(s) encerram
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-[#64748b]">Nenhuma</span>
                                )}
                              </div>
                              {smartSuggestions.comparison.now.reliefCount > 0 && (
                                <div className="flex items-center justify-between pt-1 border-t border-[#192234]/80 text-[10px]">
                                  <span className="text-[#64748b]">Comprometimento final pós-alívio:</span>
                                  <span className="font-bold font-mono text-emerald-400">
                                    {smartSuggestions.comparison.now.bestCommitAfterRelief.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Mini-grid de métricas */}
                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                              <div className="p-2.5 rounded-xl bg-[#121927] border border-[#192234] text-center">
                                <p className="text-[9px] text-[#64748b] uppercase font-bold tracking-wider">Saída Fixa / Mês</p>
                                <p className="text-xs font-black font-mono text-slate-200 mt-1">{fmt(smartSuggestions.comparison.now.pureFixed)}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-[#121927] border border-[#192234] text-center">
                                <p className="text-[9px] text-[#64748b] uppercase font-bold tracking-wider">Saídas Simuladas</p>
                                <p className="text-xs font-black font-mono text-rose-400 mt-1">{fmt(smartSuggestions.comparison.now.simulatedTotalPeriod)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Cenário B: Se Comprar na DATA SUGERIDA */}
                          <div className="p-4 rounded-2xl bg-[#0d1320] border border-[#00ff87]/25 hover:border-[#00ff87]/50 transition-all space-y-3.5 relative">
                            {/* Badge recomendado */}
                            <div className="absolute -top-2.5 right-3">
                              <span className="text-[9px] px-2.5 py-1 rounded-full bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40 font-black uppercase shadow-[0_0_10px_rgba(0,255,135,0.2)]">
                                ✦ Recomendado
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#00ff87] uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 size={14} />
                                Se comprar em {smartSuggestions.bestDateMilestone.targetMonthYear}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#00ff87]/10 text-[#00ff87] font-bold border border-[#00ff87]/30">
                                +{smartSuggestions.comparison.later.monthsToWait}m
                              </span>
                            </div>

                            {/* Barra de Comprometimento Depois */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-[#94a3b8]">Comprometimento de Renda</span>
                                <span className={`font-black font-mono ${
                                  smartSuggestions.comparison.later.commitPct >= 60 ? 'text-yellow-400' : 'text-[#00ff87]'
                                }`}>{smartSuggestions.comparison.later.commitPct.toFixed(1)}%</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-[#192234] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.min(100, smartSuggestions.comparison.later.commitPct)}%`,
                                    background: smartSuggestions.comparison.later.commitPct >= 60 ? '#f59e0b' : '#00ff87'
                                  }}
                                />
                              </div>
                            </div>

                            {/* Bloco de Alívio no Período Estruturado */}
                            <div className="p-3 rounded-xl bg-[#121927] border border-emerald-500/20 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-[#94a3b8] font-medium flex items-center gap-1.5">
                                  <CheckCircle2 size={12} className="text-emerald-400" />
                                  Alívio de Faturas
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold font-mono border border-emerald-500/30">
                                  {smartSuggestions.bestDateMilestone.freedCount} já quitadas
                                  {smartSuggestions.comparison.later.additionalReliefCount > 0 && ` (+${smartSuggestions.comparison.later.additionalReliefCount} futuras)`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-[#192234]/80 text-[10px]">
                                <span className="text-[#64748b]">Comprometimento final pós-alívio:</span>
                                <span className="font-bold font-mono text-emerald-400">
                                  {smartSuggestions.comparison.later.bestCommitAfterRelief.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Mini-grid de métricas */}
                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                              <div className="p-2.5 rounded-xl bg-[#121927] border border-[#192234] text-center">
                                <p className="text-[9px] text-[#64748b] uppercase font-bold tracking-wider">Saída Fixa / Mês</p>
                                <p className="text-xs font-black font-mono text-emerald-400 mt-1">{fmt(smartSuggestions.comparison.later.pureFixed)}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-[#121927] border border-[#192234] text-center">
                                <p className="text-[9px] text-[#64748b] uppercase font-bold tracking-wider">Saídas Simuladas</p>
                                <p className="text-xs font-black font-mono text-[#00ff87] mt-1">{fmt(smartSuggestions.comparison.later.simulatedTotalPeriod)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Barra de Economia Comparativa */}
                        {(() => {
                          const savings = smartSuggestions.comparison.now.monthlyTotal - smartSuggestions.comparison.later.monthlyTotal;
                          const pctDrop = smartSuggestions.comparison.now.commitPct - smartSuggestions.comparison.later.commitPct;
                          if (savings <= 0 && pctDrop <= 0) return null;
                          return (
                            <div className="p-3 rounded-xl bg-[#00ff87]/5 border border-[#00ff87]/20 flex items-center justify-between">
                              <span className="text-[11px] text-[#94a3b8] flex items-center gap-1.5">
                                <TrendingDown size={13} className="text-[#00ff87]" />
                                <span>Economia mensal ao esperar:</span>
                              </span>
                              <div className="flex items-center gap-3">
                                {savings > 0 && (
                                  <span className="text-xs font-black font-mono text-[#00ff87]">
                                    -{fmt(savings)}/mês
                                  </span>
                                )}
                                {pctDrop > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#00ff87]/10 text-[#00ff87] font-bold font-mono border border-[#00ff87]/30">
                                    ↓{pctDrop.toFixed(1)}pp
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Separador */}
                      <div className="h-px bg-[#192234]" />

                      {/* ═══ CARD 2: Parcelamento Inteligente Alternativo ═══ */}
                      <div className="p-4 rounded-2xl bg-[#0d1320]/80 border border-[#00ff87]/25 hover:border-[#00ff87]/50 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Percent size={14} className="text-[#00ff87]" />
                            <h5 className="text-xs font-bold text-[#00ff87] uppercase tracking-wider">Parcelamento Inteligente Alternativo</h5>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#00ff87]/10 text-[#00ff87] font-bold font-mono border border-[#00ff87]/30">
                            {smartSuggestions.recommendedParcelas}x
                          </span>
                        </div>

                        {/* Comparativo visual inline */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2.5 rounded-xl bg-[#121927] border border-[#192234] text-center">
                            <p className="text-[8px] text-[#64748b] uppercase font-bold">Parcela</p>
                            <p className="text-sm font-black font-mono text-[#00ff87] mt-0.5">{fmt(smartSuggestions.recommendedInstallmentValue)}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#121927] border border-[#192234] text-center">
                            <p className="text-[8px] text-[#64748b] uppercase font-bold">Compromet.</p>
                            <p className="text-sm font-black font-mono text-[#00ff87] mt-0.5">{smartSuggestions.recommendedCommitPct.toFixed(1)}%</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#121927] border border-[#192234] text-center">
                            <p className="text-[8px] text-[#64748b] uppercase font-bold">Faturas Livres</p>
                            <p className="text-sm font-black font-mono text-amber-300 mt-0.5">{smartSuggestions.faturasLivreInRecommended}</p>
                          </div>
                        </div>

                        {/* Barra comparativa: atual vs. sugerido */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#94a3b8] w-14 shrink-0">Atual ({parcelas}x)</span>
                            <div className="flex-1 h-2 rounded-full bg-[#192234] overflow-hidden">
                              <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(100, newCommitPct)}%` }} />
                            </div>
                            <span className="text-[10px] font-bold font-mono text-purple-400 w-12 text-right">{newCommitPct.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#94a3b8] w-14 shrink-0">Suger. ({smartSuggestions.recommendedParcelas}x)</span>
                            <div className="flex-1 h-2 rounded-full bg-[#192234] overflow-hidden">
                              <div className="h-full rounded-full bg-[#00ff87] transition-all duration-500" style={{ width: `${Math.min(100, smartSuggestions.recommendedCommitPct)}%` }} />
                            </div>
                            <span className="text-[10px] font-bold font-mono text-[#00ff87] w-12 text-right">{smartSuggestions.recommendedCommitPct.toFixed(1)}%</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => applySuggestedParcelas(smartSuggestions.recommendedParcelas)}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#00ff87]/15 hover:bg-[#00ff87]/25 text-[#00ff87] border border-[#00ff87]/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <Check size={14} strokeWidth={2.5} />
                          <span>Aplicar {smartSuggestions.recommendedParcelas}x na Simulação</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* 3. Impacto na Renda Mensal */}
              <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingDown size={16} className="text-rose-400" />
                  <span>Impacto na Renda Mensal</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Parcela/Mês</p>
                    <p className="text-base font-black font-mono text-rose-400 mt-1">{fmt(monthlyInstallment)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Prazo</p>
                    <p className="text-base font-black font-mono text-purple-400 mt-1">{parcelas} meses</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Total da Compra</p>
                    <p className="text-base font-black font-mono text-white mt-1">{fmt(numericValor)}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <CommitmentBar
                    label="Gastos fixos mensais atuais"
                    value={fixedExpenses}
                    total={totalIncome}
                    color="#f43f5e"
                  />
                  <CommitmentBar
                    label="Nova parcela da simulação"
                    value={monthlyInstallment}
                    total={totalIncome}
                    color="#a855f7"
                  />
                  <div className="h-px bg-[#192234]" />
                  <CommitmentBar
                    label="Comprometimento Total Resultante"
                    value={fixedExpenses + monthlyInstallment}
                    total={totalIncome}
                    color={newCommitPct >= 80 ? '#ef4444' : newCommitPct >= 70 ? '#f97316' : newCommitPct >= 60 ? '#f59e0b' : '#00ff87'}
                  />
                </div>

                {/* Renda Livre Restante */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1320] border border-[#192234]">
                  <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                    <Wallet size={14} className="text-[#00ff87]" />
                    <span>Renda Livre Restante / Mês</span>
                  </div>
                  <span className={`text-sm font-black font-mono ${
                    (totalIncome - fixedExpenses - monthlyInstallment) < 0 ? 'text-red-400' : 'text-[#00ff87]'
                  }`}>
                    {fmt(Math.max(0, totalIncome - fixedExpenses - monthlyInstallment))}
                  </span>
                </div>
              </div>

              {/* 4. Impacto no Limite do Cartão (quando aplicável) */}
              {formaPgto === 'cartao' && (
                <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard size={16} className="text-purple-400" />
                    <span>Impacto no Limite — {card.name}</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                      <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Limite Total</p>
                      <p className="text-base font-black font-mono text-white mt-1">{fmt(card.limitTotal)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                      <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Já Utilizado</p>
                      <p className="text-base font-black font-mono text-amber-400 mt-1">{fmt(card.limitUsed)}</p>
                    </div>
                    <div className={`p-3 rounded-2xl bg-[#0d1320] border text-center ${limitAfterPurchase < 0 ? 'border-red-500/40' : 'border-[#192234]'}`}>
                      <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Após Compra</p>
                      <p className={`text-base font-black font-mono mt-1 ${limitAfterPurchase < 0 ? 'text-red-400' : 'text-[#00ff87]'}`}>
                        {limitAfterPurchase < 0 ? '⚠ ' : ''}{fmt(Math.abs(limitAfterPurchase))}
                      </p>
                    </div>
                  </div>

                  {limitAfterPurchase < 0 && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                      <ShieldAlert size={14} className="shrink-0 text-red-400" />
                      <span>
                        <strong>Limite insuficiente!</strong> Esta compra excede em {fmt(Math.abs(limitAfterPurchase))} o limite disponível deste cartão.
                      </span>
                    </div>
                  )}

                  {/* Barra de Limite Dupla */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-[#64748b]">
                      <span>Comprometimento do Limite</span>
                      <span className="font-bold text-white">{Math.min(100, limitCommitPct).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#192234] overflow-hidden flex">
                      <div
                        className="h-full bg-amber-500/80 rounded-l-full transition-all"
                        style={{ width: `${pct(card.limitUsed, card.limitTotal)}%` }}
                      />
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${Math.min(pct(numericValor, card.limitTotal), 100 - pct(card.limitUsed, card.limitTotal))}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-[10px]">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[#94a3b8]">Já comprometido</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-[#94a3b8]">Nova aquisição</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. DESTAQUE NO CRONOGRAMA DE ALÍVIO DE FATURAS */}
              <div className="p-5 rounded-3xl bg-[#0b0f19] border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.08)] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#192234]">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-amber-400" />
                    <span>Cronograma de Alívio de Faturas (Términos em Destaque)</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                    {parcelas} meses de simulação
                  </span>
                </div>

                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Você gasta <strong className="text-amber-400">{fmt(totalCurrentInstallments)}</strong>/mês com cartões. 
                  Durante os <strong className="text-purple-300">{parcelas} meses</strong> da simulação, você terminará o pagamento das seguintes faturas:
                </p>

                {/* Lista com Destaques Visuais Fortes nos Meses e Datas */}
                <div className="space-y-3">
                  {existingInstallments
                    .filter(ei => ei.monthsLeft <= parcelas)
                    .map((ei) => {
                      const term = getTerminationDate(ei.monthsLeft, ei.dueDay);
                      return (
                        <div 
                          key={ei.id} 
                          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0d1320] to-[#0b0f19] border border-amber-500/40 hover:border-amber-500/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{ei.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#121927] text-[#94a3b8] border border-[#192234]">
                                {ei.bank}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-amber-300 font-medium">
                                Parcela atual: <strong className="font-mono">{fmt(ei.monthlyAmount)}/mês</strong>
                              </span>
                              <span className="text-[#64748b]">•</span>
                              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={13} />
                                Libera {fmt(ei.monthlyAmount)}/mês após o término
                              </span>
                            </div>
                          </div>

                          {/* CAIXA DE DESTAQUE DO MÊS E DATA DE TÉRMINO */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                                Término
                              </span>
                              <span className="text-sm font-black font-mono text-amber-200">
                                MÊS {ei.monthsLeft}
                              </span>
                            </div>

                            <div className="px-3 py-2 rounded-xl bg-[#121927] border border-[#192234] text-center">
                              <span className="text-[9px] text-[#64748b] uppercase block">Data Prevista</span>
                              <span className="text-xs font-bold font-mono text-white flex items-center gap-1 mt-0.5">
                                <Calendar size={11} className="text-amber-400" />
                                {term.formattedDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }

                  {existingInstallments.filter(ei => ei.monthsLeft <= parcelas).length === 0 && (
                    <div className="p-4 rounded-2xl bg-[#0d1320] border border-[#192234] text-xs text-[#64748b] text-center">
                      Nenhuma fatura ativa termina dentro do prazo selecionado de {parcelas} meses.
                    </div>
                  )}
                </div>

                {reliefInPeriod > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Alívio Financeiro Acumulado</span>
                        <span className="text-[11px] text-emerald-400">Total economizado pelas parcelas que expiram durante o período</span>
                      </div>
                    </div>
                    <span className="text-base font-black font-mono text-emerald-300">{fmt(reliefInPeriod)}</span>
                  </div>
                )}
              </div>

              {/* 6. Comprometimento Geral com Linha do Tempo */}
              <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-purple-400" />
                  <span>Comprometimento Geral da Renda com Linha do Tempo</span>
                </h4>

                <CommitmentTimeline
                  parcelas={parcelas}
                  monthlyInstallment={monthlyInstallment}
                  fixedExpenses={fixedExpenses}
                  totalIncome={totalIncome}
                  existingInstallments={existingInstallments}
                />

                {/* Resumo Final de Comprometimento */}
                <div className={`p-5 rounded-2xl border text-center space-y-1.5 transition-all ${
                  newCommitPct >= 80 ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]' :
                  newCommitPct >= 70 ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]' :
                  newCommitPct >= 60 ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
                  'bg-[#00ff87]/10 border-[#00ff87]/30 shadow-[0_0_20px_rgba(0,255,135,0.15)]'
                }`}>
                  <p className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
                    Comprometimento Percentual Total da Renda (Após Aquisição)
                  </p>
                  <p className={`text-4xl font-black font-mono ${
                    newCommitPct >= 80 ? 'text-red-400' :
                    newCommitPct >= 70 ? 'text-orange-400' :
                    newCommitPct >= 60 ? 'text-yellow-400' :
                    'text-[#00ff87]'
                  }`}>
                    {newCommitPct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-[#94a3b8]">
                    {newCommitPct < 60 && '✅ Excelente: Comprometimento saudável dentro da margem de segurança financeira.'}
                    {newCommitPct >= 60 && newCommitPct < 70 && '⚡ Alerta Amarelo: Renda moderadamente comprometida. Avalie riscos imprevistos.'}
                    {newCommitPct >= 70 && newCommitPct < 80 && '⚠️ Alerta Laranja: Risco elevado. Margem estreita para emergências.'}
                    {newCommitPct >= 80 && '🚨 Alerta Vermelho: Risco crítico. Não recomendado realizar esta aquisição no momento.'}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
