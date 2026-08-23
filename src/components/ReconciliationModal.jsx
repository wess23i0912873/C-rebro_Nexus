import React, { useState } from 'react';
import { 
  Scale, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Sparkles, 
  Wallet,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import BankIcon from './BankIcon';
import CurrencyInput from './CurrencyInput';

export default function ReconciliationModal({
  isOpen,
  onClose,
  bankAccounts = [],
  onAddTransaction,
  onEditAccount
}) {
  // Guarda os saldos reais digitados pelo usuário para cada conta { [accId]: string|number }
  const [realBalances, setRealBalances] = useState({});
  const [adjustedAccounts, setAdjustedAccounts] = useState({}); // { [accId]: boolean }
  const [transferTargets, setTransferTargets] = useState({}); // { [accId]: targetAccId }

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const handleRealBalanceChange = (accId, value) => {
    setRealBalances(prev => ({ ...prev, [accId]: value }));
    // Limpa estado de ajustado se o usuário mudar o valor
    if (adjustedAccounts[accId]) {
      setAdjustedAccounts(prev => ({ ...prev, [accId]: false }));
    }
  };

  // 1. Executa o ajuste direto como Entrada ou Saída externa
  const handleAutoAdjust = (account, diff) => {
    if (Math.abs(diff) < 0.01) return;

    const isIncome = diff > 0;
    const diffValue = Math.abs(diff);
    const today = new Date().toISOString().split('T')[0];

    const adjustmentTransaction = {
      date: today,
      type: isIncome ? 'income' : 'expense',
      category: 'Ajuste de Conciliação',
      accountId: account.id,
      payee: 'Ajuste de Saldo Bancário',
      product: `Ajuste automático de conciliação (${account.name})`,
      value: diffValue,
      status: 'paid',
      origin: 'reconciliation'
    };

    if (onAddTransaction) {
      onAddTransaction(adjustmentTransaction);
    }

    setAdjustedAccounts(prev => ({ ...prev, [account.id]: true }));
  };

  // 2. Executa o ajuste como Transferência entre Contas (Sem poluir os gráficos de receita/despesa)
  const handleTransferAdjust = (account, diff) => {
    if (Math.abs(diff) < 0.01) return;

    const diffValue = Math.abs(diff);
    const today = new Date().toISOString().split('T')[0];
    const otherAccounts = bankAccounts.filter(a => a.id !== account.id);
    const selectedOtherId = transferTargets[account.id] || otherAccounts[0]?.id;
    const otherAccount = bankAccounts.find(a => a.id === selectedOtherId);

    if (!otherAccount) return;

    // Se diff > 0: o dinheiro sobrou aqui -> veio do outro banco (Origem: outro, Destino: atual)
    // Se diff < 0: o dinheiro faltou aqui -> foi para o outro banco (Origem: atual, Destino: outro)
    const isReceiving = diff > 0;
    const originAccountId = isReceiving ? otherAccount.id : account.id;
    const destinationAccountId = isReceiving ? account.id : otherAccount.id;
    const originAcc = isReceiving ? otherAccount : account;
    const destAcc = isReceiving ? account : otherAccount;

    const transferTransaction = {
      date: today,
      type: 'transfer',
      category: 'Transferência',
      accountId: originAccountId,
      destinationAccountId: destinationAccountId,
      payee: `Transferência: ${originAcc.name} ➔ ${destAcc.name}`,
      product: 'Conciliação bancária via transferência',
      value: diffValue,
      status: 'paid',
      origin: 'reconciliation'
    };

    if (onAddTransaction) {
      onAddTransaction(transferTransaction);
    }

    setAdjustedAccounts(prev => ({ ...prev, [account.id]: true }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#080c14] border border-[#192234] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(0,255,135,0.15)] space-y-6 max-h-[92vh] flex flex-col">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-[#192234] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00ff87]/15 border border-[#00ff87]/30 text-[#00ff87] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(0,255,135,0.2)]">
              <Scale size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Conciliação Bancária & Verificador de Divergências
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40">
                  Tempo Real
                </span>
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Compare o saldo calculado pelo Nexus com o saldo real do seu aplicativo bancário
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#121927] border border-[#192234] text-[#64748b] hover:text-white hover:border-red-500/40 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Contas Bancárias */}
        <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-1">
          {bankAccounts.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#0d1320] border border-[#192234] text-center space-y-2">
              <Wallet size={32} className="mx-auto text-[#64748b]" />
              <p className="text-sm font-bold text-white">Nenhuma conta bancária cadastrada</p>
              <p className="text-xs text-[#94a3b8]">
                Cadastre suas contas bancárias na Central de Controle antes de realizar a conciliação.
              </p>
            </div>
          ) : (
            bankAccounts.map((account) => {
              const nexusBalance = parseFloat(account.balance) || 0;
              const rawInput = realBalances[account.id];
              const hasTyped = rawInput !== undefined && rawInput !== null && String(rawInput).trim() !== '';
              const realBalance = hasTyped ? (parseFloat(rawInput) || 0) : nexusBalance;
              const diff = Math.round((realBalance - nexusBalance) * 100) / 100;
              const isAdjusted = adjustedAccounts[account.id];
              const isMatch = hasTyped && Math.abs(diff) < 0.01;

              const otherAccounts = bankAccounts.filter(a => a.id !== account.id);
              const selectedOtherId = transferTargets[account.id] || otherAccounts[0]?.id;
              const selectedTargetAcc = otherAccounts.find(a => a.id === selectedOtherId);

              return (
                <div 
                  key={account.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isMatch || isAdjusted
                      ? 'bg-[#00ff87]/5 border-[#00ff87]/40 shadow-[0_0_20px_rgba(0,255,135,0.1)]'
                      : hasTyped && diff !== 0
                        ? diff < 0 
                          ? 'bg-rose-500/5 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                          : 'bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                        : 'bg-[#0d1320] border-[#192234]'
                  }`}
                >
                  {/* Linha Principal da Conta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Identidade do Banco */}
                    <div className="flex items-center gap-3.5">
                      <BankIcon src={account.icon || account.image} bankName={account.name} size="lg" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{account.name}</h4>
                        <p className="text-xs text-[#94a3b8]">
                          Saldo no Nexus: <strong className="text-white font-mono">{formatBRL(nexusBalance)}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Campo de Digitação do Saldo Real */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <label className="block text-[10px] uppercase font-bold text-[#94a3b8] mb-1">
                          Saldo Real no App do Banco
                        </label>
                        <CurrencyInput
                          placeholder="0,00"
                          value={realBalances[account.id] !== undefined ? realBalances[account.id] : ''}
                          onChange={(e) => handleRealBalanceChange(account.id, e.target.value)}
                          className="w-36 h-9 rounded-xl bg-[#121927] border border-[#192234] text-xs font-mono font-bold text-white focus:outline-none focus:border-[#00ff87] transition-all text-right"
                        />
                      </div>
                    </div>

                  </div>

                  {/* ALERTA DE DIVERGÊNCIA & OPÇÕES DE CORREÇÃO */}
                  {hasTyped && !isAdjusted && diff !== 0 && (
                    <div className="mt-4 pt-4 border-t border-[#192234] space-y-3 animate-fade-in">
                      
                      {/* Banner Explicativo */}
                      <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                        diff < 0 
                          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' 
                          : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      }`}>
                        <div className={`p-1.5 rounded-lg shrink-0 ${diff < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {diff < 0 ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold">
                            {diff < 0 
                              ? `Divergência: Faltam ${formatBRL(Math.abs(diff))} na conta ${account.name}` 
                              : `Divergência: Sobram ${formatBRL(diff)} na conta ${account.name}`}
                          </p>
                          <p className="text-[11px] opacity-80">
                            {diff < 0
                              ? 'O saldo real no banco é menor do que o calculado. Você transferiu para outro banco ou esqueceu uma despesa?'
                              : 'O saldo real no banco é maior do que o calculado. Você recebeu uma transferência de outro banco ou uma nova receita?'}
                          </p>
                        </div>
                      </div>

                      {/* DUAS OPÇÕES DE AJUSTE AUTOMÁTICO */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        
                        {/* OPÇÃO 1: TRANSFERÊNCIA ENTRE BANCOS (ISOLA GRÁFICOS) */}
                        {otherAccounts.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                  <ArrowLeftRight size={14} className="text-cyan-400" />
                                  <span>Transferência Entre Contas</span>
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                                  Neutro nos Gráficos
                                </span>
                              </div>

                              <div className="space-y-1 mt-2">
                                <label className="text-[10px] text-[#94a3b8] font-semibold block">
                                  {diff > 0 ? 'De qual banco saiu esse valor?' : 'Para qual banco foi esse valor?'}
                                </label>
                                <select
                                  value={transferTargets[account.id] || otherAccounts[0]?.id}
                                  onChange={(e) => setTransferTargets(prev => ({ ...prev, [account.id]: e.target.value }))}
                                  className="w-full h-8 bg-[#121927] border border-[#192234] rounded-lg px-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                                >
                                  {otherAccounts.map(oa => (
                                    <option key={oa.id} value={oa.id} className="bg-[#0b0f19] text-white">
                                      {oa.name} (Saldo: {formatBRL(oa.balance)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTransferAdjust(account, diff)}
                              className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                            >
                              <ArrowLeftRight size={13} strokeWidth={2.5} />
                              <span className="truncate">
                                {diff > 0 
                                  ? `Transferir: ${selectedTargetAcc?.name || 'Outro'} ➔ ${account.name}` 
                                  : `Transferir: ${account.name} ➔ ${selectedTargetAcc?.name || 'Outro'}`}
                              </span>
                            </button>
                          </div>
                        )}

                        {/* OPÇÃO 2: AJUSTE EXTERNO (ENTRADA / SAÍDA REAL) */}
                        <div className="p-3.5 rounded-2xl bg-[#121927] border border-[#192234] space-y-2.5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Zap size={14} className="text-[#00ff87]" />
                                <span>Entrada / Saída Externa</span>
                              </span>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/30 font-mono">
                                Ajuste Direto
                              </span>
                            </div>
                            <p className="text-[10px] text-[#94a3b8] mt-2">
                              {diff > 0 
                                ? 'Gera uma receita/rendimento externo no extrato geral' 
                                : 'Gera uma despesa/saída externa no extrato geral'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAutoAdjust(account, diff)}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#00ff87] hover:bg-[#26ff98] text-black font-bold text-xs shadow-[0_0_15px_rgba(0,255,135,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                          >
                            <Zap size={13} strokeWidth={2.5} />
                            <span>
                              Lançar Ajuste {diff < 0 ? `(-${formatBRL(Math.abs(diff))})` : `(+${formatBRL(diff)})`}
                            </span>
                          </button>
                        </div>

                      </div>

                      {/* Botão de Fechar / Manual */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={onClose}
                          className="text-xs text-[#94a3b8] hover:text-white underline cursor-pointer"
                        >
                          Vou procurar o erro manualmente
                        </button>
                      </div>

                    </div>
                  )}

                  {/* ESTADO CONCILIADO COM SUCESSO */}
                  {(isMatch || isAdjusted) && (
                    <div className="mt-3 pt-3 border-t border-[#00ff87]/20 flex items-center gap-2 text-xs font-bold text-[#00ff87] animate-fade-in">
                      <CheckCircle2 size={16} />
                      <span>Saldo 100% Conciliado e Bate com o Banco Real!</span>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="pt-3 border-t border-[#192234] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#64748b]">
            Dica: Realize a conciliação semanalmente para manter o controle absoluto.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#121927] border border-[#192234] text-xs font-bold text-white hover:border-[#00ff87]/40 transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
