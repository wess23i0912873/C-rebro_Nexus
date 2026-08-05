import React from 'react';
import { TrendingUp, TrendingDown, Landmark, Percent } from 'lucide-react';

export default function SummaryCards({ transactions = [], bankAccounts = [] }) {
  // Obter o nome do mês atual formatado dinamicamente (ex: "Agosto")
  const rawMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const formattedMonth = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);

  // Calcular saldos somando as contas
  const totalBalance = bankAccounts.reduce((acc, account) => acc + account.balance, 0);
  
  // Calcular entradas (receitas)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + parseFloat(t.value || 0), 0);

  // Calcular saídas (despesas)
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + parseFloat(t.value || 0), 0);

  // Taxa de Economia
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const cards = [
    {
      title: 'Saldo Geral',
      value: totalBalance,
      icon: Landmark,
      color: 'from-[#00ff87]/10 to-emerald-950/20',
      borderColor: 'border-[#00ff87]/20',
      iconColor: 'text-[#00ff87]',
      description: `Soma de todas as contas - Mês de ${formattedMonth}`,
      isCurrency: true
    },
    {
      title: 'Total de Entradas',
      value: totalIncome,
      icon: TrendingUp,
      color: 'from-emerald-500/10 to-emerald-950/20',
      borderColor: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      description: `Faturamento total - Mês de ${formattedMonth}`,
      isCurrency: true
    },
    {
      title: 'Total de Saídas',
      value: totalExpense,
      icon: TrendingDown,
      color: 'from-rose-500/10 to-rose-950/20',
      borderColor: 'border-rose-500/20',
      iconColor: 'text-rose-400',
      description: `Despesas registradas - Mês de ${formattedMonth}`,
      isCurrency: true
    },
    {
      title: 'Taxa de Economia',
      value: savingsRate,
      icon: Percent,
      color: 'from-cyan-500/10 to-cyan-950/20',
      borderColor: 'border-cyan-500/20',
      iconColor: 'text-cyan-400',
      description: `Saldo líquido poupado - Mês de ${formattedMonth}`,
      isCurrency: false
    }
  ];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div 
            key={i} 
            className={`p-5 rounded-2xl border ${card.borderColor} bg-[#0b0f19] bg-gradient-to-br ${card.color} shadow-lg hover:border-[#00ff87]/40 transition-all duration-300`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-black font-mono mt-1.5 text-white">
                  {card.isCurrency ? formatCurrency(card.value) : `${card.value.toFixed(1)}%`}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl bg-[#080b11]/80 ${card.iconColor} border border-[#192234]`}>
                <Icon size={20} />
              </div>
            </div>
            <p className="text-xs text-[#94a3b8] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87]" />
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
