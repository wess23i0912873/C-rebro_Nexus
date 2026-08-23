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
  ChevronRight,
  Zap,
  ShieldAlert,
  Wallet,
  RefreshCw,
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

// ─── Alerta de Comprometimento ────────────────────────────────────────────────
function CommitmentAlert({ commitPct }) {
  if (commitPct < 60) return null;

  if (commitPct >= 80) {
    return (
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-start gap-3">
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
      <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/40 flex items-start gap-3">
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
    <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/40 flex items-start gap-3">
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
        <div className="relative h-2 bg-[#192234] rounded-full">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #00ff87 0%, #f59e0b 60%, #ef4444 100%)',
              opacity: 0.3
            }}
          />
          {/* Barra de progresso real (comprometimento) */}
          <div
            className="absolute top-0 left-0 h-full rounded-full"
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
                  className={`w-3 h-3 rounded-full border-2 mx-auto transition-all ${
                    isLast
                      ? 'bg-[#00ff87] border-[#00ff87] shadow-[0_0_8px_rgba(0,255,135,0.6)]'
                      : isRelease
                        ? 'bg-emerald-400 border-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                        : 'bg-[#192234] border-[#2a3550]'
                  }`}
                />
                {isRelease && (
                  <span className="text-[8px] text-emerald-400 font-bold mt-0.5 text-center leading-tight">
                    +{fmt(releasedThisMonth).replace('R$\u00a0', '')}
                    <br/>livre
                  </span>
                )}
                {isLast && !isRelease && (
                  <span className="text-[8px] text-[#00ff87] font-bold mt-0.5 text-center">fim</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
          <span className="text-[10px] text-[#94a3b8]">Fatura anterior termina</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#00ff87] shadow-[0_0_8px_rgba(0,255,135,0.6)]" />
          <span className="text-[10px] text-[#94a3b8]">Fim da nova compra</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#192234] border-2 border-[#2a3550]" />
          <span className="text-[10px] text-[#94a3b8]">Mês normal</span>
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

  // ── Dados do App ────────────────────────────────────────────────────────────
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' || t.type === 'receita')
      .reduce((acc, t) => acc + parseFloat(t.value || 0), 0);
  }, [transactions]);

  const fixedExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' || t.type === 'despesa')
      .reduce((acc, t) => acc + parseFloat(t.value || 0), 0);
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return bankAccounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  }, [bankAccounts]);

  const currentCommitPct = totalIncome > 0 ? (fixedExpenses / totalIncome) * 100 : 0;

  // Simulação de parcelas existentes com prazo e valor
  const existingInstallments = useMemo(() => [
    { name: 'Nubank — Sofá em 12x',      monthlyAmount: 153.37, monthsLeft: 5  },
    { name: 'Mercado Pago — iPhone 15x', monthlyAmount: 333.33, monthsLeft: 9  },
    { name: 'Itaú — TV 6x',              monthlyAmount: 124.83, monthsLeft: 3  },
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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Calculator size={22} />
            </div>
            Simulador de Compras
          </h3>
          <p className="text-sm text-[#94a3b8] ml-[52px]">
            Descubra o impacto de uma nova compra no seu orçamento antes de decidir
          </p>
        </div>
        {simulado && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121927] border border-[#192234] text-xs font-bold text-[#94a3b8] hover:text-white hover:bg-[#182236] transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            Nova Simulação
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">

        {/* ── Formulário (2/5) ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Situação Atual */}
          <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-[#00ff87]" />
              Situação Financeira Atual
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Saldo Geral</p>
                <p className="text-lg font-black font-mono text-[#00ff87]">{fmt(totalBalance)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Renda / Mês</p>
                <p className="text-lg font-black font-mono text-emerald-400">{fmt(totalIncome)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Saídas Fixas</p>
                <p className="text-lg font-black font-mono text-rose-400">{fmt(fixedExpenses)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-1">Compromet. Atual</p>
                <p className={`text-lg font-black font-mono ${currentCommitPct >= 80 ? 'text-red-400' : currentCommitPct >= 70 ? 'text-orange-400' : currentCommitPct >= 60 ? 'text-yellow-400' : 'text-[#00ff87]'}`}>
                  {currentCommitPct.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Parcelas em andamento */}
            <div>
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mb-2">Parcelas Ativas</p>
              <div className="space-y-1.5">
                {existingInstallments.map((ei, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#0d1320] border border-[#192234]">
                    <div>
                      <span className="text-white font-semibold truncate block max-w-[160px]">{ei.name}</span>
                      <span className="text-[#64748b] text-[10px]">{ei.monthsLeft}x restantes</span>
                    </div>
                    <span className="font-bold font-mono text-amber-400 whitespace-nowrap">{fmt(ei.monthlyAmount)}/mês</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-[10px] text-[#94a3b8]">Total em parcelas:</span>
                <span className="text-xs font-bold font-mono text-amber-300">{fmt(totalCurrentInstallments)}/mês</span>
              </div>
            </div>
          </div>

          {/* Formulário de Simulação */}
          <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={16} className="text-purple-400" />
              Dados da Simulação
            </h4>

            {/* Valor do Bem */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                Valor Total do Bem (R$)
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
                  Nº de Parcelas
                </label>
                <span className="text-sm font-black font-mono text-purple-400">{parcelas}x</span>
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

            {/* Valor da Parcela (calculado) */}
            {numericValor > 0 && (
              <div className="px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex justify-between items-center">
                <span className="text-xs text-purple-300 font-semibold">Parcela mensal:</span>
                <span className="text-lg font-black font-mono text-purple-300">{fmt(monthlyInstallment)}</span>
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
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    formaPgto === 'cartao'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-[#121927] border-[#192234] text-[#94a3b8] hover:border-[#2a3550]'
                  }`}
                >
                  <CreditCard size={15} />
                  Cartão de Crédito
                </button>
                <button
                  type="button"
                  onClick={() => { setFormaPgto('boleto'); setSimulado(false); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    formaPgto === 'boleto'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
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
                  Cartão Utilizado
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
                            ? 'bg-purple-500/15 border-purple-500/50'
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
              className={`w-full py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                canSimulate
                  ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]'
                  : 'bg-[#192234] text-[#475569] cursor-not-allowed'
              }`}
            >
              <Calculator size={18} />
              {simulado ? 'Atualizar Simulação' : 'Simular Impacto'}
            </button>
          </div>
        </div>

        {/* ── Resultados (3/5) ── */}
        <div className="xl:col-span-3 space-y-5">

          {!simulado ? (
            /* ── Estado vazio ── */
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-10 rounded-3xl bg-[#0b0f19] border border-dashed border-[#192234] text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400/60 flex items-center justify-center mx-auto">
                <Calculator size={32} />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#64748b]">Aguardando dados da simulação</h4>
                <p className="text-xs text-[#475569] mt-1">
                  Preencha o formulário ao lado e clique em <strong className="text-[#94a3b8]">Simular Impacto</strong> para ver os resultados detalhados.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-4">
                {['Impacto na Renda', 'Limite do Cartão', 'Comprometimento', 'Linha do Tempo'].map(f => (
                  <div key={f} className="px-3 py-2 rounded-xl bg-[#0d1320] border border-[#192234] text-[10px] text-[#475569] font-semibold flex items-center gap-1.5">
                    <ChevronRight size={11} className="text-purple-500/40" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Resultados ── */
            <div className="space-y-5">

              {/* Alerta de comprometimento (topo) */}
              <CommitmentAlert commitPct={newCommitPct} />

              {/* Card: Impacto na Renda */}
              <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingDown size={16} className="text-rose-400" />
                  Impacto na Renda Mensal
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Parcela/Mês</p>
                    <p className="text-base font-black font-mono text-rose-400 mt-1">{fmt(monthlyInstallment)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Por</p>
                    <p className="text-base font-black font-mono text-purple-400 mt-1">{parcelas} meses</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] text-center">
                    <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold">Total Pago</p>
                    <p className="text-base font-black font-mono text-white mt-1">{fmt(numericValor)}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <CommitmentBar
                    label="Gastos fixos mensais"
                    value={fixedExpenses}
                    total={totalIncome}
                    color="#f43f5e"
                  />
                  <CommitmentBar
                    label="Nova parcela"
                    value={monthlyInstallment}
                    total={totalIncome}
                    color="#a855f7"
                  />
                  <div className="h-px bg-[#192234]" />
                  <CommitmentBar
                    label="Total comprometido (após compra)"
                    value={fixedExpenses + monthlyInstallment}
                    total={totalIncome}
                    color={newCommitPct >= 80 ? '#ef4444' : newCommitPct >= 70 ? '#f97316' : newCommitPct >= 60 ? '#f59e0b' : '#00ff87'}
                  />
                </div>

                {/* Renda livre */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1320] border border-[#192234]">
                  <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                    <Wallet size={14} className="text-[#00ff87]" />
                    Renda Livre Restante / Mês
                  </div>
                  <span className={`text-sm font-black font-mono ${
                    (totalIncome - fixedExpenses - monthlyInstallment) < 0 ? 'text-red-400' : 'text-[#00ff87]'
                  }`}>
                    {fmt(Math.max(0, totalIncome - fixedExpenses - monthlyInstallment))}
                  </span>
                </div>
              </div>

              {/* Card: Impacto no Cartão (somente se cartão) */}
              {formaPgto === 'cartao' && (
                <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard size={16} className="text-purple-400" />
                    Impacto no Cartão — {card.name}
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

                  {/* Barra de limite */}
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
                    <div className="flex gap-3 text-[10px]">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[#94a3b8]">Já usado</span></div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-[#94a3b8]">Nova compra</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card: Cronograma de Alívio de Faturas */}
              <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  Cronograma de Alívio de Faturas
                </h4>

                <p className="text-xs text-[#94a3b8]">
                  Você gasta <strong className="text-amber-400">{fmt(totalCurrentInstallments)}</strong>/mês com parcelas ativas.
                  Durante os <strong className="text-purple-400">{parcelas} meses</strong> da nova compra, as faturas abaixo irão terminar:
                </p>

                <div className="space-y-2">
                  {existingInstallments
                    .filter(ei => ei.monthsLeft <= parcelas)
                    .map((ei, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <div>
                          <p className="text-xs font-bold text-white">{ei.name}</p>
                          <p className="text-[10px] text-emerald-400">
                            Termina no mês {ei.monthsLeft} • Libera {fmt(ei.monthlyAmount)}/mês a partir daí
                          </p>
                        </div>
                        <div className="text-right">
                          <CheckCircle2 size={16} className="text-emerald-400 ml-2" />
                        </div>
                      </div>
                    ))
                  }

                  {existingInstallments.filter(ei => ei.monthsLeft <= parcelas).length === 0 && (
                    <div className="px-4 py-3 rounded-xl bg-[#0d1320] border border-[#192234] text-xs text-[#64748b]">
                      Nenhuma fatura existente termina dentro do período da nova compra.
                    </div>
                  )}
                </div>

                {reliefInPeriod > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-xs text-emerald-300 font-semibold">
                      💰 Economia acumulada dentro do período:
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-400">{fmt(reliefInPeriod)}</span>
                  </div>
                )}
              </div>

              {/* Card: Linha do Tempo Visual */}
              <div className="p-5 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-purple-400" />
                  Comprometimento com Linha do Tempo
                </h4>

                {parcelas <= 24 ? (
                  <CommitmentTimeline
                    parcelas={parcelas}
                    monthlyInstallment={monthlyInstallment}
                    fixedExpenses={fixedExpenses}
                    totalIncome={totalIncome}
                    existingInstallments={existingInstallments}
                  />
                ) : (
                  <p className="text-xs text-[#64748b]">Linha do tempo disponível para até 24 parcelas.</p>
                )}

                {/* Resumo final */}
                <div className={`px-4 py-4 rounded-2xl border text-center space-y-1 ${
                  newCommitPct >= 80 ? 'bg-red-500/10 border-red-500/30' :
                  newCommitPct >= 70 ? 'bg-orange-500/10 border-orange-500/30' :
                  newCommitPct >= 60 ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-[#00ff87]/10 border-[#00ff87]/30'
                }`}>
                  <p className="text-xs text-[#94a3b8]">Comprometimento Total da Renda Após a Compra</p>
                  <p className={`text-4xl font-black font-mono ${
                    newCommitPct >= 80 ? 'text-red-400' :
                    newCommitPct >= 70 ? 'text-orange-400' :
                    newCommitPct >= 60 ? 'text-yellow-400' :
                    'text-[#00ff87]'
                  }`}>
                    {newCommitPct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {newCommitPct < 60 && '✅ Situação saudável — compra segura'}
                    {newCommitPct >= 60 && newCommitPct < 70 && '⚡ Atenção — compra com cautela'}
                    {newCommitPct >= 70 && newCommitPct < 80 && '⚠️ Risco moderado — avalie com cuidado'}
                    {newCommitPct >= 80 && '🚨 Risco alto — evite esta compra agora'}
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
