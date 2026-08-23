import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Calendar, DollarSign, Landmark } from 'lucide-react';

export default function ConfirmPaymentModal({ transaction, bankAccounts = [], onConfirm, onClose }) {
  const today = new Date().toISOString().split('T')[0];

  const [paymentDate, setPaymentDate] = useState(today);
  const [paidValue, setPaidValue] = useState(transaction.value !== undefined ? transaction.value : '');
  const [selectedAccountId, setSelectedAccountId] = useState(transaction.accountId || bankAccounts[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState('');

  const numericPaidValue = parseFloat(paidValue) || 0;
  const originalValue = transaction.value || 0;
  const remainingValue = originalValue - numericPaidValue;

  const isTotal = numericPaidValue >= originalValue;
  const isPartial = numericPaidValue > 0 && numericPaidValue < originalValue;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!paymentDate) {
      setErrorMsg('Por favor, informe a Data do Pagamento.');
      return;
    }

    if (isNaN(numericPaidValue) || numericPaidValue <= 0) {
      setErrorMsg('Por favor, informe um Valor Pago válido e maior que zero.');
      return;
    }

    onConfirm(transaction, {
      paymentDate,
      paidValue: numericPaidValue,
      accountId: selectedAccountId
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0b0f19] border border-[#192234] rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,255,135,0.2)] text-left space-y-5">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#192234]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ff87]/15 border border-[#00ff87]/30 text-[#00ff87] flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Confirmar Pagamento</h3>
              <p className="text-xs text-[#94a3b8]">Baixa de conta em Lembretes de Pagamento</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748b] hover:text-white hover:bg-[#121927] transition-colors cursor-pointer"
            title="Fechar Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumo da Conta Pendente */}
        <div className="p-3.5 rounded-2xl bg-[#0d1320] border border-amber-500/30 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">
              Conta Pendente
            </span>
            <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
              {transaction.payee || transaction.description || 'Lançamento'}
            </h4>
            {transaction.product && (
              <span className="text-[10px] text-[#94a3b8] block">{transaction.product}</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#94a3b8] block">Valor Original</span>
            <span className="text-sm font-black font-mono text-amber-400">
              {formatCurrency(originalValue)}
            </span>
          </div>
        </div>

        {/* Mensagem de Erro (se houver) */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário de Confirmação */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. DATA DO PAGAMENTO */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} className="text-[#00ff87]" />
              Data do Pagamento
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => {
                setPaymentDate(e.target.value);
                setErrorMsg('');
              }}
              className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs font-mono text-white focus:outline-none focus:border-[#00ff87] transition-all"
            />
          </div>

          {/* 2. VALOR PAGO (R$) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={12} className="text-[#00ff87]" />
                Valor Pago (R$)
              </label>
              <button
                type="button"
                onClick={() => {
                  setPaidValue(originalValue);
                  setErrorMsg('');
                }}
                className="text-[10px] text-[#00ff87] hover:underline font-semibold cursor-pointer"
              >
                Usar valor total
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold font-mono text-[#00ff87] pointer-events-none">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={paidValue}
                onChange={(e) => {
                  setPaidValue(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="0.00"
                className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl pl-9 pr-3 text-xs font-bold font-mono text-white placeholder-[#475569] focus:outline-none focus:border-[#00ff87] transition-all"
              />
            </div>
          </div>

          {/* 3. CONTA DE DÉBITO */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
              <Landmark size={12} className="text-[#00ff87]" />
              Debitar da Conta
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full h-10 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs font-medium text-white focus:outline-none focus:border-[#00ff87] transition-all cursor-pointer"
            >
              {bankAccounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-[#0b0f19] text-white">
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* BADGE EXPLICATIVO (Total vs Parcial) */}
          <div className="pt-1">
            {isTotal ? (
              <div className="p-3 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>
                  <strong>Quitação Total:</strong> A conta será alterada para <strong>Pago</strong> e removida dos lembretes pendentes.
                </span>
              </div>
            ) : isPartial ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-400" />
                <span>
                  <strong>Pagamento Parcial:</strong> Restará <strong>{formatCurrency(remainingValue)}</strong> no lembrete. A parcela de <strong>{formatCurrency(numericPaidValue)}</strong> será lançada no extrato como Pago.
                </span>
              </div>
            ) : null}
          </div>

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#192234]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#121927] border border-[#192234] text-xs font-bold text-[#94a3b8] hover:text-white hover:bg-[#182236] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00ff87] text-black text-xs font-bold shadow-[0_0_20px_rgba(0,255,135,0.35)] hover:bg-[#26ff98] transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} strokeWidth={2.5} />
              <span>Confirmar Pagamento</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
