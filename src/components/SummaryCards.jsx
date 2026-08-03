import React from 'react';
import { TrendingUp, TrendingDown, Landmark, Percent } from 'lucide-react';

export default function SummaryCards({ transactions = [], bankAccounts = [] }) {
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
      color: 'from-indigo-500/10 to-indigo-600/5',
      borderColor: 'border-indigo-500/15',
      iconColor: 'text-indigo-400',
      description: 'Soma de todas as contas',
      isCurrency: true
    },
    {
      title: 'Total de Entradas',
      value: totalIncome,
      icon: TrendingUp,
      color: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-500/15',
      iconColor: 'text-emerald-400',
      description: 'Faturamento total',
      isCurrency: true
    },
    {
      title: 'Total de Saídas',
      value: totalExpense,
      icon: TrendingDown,
      color: 'from-rose-500/10 to-rose-600/5',
      borderColor: 'border-rose-500/15',
      iconColor: 'text-rose-400',
      description: 'Despesas registradas',
      isCurrency: true
    },
    {
      title: 'Taxa de Economia',
      value: savingsRate,
      icon: Percent,
      color: 'from-cyan-500/10 to-cyan-600/5',
      borderColor: 'border-cyan-500/15',
      iconColor: 'text-cyan-400',
      description: 'Saldo liquido poupado',
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
            className={`glass-panel p-5 rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.color} glow-card`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold font-display mt-1.5 text-white">
                  {card.isCurrency ? formatCurrency(card.value) : `${card.value.toFixed(1)}%`}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl bg-[#080b11]/60 ${card.iconColor} border border-white/5`}>
                <Icon size={20} />
              </div>
            </div>
            <p className="text-[10px] text-[#475569] font-medium">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
