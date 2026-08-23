import React from 'react';
import { LayoutDashboard, CreditCard, Edit3, Calculator, Settings2 } from 'lucide-react';

export default function FinancialNavTabs({ activeSubTab, setActiveSubTab }) {
  const tabs = [
    { id: 'dashline',          label: 'Dashline',            icon: LayoutDashboard, color: 'green',  description: 'Painel Analítico' },
    { id: 'cartoes',           label: 'Cartões',             icon: CreditCard,      color: 'green',  description: 'Faturas e Limites' },
    { id: 'preenchimento',     label: 'Preenchimento',       icon: Edit3,           color: 'green',  description: 'Lançamentos e Gestão' },
    { id: 'simulacoes',        label: 'Simulações',          icon: Calculator,      color: 'purple', description: 'Impacto de Compras' },
    { id: 'centraldecontrole', label: 'Central de Controle', icon: Settings2,       color: 'amber',  description: 'Gestão Master' },
  ];

  const getActiveStyle = (tab) => {
    if (tab.color === 'purple') return 'bg-purple-500/10 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] font-bold';
    if (tab.color === 'amber')  return 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-bold';
    return 'bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30 shadow-[0_0_15px_rgba(0,255,135,0.15)] font-bold';
  };

  const getActiveIconStyle = (tab) => {
    if (tab.color === 'purple') return 'text-purple-400';
    if (tab.color === 'amber')  return 'text-amber-400';
    return 'text-[#00ff87]';
  };

  return (
    <div className="border-b border-[#192234] bg-[#080c14]/80 backdrop-blur-md px-8 py-3 flex items-center justify-between sticky top-20 z-10">
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? getActiveStyle(tab)
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#101625] border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? getActiveIconStyle(tab) : 'text-[#64748b]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="hidden md:flex items-center gap-2 text-[11px] text-[#475569] font-mono">
        <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse"></span>
        <span>Visão Módulo Financeiro v2.0</span>
      </div>
    </div>
  );
}
