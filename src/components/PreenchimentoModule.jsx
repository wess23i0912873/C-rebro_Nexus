import React, { useState } from 'react';
import { Download, Edit3, CheckCircle2, Scale } from 'lucide-react';
import ImportStatementFlow from './ImportStatementFlow';
import SummaryCards from './SummaryCards';
import TransactionForm from './TransactionForm';
import TransactionTable from './TransactionTable';
import PaymentReminders from './PaymentReminders';
import ReconciliationModal from './ReconciliationModal';

export default function PreenchimentoModule({ 
  transactions, 
  bankAccounts, 
  categories = [],
  onAddTransaction, 
  onAddBatchTransactions, 
  onDeleteTransaction,
  onEditTransaction,
  onConfirmPayment,
  onUpdateStatus,
  onUpdateCategory
}) {
  // Sub-aba interna do Preenchimento: 'importar' (Padrão) vs 'manual'
  const [fillMode, setFillMode] = useState('importar');
  const [importNotification, setImportNotification] = useState(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  const handleImportSuccess = (newTransactions, bank) => {
    if (onAddBatchTransactions) {
      onAddBatchTransactions(newTransactions);
    } else if (onAddTransaction) {
      newTransactions.forEach(item => onAddTransaction(item));
    }

    setImportNotification({
      count: newTransactions.length,
      bankName: bank?.name || 'Banco'
    });

    setTimeout(() => {
      setImportNotification(null);
    }, 6000);
  };

  return (
    <div className="space-y-8">
      
      {/* SUB-MENU SUPERIOR CENTRALIZADO (ESTILO PÍLULA NEON) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2">
        <div className="inline-flex items-center gap-3 bg-[#080c14] p-2 rounded-2xl border border-[#192234] shadow-[0_0_25px_rgba(0,0,0,0.5)] max-w-full overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setFillMode('importar')}
            className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${
              fillMode === 'importar'
                ? 'bg-[#00ff87] text-black shadow-[0_0_25px_rgba(0,255,135,0.45)] scale-[1.02]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#101625]'
            }`}
          >
            <Download size={18} />
            <span>Preenchimento por extrato</span>
          </button>

          <button
            onClick={() => setFillMode('manual')}
            className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${
              fillMode === 'manual'
                ? 'bg-[#00ff87] text-black shadow-[0_0_25px_rgba(0,255,135,0.45)] scale-[1.02]'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#101625]'
            }`}
          >
            <Edit3 size={18} />
            <span>Preenchimento Manual</span>
          </button>
        </div>

        {/* Botão de Conciliação Rápida */}
        <button
          type="button"
          onClick={() => setIsReconcileOpen(true)}
          className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-[#00ff87]/15 border border-[#00ff87]/40 text-[#00ff87] font-bold text-xs hover:bg-[#00ff87]/25 hover:shadow-[0_0_20px_rgba(0,255,135,0.3)] transition-all cursor-pointer whitespace-nowrap group"
        >
          <Scale size={16} className="group-hover:rotate-12 transition-transform" />
          <span>Conciliar Saldos</span>
          <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
        </button>
      </div>

      {/* BANNER NOTIFICAÇÃO DE SUCESSO NA IMPORTAÇÃO */}
      {importNotification && (
        <div className="p-4 rounded-2xl bg-[#00ff87]/10 border border-[#00ff87]/40 text-[#00ff87] flex items-center justify-between shadow-[0_0_30px_rgba(0,255,135,0.15)] animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00ff87] text-black flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Importação Concluída com Sucesso!</h4>
              <p className="text-xs text-[#00ff87]">
                {importNotification.count} lançamentos do extrato do <strong>{importNotification.bankName}</strong> foram armazenados no sistema.
              </p>
            </div>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-xs text-[#94a3b8] hover:text-white underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* CONTEÚDO DINÂMICO CONFORME A SUB-ABA SELECIONADA */}
      {fillMode === 'importar' ? (
        <ImportStatementFlow onImportSuccess={handleImportSuccess} />
      ) : (
        <div className="space-y-6 animate-fade-in w-full">
          {/* 1. Summary Cards no topo do modo manual */}
          <SummaryCards transactions={transactions} bankAccounts={bankAccounts} />

          {/* 2. Formulário Lançador em LARGURA TOTAL 100% */}
          <div className="w-full relative z-30">
            <TransactionForm 
              bankAccounts={bankAccounts} 
              categories={categories}
              onSubmit={onAddTransaction} 
            />
          </div>

          {/* 3. Seção Inferior em Layout de 2 Colunas (75% Extrato Geral do Mês | 25% Lembretes de Pagamento) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start w-full relative z-10">
            {/* Coluna Esquerda: Extrato Geral do Mês (75% da largura - 3 partes) */}
            <div className="lg:col-span-3 w-full">
              <TransactionTable 
                transactions={transactions} 
                bankAccounts={bankAccounts} 
                categories={categories}
                onDelete={onDeleteTransaction}
                onEdit={onEditTransaction}
                onUpdateStatus={onUpdateStatus}
                onUpdateCategory={onUpdateCategory}
              />
            </div>

            {/* Coluna Direita: Lembretes de Pagamento (25% da largura - 1 parte) */}
            <div className="lg:col-span-1 w-full">
              <PaymentReminders 
                transactions={transactions} 
                bankAccounts={bankAccounts}
                onUpdateStatus={onUpdateStatus}
                onConfirmPayment={onConfirmPayment}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONCILIAÇÃO BANCÁRIA */}
      <ReconciliationModal
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
        bankAccounts={bankAccounts}
        onAddTransaction={onAddTransaction}
      />

    </div>
  );
}
