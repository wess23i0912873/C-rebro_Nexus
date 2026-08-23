import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import ConfirmPaymentModal from './ConfirmPaymentModal';

export default function PaymentReminders({ 
  transactions = [], 
  bankAccounts = [],
  onUpdateStatus,
  onConfirmPayment 
}) {
  const [confirmingTx, setConfirmingTx] = useState(null);

  // Filtrar apenas lançamentos que possuem o status "A pagar" / "pending"
  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const handleOpenConfirmModal = (tx) => {
    setConfirmingTx(tx);
  };

  const handleConfirm = (tx, paymentDetails) => {
    if (onConfirmPayment) {
      onConfirmPayment(tx, paymentDetails);
    } else if (onUpdateStatus) {
      onUpdateStatus(tx.id, 'paid');
    }
    setConfirmingTx(null);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#0b0f19] border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.08)] flex flex-col space-y-4 w-full animate-fade-in relative">
      
      {/* Modal de Confirmação de Pagamento */}
      {confirmingTx && (
        <ConfirmPaymentModal
          transaction={confirmingTx}
          bankAccounts={bankAccounts}
          onClose={() => setConfirmingTx(null)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Cabeçalho do Painel Lateral */}
      <div className="flex items-center justify-between pb-3 border-b border-[#192234]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Lembretes de Pagamento</h4>
            <p className="text-[10px] text-[#94a3b8]">Contas pendentes para quitar</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] border border-amber-500/30">
          {pendingTransactions.length}
        </span>
      </div>

      {/* Lista de Cards de Lembretes Pendentes */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
        {pendingTransactions.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0d1320] border border-[#192234] text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#00ff87]/10 text-[#00ff87] flex items-center justify-center mx-auto">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-semibold text-white">Tudo em dia!</p>
            <p className="text-[11px] text-[#64748b]">Nenhum pagamento pendente no momento.</p>
          </div>
        ) : (
          pendingTransactions.map((t) => (
            <div 
              key={t.id} 
              className="p-4 rounded-2xl bg-[#0d1320] border border-amber-500/40 hover:border-amber-500/70 transition-all flex flex-col space-y-2.5 shadow-md"
            >
              {/* Nome do Beneficiário / Produto */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-white leading-snug">
                    {t.payee || t.description || 'Lançamento Pendente'}
                  </h5>
                  {t.product && (
                    <span className="text-[10px] text-[#94a3b8] block mt-0.5">
                      {t.product}
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  A Pagar
                </span>
              </div>

              {/* Data e Valor em Destaque Forte */}
              <div className="flex items-center justify-between pt-1 border-t border-[#192234]/60">
                <span className="text-[11px] font-mono text-[#94a3b8] flex items-center gap-1">
                  <AlertCircle size={12} className="text-amber-400" />
                  Vence: {formatDate(t.date)}
                </span>
                <span className="text-sm font-black font-mono text-amber-400">
                  {formatCurrency(t.value)}
                </span>
              </div>

              {/* Botão de Ação Rápida: Marcar como Pago */}
              <button
                type="button"
                onClick={() => handleOpenConfirmModal(t)}
                className="w-full py-2 px-3 rounded-xl bg-[#00ff87] text-black font-bold text-xs shadow-[0_0_15px_rgba(0,255,135,0.3)] hover:bg-[#26ff98] hover:shadow-[0_0_20px_rgba(0,255,135,0.5)] flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
              >
                <CheckCircle2 size={14} strokeWidth={2.5} />
                <span>Marcar como Pago</span>
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

