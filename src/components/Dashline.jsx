import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import VisualDateRangePicker from './VisualDateRangePicker';

// Dados Mockados Robustos para a Dashline
const MOCK_MONTHLY_PROFIT = [
  { month: 'Mar', entradas: 11200, saidas: 7400, lucro: 3800 },
  { month: 'Abr', entradas: 12500, saidas: 8100, lucro: 4400 },
  { month: 'Mai', entradas: 11800, saidas: 7900, lucro: 3900 },
  { month: 'Jun', entradas: 13000, saidas: 8600, lucro: 4400 },
  { month: 'Jul', entradas: 12200, saidas: 7800, lucro: 4400 },
  { month: 'Ago', entradas: 13500, saidas: 8250, lucro: 5250 }
];

const MOCK_RECENT_TRANSACTIONS = [
  { id: '1', date: '02/08/2026', title: 'Empresa Tech SA', category: 'Salário', amount: 9500.00, type: 'income' },
  { id: '2', date: '02/08/2026', title: 'Administradora Condomínio', category: 'Habitação', amount: 680.00, type: 'expense' },
  { id: '3', date: '02/08/2026', title: 'Restaurante Coco Bambu', category: 'Lazer', amount: 220.00, type: 'expense' },
  { id: '4', date: '01/08/2026', title: 'Supermercado Carrefour', category: 'Alimentação', amount: 450.80, type: 'expense' },
  { id: '5', date: '30/07/2026', title: 'Projeto Freela UI/UX', category: 'Renda Extra', amount: 2500.00, type: 'income' }
];

const MOCK_EXPENSE_RANKING = [
  { icon: '🏠', category: 'Habitação & Moradia', amount: 2850.00, percentage: 34.5, color: '#00ff87' },
  { icon: '🛒', category: 'Alimentação & Mercado', amount: 2100.00, percentage: 25.4, color: '#10b981' },
  { icon: '💪', category: 'Dieta & Saúde', amount: 1250.00, percentage: 15.1, color: '#059669' },
  { icon: '🚗', category: 'Transporte & Veículo', amount: 980.00, percentage: 11.8, color: '#047857' },
  { icon: '💻', category: 'Lazer & Tecnologia', amount: 1070.00, percentage: 13.2, color: '#064e3b' }
];

const MOCK_EXPENSE_RANKING_FILTERED = [
  { icon: '🛒', category: 'Alimentação & Mercado', amount: 1450.00, percentage: 44.6, color: '#00ff87' },
  { icon: '🚗', category: 'Transporte & Veículo', amount: 900.00, percentage: 27.7, color: '#10b981' },
  { icon: '💪', category: 'Dieta & Saúde', amount: 500.00, percentage: 15.4, color: '#059669' },
  { icon: '💻', category: 'Lazer & Tecnologia', amount: 400.00, percentage: 12.3, color: '#047857' }
];

const MOCK_INCOME_RANKING = [
  { icon: '💼', category: 'Trabalho Fixo', amount: 9500.00, percentage: 70.3, color: '#00ff87' },
  { icon: '💰', category: 'Renda Extra / Freela', amount: 2500.00, percentage: 18.5, color: '#10b981' },
  { icon: '📈', category: 'Rendimentos & Investimentos', amount: 1500.00, percentage: 11.2, color: '#059669' }
];

const MOCK_INCOME_RANKING_FILTERED = [
  { icon: '💼', category: 'Trabalho Fixo', amount: 4750.00, percentage: 69.9, color: '#00ff87' },
  { icon: '💰', category: 'Renda Extra / Freela', amount: 1250.00, percentage: 18.4, color: '#10b981' },
  { icon: '📈', category: 'Rendimentos & Investimentos', amount: 800.00, percentage: 11.7, color: '#059669' }
];

const MOCK_CARD_DATA = {
  'Julho/2026': {
    total: 3420.00,
    committedPercentage: 28.0,
    breakdown: [
      { category: 'Supermercado & Feira', amount: 1320.00 },
      { category: 'Restaurantes & Delivery', amount: 780.00 },
      { category: 'Assinaturas & Streamings', amount: 290.00 },
      { category: 'Shopping & Vestuário', amount: 1030.00 }
    ],
    nextMonth: { amount: 3840.50, percentage: 29.5 }
  },
  'Agosto/2026 (Atual)': {
    total: 3840.50,
    committedPercentage: 29.5,
    breakdown: [
      { category: 'Supermercado & Feira', amount: 1450.00 },
      { category: 'Restaurantes & Delivery', amount: 820.00 },
      { category: 'Assinaturas & Streamings', amount: 290.00 },
      { category: 'Viagens & Lazer', amount: 1280.50 }
    ],
    nextMonth: { amount: 4120.00, percentage: 31.6 }
  },
  'Setembro/2026 (Próximo)': {
    total: 4120.00,
    committedPercentage: 31.6,
    breakdown: [
      { category: 'Supermercado & Feira', amount: 1500.00 },
      { category: 'Restaurantes & Delivery', amount: 900.00 },
      { category: 'Assinaturas & Streamings', amount: 290.00 },
      { category: 'Manutenção & Tech', amount: 1430.00 }
    ],
    nextMonth: { amount: 3900.00, percentage: 30.0 }
  }
};

export default function Dashline({ bankAccounts = [] }) {
  // Estados dos 3 cards do topo (padrão null = Mês Atual)
  const [saldoRange, setSaldoRange] = useState({ start: null, end: null });
  const [entradasRange, setEntradasRange] = useState({ start: null, end: null });
  const [saidasRange, setSaidasRange] = useState({ start: null, end: null });

  // Estados dos Rankings
  const [rankingGastosRange, setRankingGastosRange] = useState({ start: null, end: null });
  const [rankingRendasRange, setRankingRendasRange] = useState({ start: null, end: null });

  const [selectedCardMonth, setSelectedCardMonth] = useState('Agosto/2026 (Atual)');

  // Verificação de Filtro Ativo em Cada Card
  const isSaldoFiltered = Boolean(saldoRange.start && saldoRange.end);
  const isEntradasFiltered = Boolean(entradasRange.start && entradasRange.end);
  const isSaidasFiltered = Boolean(saidasRange.start && saidasRange.end);

  const isGastosRankingFiltered = Boolean(rankingGastosRange.start && rankingGastosRange.end);
  const isRendasRankingFiltered = Boolean(rankingRendasRange.start && rankingRendasRange.end);

  // Cálculos dinâmicos / Mock Reativo
  const defaultBalance = bankAccounts.reduce((acc, curr) => acc + curr.balance, 18270.50);
  const totalBalance = isSaldoFiltered ? 11450.00 : defaultBalance;
  
  const totalEntradas = isEntradasFiltered ? 6800.00 : 13500.00;
  const totalSaidas = isSaidasFiltered ? 3250.00 : 8250.00;

  const expenseRankingData = isGastosRankingFiltered ? MOCK_EXPENSE_RANKING_FILTERED : MOCK_EXPENSE_RANKING;
  const incomeRankingData = isRendasRankingFiltered ? MOCK_INCOME_RANKING_FILTERED : MOCK_INCOME_RANKING;

  const currentExpenseRankingTotal = expenseRankingData.reduce((acc, curr) => acc + curr.amount, 0);
  const currentIncomeRankingTotal = incomeRankingData.reduce((acc, curr) => acc + curr.amount, 0);

  const lucroMes = totalEntradas - totalSaidas;
  const retencaoPercent = ((lucroMes / totalEntradas) * 100).toFixed(1);
  const comprometidoPercent = ((totalSaidas / totalEntradas) * 100).toFixed(1);

  const currentCardData = MOCK_CARD_DATA[selectedCardMonth] || MOCK_CARD_DATA['Agosto/2026 (Atual)'];

  // Formatação BRL
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
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
            <div className="flex items-center gap-2 mt-2 text-[11px] text-[#00ff87] font-mono font-semibold">
              <TrendingUp size={14} />
              <span>
                {isSaldoFiltered ? 'Período customizado selecionado' : '+R$ 5.250,00 saldo líquido do mês'}
              </span>
            </div>
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
            <h3 className="text-3xl font-extrabold text-[#00ff87] tracking-tight">
              {formatBRL(totalEntradas)}
            </h3>
            <p className="text-[11px] text-[#64748b] font-mono mt-2 font-medium">
              {isEntradasFiltered ? 'Entradas no período selecionado' : 'Meta atingida: 108% da média estimada'}
            </p>
          </div>
        </div>

        {/* Card 3: Total Saídas */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] relative group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
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
            <h3 className="text-3xl font-extrabold text-[#ff4d4d] tracking-tight">
              {formatBRL(totalSaidas)}
            </h3>
            <p className="text-[11px] text-[#64748b] font-mono mt-2 font-medium">
              {isSaidasFiltered ? 'Saídas no período selecionado' : `Economia líquida: ${formatBRL(lucroMes)} (${retencaoPercent}% retido)`}
            </p>
          </div>
        </div>

      </div>


      {/* ==========================================
          LINHA 2: GASTOS X SAÍDAS & LANÇAMENTOS RECENTES (LADO A LADO)
         ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bloco 1: Gráfico "Gastos X Saídas" (Renda vs Gasto Direct) */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#192234] pb-3">
            <div>
              <h4 className="font-bold text-base text-white">Gastos X Saídas</h4>
              <p className="text-xs text-[#64748b]">Proporção de uso das receitas no mês vigente</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#00ff87] bg-[#00ff87]/10 px-2.5 py-1 rounded-full border border-[#00ff87]/20">
              {retencaoPercent}% Retido
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Saídas / Gastos', value: totalSaidas, color: '#ff4d4d' },
                    { name: 'Lucro Retido / Saldo Livre', value: lucroMes, color: '#00ff87' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={78}
                  outerRadius={108}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#ff4d4d" stroke="none" />
                  <Cell fill="#00ff87" stroke="none" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1320', borderColor: '#192234', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value) => [formatBRL(value)]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-[#00ff87] font-display tracking-tight">{retencaoPercent}%</span>
              <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono font-bold mt-0.5">Poupança</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#192234]">
            <div className="p-3.5 rounded-xl bg-[#0e1422] border border-[#192234]/80 space-y-1">
              <span className="text-sm font-bold text-white block">Saídas do Mês</span>
              <span className="text-lg md:text-xl font-mono font-extrabold text-[#ff4d4d] block">
                {formatBRL(totalSaidas)}
              </span>
              <span className="text-[10px] font-mono text-[#64748b] block">{comprometidoPercent}% da renda</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0e1422] border border-[#192234]/80 space-y-1">
              <span className="text-sm font-bold text-white block">Saldo Livre</span>
              <span className="text-lg md:text-xl font-mono font-extrabold text-[#00ff87] block">
                {formatBRL(lucroMes)}
              </span>
              <span className="text-[10px] font-mono text-[#64748b] block">{retencaoPercent}% poupado</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Lançamentos Recentes */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#192234] pb-3">
              <div>
                <h4 className="font-bold text-base text-white">Lançamentos Recentes</h4>
                <p className="text-xs text-[#64748b]">Feed dos últimos registros do mês</p>
              </div>
              <span className="text-[10px] font-mono text-[#00ff87] bg-[#00ff87]/10 px-2 py-0.5 rounded-full font-bold">Feed</span>
            </div>

            <div className="space-y-3">
              {MOCK_RECENT_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0e1422] border border-[#192234]/60 hover:border-[#192234] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-[#00ff87]/10 text-[#00ff87]' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white leading-tight">{tx.title}</p>
                      <span className="text-[10px] text-[#64748b] block font-mono">{tx.date} • {tx.category}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold ${tx.type === 'income' ? 'text-[#00ff87]' : 'text-[#ff4d4d]'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatBRL(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#192234] text-center">
            <span className="text-[11px] text-[#64748b] font-mono">Últimas 5 movimentações</span>
          </div>
        </div>

      </div>


      {/* ==========================================
          LINHA 3: RANKING DE GASTOS VIGENTES & RANKING DE RENDAS VIGENTES (LADO A LADO)
         ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Ranking de Gastos */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] space-y-4">
          <div className="flex items-center justify-between border-b border-[#192234] pb-3">
            <div>
              <h4 className="font-bold text-base text-white">Ranking de Gastos Vigentes</h4>
              <p className="text-xs text-[#64748b]">Categorias de despesas no mês</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-red-400">
                {formatBRL(currentExpenseRankingTotal)}
              </span>
              <VisualDateRangePicker 
                startDate={rankingGastosRange.start} 
                endDate={rankingGastosRange.end} 
                onApplyRange={(start, end) => setRankingGastosRange({ start, end })}
                onReset={() => setRankingGastosRange({ start: null, end: null })}
              />
            </div>
          </div>

          <div className="space-y-4">
            {expenseRankingData.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl leading-none select-none shrink-0">{item.icon}</span>
                    <span className="text-xs md:text-sm font-semibold text-white truncate">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white font-mono font-bold">{formatBRL(item.amount)}</span>
                    <span className="text-[10px] font-mono font-bold text-[#00ff87] bg-[#00ff87]/10 px-1.5 py-0.5 rounded">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-[#121927] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00ff87] to-[#10b981] rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking de Rendas */}
        <div className="glass-card p-6 rounded-2xl border border-[#192234] space-y-4">
          <div className="flex items-center justify-between border-b border-[#192234] pb-3">
            <div>
              <h4 className="font-bold text-base text-white">Ranking de Rendas Vigentes</h4>
              <p className="text-xs text-[#64748b]">Origem dos recebimentos no mês</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#00ff87]">
                {formatBRL(currentIncomeRankingTotal)}
              </span>
              <VisualDateRangePicker 
                startDate={rankingRendasRange.start} 
                endDate={rankingRendasRange.end} 
                onApplyRange={(start, end) => setRankingRendasRange({ start, end })}
                onReset={() => setRankingRendasRange({ start: null, end: null })}
              />
            </div>
          </div>

          <div className="space-y-4">
            {incomeRankingData.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl leading-none select-none shrink-0">{item.icon}</span>
                    <span className="text-xs md:text-sm font-semibold text-white truncate">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white font-mono font-bold">{formatBRL(item.amount)}</span>
                    <span className="text-[10px] font-mono font-bold text-[#00ff87] bg-[#00ff87]/10 px-1.5 py-0.5 rounded">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-[#121927] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00ff87] to-[#059669] rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>


      {/* ==========================================
          LINHA 4: GRÁFICO HISTÓRICO "LUCROS E FLUXO DE CAIXA MENSAL"
         ========================================== */}
      <div className="glass-card p-6 rounded-2xl border border-[#192234] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg text-white">Lucros e Fluxo de Caixa Mensal</h4>
            <p className="text-xs text-[#64748b]">Comparativo histórico de entradas, saídas e resultado líquido dos últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-semibold">
            <span className="flex items-center gap-1.5 text-[#00ff87]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff87]"></span> Entradas
            </span>
            <span className="flex items-center gap-1.5 text-[#ff4d4d]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d]"></span> Saídas
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_MONTHLY_PROFIT} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d1320', borderColor: '#192234', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(value) => [formatBRL(value)]}
              />
              <Bar dataKey="entradas" fill="#00ff87" radius={[6, 6, 0, 0]} barSize={26} />
              <Bar dataKey="saidas" fill="#ff4d4d" radius={[6, 6, 0, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* ==========================================
          LINHA 5 (RODAPÉ DA DASHLINE): BLOCO DE CARTÕES
         ========================================== */}
      <div className="glass-card p-8 rounded-3xl border border-[#00ff87]/30 bg-gradient-to-b from-[#0b0f19] to-[#070b13] relative overflow-hidden glow-neon space-y-6">
        
        {/* Topo do Bloco Cartões */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#192234] pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/30 shadow-[0_0_20px_rgba(0,255,135,0.2)]">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-white">Análise de Cartões de Crédito</h3>
              <p className="text-xs text-[#94a3b8]">Faturas, detalhamento de categorias e projeções</p>
            </div>
          </div>

          {/* Seletor Mês Atual / Anterior / Próximo */}
          <div className="flex items-center gap-2 bg-[#121927] p-1.5 rounded-xl border border-[#192234]">
            {['Julho/2026', 'Agosto/2026 (Atual)', 'Setembro/2026 (Próximo)'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedCardMonth(m)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCardMonth === m
                    ? 'bg-[#00ff87] text-black font-extrabold shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#182236]'
                }`}
              >
                {m.replace(' (Atual)', '').replace(' (Próximo)', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo do Bloco Cartões em Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card Total de Gastos com Cartões */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-[#192234] space-y-4">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Total de Gastos no Cartão</span>
            <h4 className="text-3xl font-extrabold text-white font-display">
              {formatBRL(currentCardData.total)}
            </h4>
            <div className="p-3 rounded-xl bg-[#121927] border border-[#192234] flex items-center gap-3">
              <CheckCircle2 size={18} className="text-[#00ff87] shrink-0" />
              <span className="text-xs text-[#94a3b8]">Fatura agendada para vencimento</span>
            </div>
          </div>

          {/* Breakdown de Categorias do Cartão */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-[#192234] space-y-3">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block mb-2">Breakdown de Categorias</span>
            <div className="space-y-2.5">
              {currentCardData.breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-[#94a3b8]">{item.category}</span>
                  <span className="font-mono text-white font-bold">{formatBRL(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Indicador de Renda Comprometida + Projeção */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-[#192234] space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider block mb-1">Impacto na Renda Mensal</span>
              <p className="text-sm font-bold text-white">
                <span className="text-[#00ff87] font-extrabold">{currentCardData.committedPercentage}%</span> da renda comprometida com faturas
              </p>
              
              {/* Barra Proporcional de Comprometimento */}
              <div className="w-full h-3 bg-[#121927] rounded-full overflow-hidden mt-3">
                <div 
                  className="h-full bg-gradient-to-r from-[#00ff87] to-[#10b981] rounded-full"
                  style={{ width: `${currentCardData.committedPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Card Projeção Mês Seguinte */}
            <div className="p-3 rounded-xl bg-[#121927] border border-[#00ff87]/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748b] block font-mono">Projeção Mês Seguinte</span>
                <span className="text-xs font-mono font-bold text-white">{formatBRL(currentCardData.nextMonth.amount)}</span>
              </div>
              <span className="text-[11px] font-mono text-[#00ff87] bg-[#00ff87]/10 px-2 py-0.5 rounded-md font-bold">
                {currentCardData.nextMonth.percentage}% comprometido
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
