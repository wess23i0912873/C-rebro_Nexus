import React from 'react';
import { 
  Wallet, 
  CheckSquare, 
  Tv, 
  Mic, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const menuItems = [
    {
      id: 'financas',
      label: 'Finanças',
      icon: Wallet,
      available: true,
      description: 'Dashline & Análise'
    },
    {
      id: 'rotina',
      label: 'Rotina & Kanban',
      icon: CheckSquare,
      available: false,
      description: 'Tarefas e organização'
    },
    {
      id: 'tv',
      label: 'Smart TV Panel',
      icon: Tv,
      available: false,
      description: 'Dashboard para sala'
    },
    {
      id: 'voz',
      label: 'Conexão Alexa',
      icon: Mic,
      available: false,
      description: 'Comandos por voz'
    }
  ];

  return (
    <aside className={`fixed top-0 bottom-0 left-0 glass-panel border-r border-[#192234] flex flex-col justify-between z-30 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className="flex flex-col flex-1 pt-6 overflow-y-auto overflow-x-hidden">
        {/* Header / Logo + Toggle Button */}
        <div className={`px-4 pb-6 border-b border-[#192234] flex items-center justify-between ${
          isCollapsed ? 'flex-col gap-4 px-2' : ''
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#00ff87] to-[#10b981] text-black shadow-lg shadow-[rgba(0,255,135,0.25)] flex items-center justify-center">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-display font-extrabold text-base text-white leading-tight truncate">Cérebro Nexus</h1>
                <span className="text-[10px] text-[#00ff87] font-mono tracking-widest uppercase font-semibold">Central Hub</span>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
            className="p-2 rounded-xl bg-[#0d1320] border border-[#192234] text-[#94a3b8] hover:text-[#00ff87] hover:border-[#00ff87]/40 transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-6 space-y-2 flex-1">
          {!isCollapsed && (
            <span className="px-2 text-[10px] font-semibold text-[#475569] uppercase tracking-wider block mb-3">
              Módulos
            </span>
          )}
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => item.available && setActiveTab(item.id)}
                disabled={!item.available}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-3.5' : 'justify-between px-3 py-3'
                } rounded-xl transition-all duration-200 group text-left relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#00ff87]/15 to-transparent text-white border-l-2 border-[#00ff87] font-medium shadow-[inset_0_0_12px_rgba(0,255,135,0.05)]' 
                    : item.available
                      ? 'text-[#94a3b8] hover:bg-[#0e1524] hover:text-white border-l-2 border-transparent'
                      : 'text-[#334155] cursor-not-allowed border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={`shrink-0 ${
                    isActive 
                      ? 'text-[#00ff87] drop-shadow-[0_0_8px_rgba(0,255,135,0.5)]' 
                      : item.available 
                        ? 'group-hover:text-[#00ff87] transition-colors' 
                        : 'text-[#334155]'
                  }`} />
                  
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <div className="text-sm truncate font-medium">{item.label}</div>
                      <span className="text-[10px] text-[#475569] block leading-none mt-0.5 group-hover:text-[#64748b] transition-colors truncate">
                        {item.description}
                      </span>
                    </div>
                  )}
                </div>
                
                {!isCollapsed && (
                  item.available ? (
                    <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity text-[#00ff87] ${isActive ? 'opacity-100' : ''}`} />
                  ) : (
                    <span className="text-[8px] bg-[#121927] text-[#475569] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Breve</span>
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Profile Info */}
      <div className={`p-4 border-t border-[#192234] bg-[#070b12]/90 flex items-center ${
        isCollapsed ? 'justify-center p-3' : 'gap-3'
      }`}>
        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#00ff87] to-[#10b981] flex items-center justify-center font-extrabold text-black text-xs shadow-md shadow-[rgba(0,255,135,0.2)] shrink-0">
          WN
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Wesley & Noiva</p>
              <p className="text-[10px] text-[#00ff87] font-mono truncate">Plano Casados 2026</p>
            </div>
            <button className="p-1.5 rounded-lg text-[#64748b] hover:text-[#00ff87] hover:bg-[#0d1320] transition-colors">
              <Settings size={16} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

