import React, { useState } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import VisualDateRangePicker from './VisualDateRangePicker';
import VisualMonthPicker from './VisualMonthPicker';
import CardVisual from './CardVisual';

// Dados Mockados de Fallback para o Módulo de Cartões
const DEFAULT_FALLBACK_CARDS = [
  {
    id: 'card-1',
    name: 'Nubank Ultravioleta',
    digits: '•••• 4892',
    colorGradient: 'from-purple-900/60 via-indigo-950/80 to-[#0b0f19]',
    borderColor: 'border-purple-500/30',
    currentBill: 1840.50,
    nextBill: 1950.00,
    limitTotal: 15000.00,
    limitUsed: 3790.50,
    categories: [
      { icon: '🛒', category: 'Supermercado & Feira', amount: 680.00 },
      { icon: '🏠', category: 'Habitação & Moradia', amount: 450.00 },
      { icon: '💪', category: 'Dieta & Suplementos', amount: 220.00 },
      { icon: '🎬', category: 'Assinaturas & Streams', amount: 145.00 },
      { icon: '💻', category: 'Software & Tech', amount: 345.50 }
    ]
  },
  {
    id: 'card-2',
    name: 'Mercado Pago Black',
    digits: '•••• 8120',
    colorGradient: 'from-sky-900/60 via-blue-950/80 to-[#0b0f19]',
    borderColor: 'border-cyan-500/30',
    currentBill: 1250.00,
    nextBill: 1420.00,
    limitTotal: 10000.00,
    limitUsed: 2670.00,
    categories: [
      { icon: '🍕', category: 'Restaurantes & Delivery', amount: 520.00 },
      { icon: '🚗', category: 'Combustível & Uber', amount: 430.00 },
      { icon: '🛒', category: 'Compras Mercado Livre', amount: 300.00 }
    ]
  },
  {
    id: 'card-3',
    name: 'Itaú Personnalité Platinum',
    digits: '•••• 3044',
    colorGradient: 'from-amber-950/60 via-slate-900/80 to-[#0b0f19]',
    borderColor: 'border-amber-500/30',
    currentBill: 750.00,
    nextBill: 750.00,
    limitTotal: 20000.00,
    limitUsed: 1500.00,
    categories: [
      { icon: '✈️', category: 'Viagens & Hospedagem', amount: 500.00 },
      { icon: '🎬', category: 'Ingressos & Lazer', amount: 250.00 }
    ]
  }
];

const MOCK_CARD_RANKING = [
  { icon: '🛒', category: 'Supermercado & Feira', amount: 1450.00, percentage: 37.8, color: '#00ff87' },
  { icon: '🍕', category: 'Restaurantes & Delivery', amount: 820.00, percentage: 21.3, color: '#10b981' },
  { icon: '✈️', category: 'Viagens & Lazer', amount: 750.00, percentage: 19.5, color: '#059669' },
  { icon: '🚗', category: 'Combustível & Transportes', amount: 430.00, percentage: 11.2, color: '#047857' },
  { icon: '🎬', category: 'Assinaturas & Streaming', amount: 390.50, percentage: 10.2, color: '#064e3b' }
];

const MOCK_CARD_RANKING_FILTERED = [
  { icon: '🛒', category: 'Supermercado & Feira', amount: 850.00, percentage: 44.7, color: '#00ff87' },
  { icon: '🍕', category: 'Restaurantes & Delivery', amount: 550.00, percentage: 28.9, color: '#10b981' },
  { icon: '🚗', category: 'Combustível & Transportes', amount: 300.00, percentage: 15.8, color: '#059669' },
  { icon: '🎬', category: 'Assinaturas & Streaming', amount: 200.00, percentage: 10.6, color: '#047857' }
];

export default function CardsModule({ cards: cardsProp = [] }) {
  // Sincronização direta com a Central de Controle (props)
  const activeCards = (cardsProp && cardsProp.length > 0) ? cardsProp : DEFAULT_FALLBACK_CARDS;

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

  // Verificação de Filtros Ativos
  const isCartoesTotalFiltered = Boolean(cartoesTotalRange.start && cartoesTotalRange.end);
  const isEntradasFiltered = Boolean(entradasRange.start && entradasRange.end);
  const isSaidasFiltered = Boolean(saidasRange.start && saidasRange.end);
  const isComprometimentoFiltered = Boolean(selectedComprometimentoMonth);
  const isRankingCartoesFiltered = Boolean(rankingCartoesRange.start && rankingCartoesRange.end);

  // Título Dinâmico em Português
  const getComprometimentoMonthTitle = () => {
    if (!selectedComprometimentoMonth) {
      return 'Faturas do mês de Agosto';
    }
    const rawMonth = selectedComprometimentoMonth.toLocaleDateString('pt-BR', { month: 'long' });
    const capitalizedMonth = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
    return `Faturas do mês de ${capitalizedMonth}`;
  };

  // Somatório das faturas atuais dos cartões reais
  const sumCurrentBills = activeCards.reduce((acc, c) => acc + (c.currentBill !== undefined ? c.currentBill : (c.limitUsed ? c.limitUsed * 0.48 : 0)), 0);
  const sumNextBills = activeCards.reduce((acc, c) => acc + (c.nextBill !== undefined ? c.nextBill : (c.limitUsed ? c.limitUsed * 0.52 : 0)), 0);

  // Valorações Reativas
  const totalGastoCartoes = isCartoesTotalFiltered ? 1900.00 : (sumCurrentBills || 3840.50);
  const totalEntradas = isEntradasFiltered ? 6800.00 : 13500.00;
  const totalSaidas = isSaidasFiltered ? 3250.00 : 8250.00;

  const faturasVigente = isComprometimentoFiltered ? 2450.00 : (sumCurrentBills || 3840.50);
  const faturasProximo = isComprometimentoFiltered ? 2100.00 : (sumNextBills || 4120.00);
  const comprometidoVigentePercent = ((faturasVigente / totalEntradas) * 100).toFixed(1);
  const comprometidoProximoPercent = ((faturasProximo / totalEntradas) * 100).toFixed(1);

  const rankingData = isRankingCartoesFiltered ? MOCK_CARD_RANKING_FILTERED : MOCK_CARD_RANKING;
  const rankingTotal = rankingData.reduce((acc, curr) => acc + curr.amount, 0);

  // Formatação BRL
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">

      {/* ==========================================
          1. TOPO (MÉTRICAS GLOBAIS - REORDENADO)
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
            <p className="text-[11px] text-[#64748b] font-mono mt-2">
              {isCartoesTotalFiltered ? 'Filtro por período ativado' : `Soma de ${activeCards.length} cartão(ões) ativos`}
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
            <h3 className="text-3xl font-extrabold text-[#00ff87] tracking-tight">
              {formatBRL(totalEntradas)}
            </h3>
            <p className="text-[11px] text-[#64748b] font-mono mt-2">
              {isEntradasFiltered ? 'Entradas filtradas' : 'Receita sólida mensal cadastrada'}
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
            <h3 className="text-3xl font-extrabold text-red-400 tracking-tight">
              {formatBRL(totalSaidas)}
            </h3>
            <p className="text-[11px] text-[#64748b] font-mono mt-2">
              {isSaidasFiltered ? 'Saídas filtradas' : 'Despesas totais fixas e variáveis'}
            </p>
          </div>
        </div>

      </div>


      {/* ==========================================
          2. ANÁLISE DE COMPROMETIMENTO DE RENDA
         ========================================== */}
      <div className="glass-card p-6 rounded-3xl border border-[#192234] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#192234] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Análise de Comprometimento de Renda</h3>
              <p className="text-xs text-[#64748b]">Impacto direto das faturas na receita mensal</p>
            </div>
          </div>

          {/* Seletor de Mês Único (VisualMonthPicker) */}
          <VisualMonthPicker 
            selectedMonth={selectedComprometimentoMonth} 
            onSelectMonth={(date) => setSelectedComprometimentoMonth(date)}
            onReset={() => setSelectedComprometimentoMonth(null)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Card Principal: Interpolação Dinâmica "Faturas do mês de [Nome do Mês]" */}
          <div className={`${isComprometimentoFiltered ? 'lg:col-span-12' : 'lg:col-span-7'} p-6 rounded-2xl bg-[#0e1422] border border-[#00ff87]/30 space-y-3 relative overflow-hidden glow-neon-subtle transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">
                {getComprometimentoMonthTitle()}
              </span>
              <span className="text-xs font-mono font-bold text-black bg-[#00ff87] px-3 py-1 rounded-full shadow-[0_0_12px_rgba(0,255,135,0.4)]">
                {comprometidoVigentePercent}% da renda comprometida
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h4 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
                {formatBRL(faturasVigente)}
              </h4>
              <span className="text-xs text-[#64748b] font-mono">/ {formatBRL(totalEntradas)}</span>
            </div>

            <div className="w-full h-3 bg-[#121927] rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-[#00ff87] to-[#10b981] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(comprometidoVigentePercent, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Projeção Mês Seguinte */}
          {!isComprometimentoFiltered && (
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0e1422] border border-[#192234] space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Projeção Mês Seguinte</span>
                <span className="text-xs font-mono font-bold text-[#00ff87] bg-[#00ff87]/10 px-2.5 py-0.5 rounded-full border border-[#00ff87]/20">
                  {comprometidoProximoPercent}% previsto
                </span>
              </div>

              <h4 className="text-2xl sm:text-3xl font-bold text-white font-display">
                {formatBRL(faturasProximo)}
              </h4>

              <p className="text-xs text-[#64748b] font-mono">
                Projeção calculada com base nos limites e parcelas
              </p>
            </div>
          )}

        </div>
      </div>


      {/* ==========================================
          3. GRID VISUAL DE CARTÕES (A PEÇA CENTRAL)
         ========================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-white">Cartões Físicos & Virtuais</h3>
            <p className="text-xs text-[#64748b]">Gestão individual de limites e faturas por cartão</p>
          </div>
          <span className="text-xs font-mono text-[#00ff87] bg-[#00ff87]/10 px-2.5 py-1 rounded-full font-bold">
            {activeCards.length} Cartões Ativos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCards.map((card) => {
            const isExpanded = Boolean(expandedCards[card.id]);
            const limitTotal = card.limitTotal || 10000;
            const limitUsed = card.limitUsed !== undefined ? card.limitUsed : 0;
            const currentBill = card.currentBill !== undefined ? card.currentBill : (limitUsed * 0.48 || 0);
            const nextBill = card.nextBill !== undefined ? card.nextBill : (limitUsed * 0.52 || 0);
            const limitPercentage = limitTotal > 0 ? ((limitUsed / limitTotal) * 100).toFixed(1) : '0.0';
            const categoriesList = card.categories || [
              { icon: '🛒', category: 'Compras do Mês', amount: limitUsed * 0.6 || 0 },
              { icon: '🎬', category: 'Assinaturas & Lazer', amount: limitUsed * 0.4 || 0 }
            ];

            return (
              <div 
                key={card.id}
                className="glass-card rounded-3xl border border-[#192234] bg-[#0b0f19] p-6 flex flex-col justify-between space-y-5 relative group hover:border-[#00ff87]/50 transition-all shadow-xl"
              >
                {/* Cabeçalho do Cartão com Imagem PNG Real */}
                <div className="flex items-center justify-between border-b border-[#192234] pb-4">
                  <div className="flex items-center gap-3.5">
                    <CardVisual 
                      image={card.image} 
                      cardName={card.name} 
                      digits={card.digits} 
                      variant="badge" 
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{card.name}</h4>
                      <span className="text-[11px] font-mono text-[#94a3b8]">{card.digits || '•••• ????'}</span>
                    </div>
                  </div>
                  <Sparkles size={16} className="text-[#00ff87] opacity-80" />
                </div>

                {/* Informação Principal de Faturas */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-bold block mb-1">Fatura Atual</span>
                    <h3 className="text-3xl font-extrabold text-white font-display">
                      {formatBRL(currentBill)}
                    </h3>
                  </div>

                  <div className="p-3 rounded-xl bg-[#070b12]/60 border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[#94a3b8]">Próximo Mês:</span>
                    <span className="font-mono font-bold text-[#00ff87]">{formatBRL(nextBill)}</span>
                  </div>

                  {/* Barra de Limite Usado */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-[#64748b]">
                      <span>Limite Usado: {formatBRL(limitUsed)}</span>
                      <span>{limitPercentage}% do limite</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#121927] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00ff87] rounded-full transition-all"
                        style={{ width: `${Math.min(parseFloat(limitPercentage), 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#64748b] pt-0.5">
                      <span>Limite Total: {formatBRL(limitTotal)}</span>
                      {card.dueDay && <span>Vence dia {card.dueDay}</span>}
                    </div>
                  </div>
                </div>

                {/* Botão Accordion Ver Categorias */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(card.id)}
                    className="w-full py-2 px-3 rounded-xl bg-[#070b12]/80 border border-white/10 hover:border-[#00ff87]/40 text-xs font-semibold text-white flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>{isExpanded ? 'Ocultar Gastos' : 'Ver Categorias de Gastos'}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-[#00ff87]" /> : <ChevronDown size={16} />}
                  </button>

                  {/* Lista Deslizante de Categorias */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-fadeIn">
                      {categoriesList.map((cat, cIdx) => (
                        <div key={cIdx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#0e1422]/90 border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{cat.icon}</span>
                            <span className="text-[#94a3b8] truncate font-medium">{cat.category}</span>
                          </div>
                          <span className="font-mono font-bold text-white">{formatBRL(cat.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>


      {/* ==========================================
          4. RANKING GLOBAL DE GASTOS EM CARTÕES
         ========================================== */}
      <div className="glass-card p-6 rounded-2xl border border-[#192234] space-y-4">
        <div className="flex items-center justify-between border-b border-[#192234] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Ranking Global de Gastos em Cartões</h4>
              <p className="text-xs text-[#64748b]">Consolidação de todas as categorias faturadas no período</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-extrabold text-[#00ff87]">
              {formatBRL(rankingTotal)}
            </span>
            <VisualDateRangePicker 
              startDate={rankingCartoesRange.start} 
              endDate={rankingCartoesRange.end} 
              onApplyRange={(start, end) => setRankingCartoesRange({ start, end })}
              onReset={() => setRankingCartoesRange({ start: null, end: null })}
            />
          </div>
        </div>

        <div className="space-y-4">
          {rankingData.map((item, idx) => (
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

    </div>
  );
}
