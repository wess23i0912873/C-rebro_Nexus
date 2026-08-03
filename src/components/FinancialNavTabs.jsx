import React from 'react';
import { LayoutDashboard, CreditCard, Edit3 } from 'lucide-react';

export default function FinancialNavTabs({ activeSubTab, setActiveSubTab }) {
  const tabs = [
    {
      id: 'dashline',
      label: 'Dashline',
      icon: LayoutDashboard,
      status: null,
      description: 'Painel Analítico'
    },
    {
      id: 'cartoes',
      label: 'Cartões',
      icon: CreditCard,
      status: null,
      description: 'Faturas e Limites'
    },
    {
      id: 'preenchimento',
      label: 'Preenchimento',
      icon: Edit3,
      status: null,
      description: 'Lançamentos e Gestão'
    }
  ];

  return (
    <div className="border-b border-[#192234] bg-[#080c14]/80 backdrop-blur-md px-8 py-3 flex items-center justify-between sticky top-20 z-10">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30 shadow-[0_0_15px_rgba(0,255,135,0.15)] font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#101625] border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#00ff87]' : 'text-[#64748b]'} />
              <span>{tab.label}</span>
              {tab.status && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#192234] text-[#64748b] font-normal uppercase">
                  {tab.status}
                </span>
              )}
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
