import React from 'react';
import { Landmark, Wallet, Plus } from 'lucide-react';

export default function BankAccounts({ bankAccounts = [], onAddAccountClick }) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  // Obter cores personalizadas baseadas no nome ou tipo da conta
  const getAccountStyles = (name) => {
    const n = name.toLowerCase();
    if (n.includes('nubank')) {
      return {
        bg: 'from-purple-600/10 to-purple-800/5',
        border: 'border-purple-500/15',
        badge: 'bg-purple-500/10 text-purple-400',
        iconBg: 'bg-purple-500/15 text-purple-400'
      };
    }
    if (n.includes('itaú') || n.includes('itau')) {
      return {
        bg: 'from-orange-600/10 to-orange-800/5',
        border: 'border-orange-500/15',
        badge: 'bg-orange-500/10 text-orange-400',
        iconBg: 'bg-orange-500/15 text-orange-400'
      };
    }
    if (n.includes('carteira') || n.includes('dinheiro') || n.includes('físico') || n.includes('fisico')) {
      return {
        bg: 'from-emerald-600/10 to-emerald-800/5',
        border: 'border-emerald-500/15',
        badge: 'bg-emerald-500/10 text-emerald-400',
        iconBg: 'bg-emerald-500/15 text-emerald-400'
      };
    }
    // Padrão
    return {
      bg: 'from-indigo-600/10 to-indigo-800/5',
      border: 'border-indigo-500/15',
      badge: 'bg-indigo-500/10 text-indigo-400',
      iconBg: 'bg-indigo-500/15 text-indigo-400'
    };
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[#1e293b] flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h4 className="font-display font-bold text-sm text-white">Nossas Contas</h4>
          <p className="text-[10px] text-[#475569]">Saldos individuais ativos</p>
        </div>
        <button 
          onClick={onAddAccountClick}
          className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#172033] border border-white/5 transition-colors cursor-pointer"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {bankAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#475569]">
            <Wallet size={32} className="mb-2 opacity-50" />
            <p className="text-xs">Nenhuma conta cadastrada</p>
          </div>
        ) : (
          bankAccounts.map((account) => {
            const styles = getAccountStyles(account.name);
            const Icon = account.type === 'wallet' ? Wallet : Landmark;

            return (
              <div 
                key={account.id} 
                className={`p-4 rounded-xl border ${styles.border} bg-gradient-to-r ${styles.bg} transition-all duration-300 hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">{account.name}</h5>
                      <span className="text-[9px] text-[#475569] capitalize">{account.type}</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded ${styles.badge}`}>
                    Ativa
                  </span>
                </div>
                <div className="flex justify-between items-baseline mt-3">
                  <span className="text-[9px] text-[#475569]">Saldo Disponível</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#1e293b] text-[10px] text-[#475569]">
        Saldos vinculados aos lançamentos do Cérebro Nexus
      </div>
    </div>
  );
}
