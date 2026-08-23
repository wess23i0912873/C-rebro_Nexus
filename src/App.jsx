import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FinancialNavTabs from './components/FinancialNavTabs';
import Dashline from './components/Dashline';
import CardsModule from './components/CardsModule';
import PreenchimentoModule from './components/PreenchimentoModule';
import SimulacaoModule from './components/SimulacaoModule';
import ControlCenterModule from './components/ControlCenterModule';
import { supabase } from './lib/supabaseClient';
import { useLocalStorage } from './lib/useLocalStorage';
import { Bell } from 'lucide-react';

const DEFAULT_ACCOUNTS = [
  { id: 'acc-1', name: 'Nubank', emoji: '🟣', type: 'corrente', balance: 5420.50 },
  { id: 'acc-2', name: 'Itaú Personnalité', emoji: '🟠', type: 'investimentos', balance: 12500.00 },
  { id: 'acc-3', name: 'Dinheiro Físico', emoji: '💵', type: 'wallet', balance: 350.00 }
];

const DEFAULT_CARDS = [
  { id: 'card-1', name: 'Nubank Ultravioleta', digits: '•••• 4892', owner: 'eu', limitTotal: 15000, limitUsed: 3790.50, dueDay: '10', gradient: 'purple', colorGradient: 'from-purple-900/60 via-indigo-950/80 to-[#0b0f19]', borderColor: 'border-purple-500/30', accent: '#a855f7' },
  { id: 'card-2', name: 'Mercado Pago Black', digits: '•••• 8120', owner: 'eu', limitTotal: 10000, limitUsed: 2670.00, dueDay: '20', gradient: 'cyan', colorGradient: 'from-sky-900/60 via-blue-950/80 to-[#0b0f19]', borderColor: 'border-cyan-500/30', accent: '#06b6d4' },
  { id: 'card-3', name: 'Itaú Personnalité Platinum', digits: '•••• 3044', owner: 'noiva', limitTotal: 20000, limitUsed: 1500.00, dueDay: '15', gradient: 'amber', colorGradient: 'from-amber-950/60 via-slate-900/80 to-[#0b0f19]', borderColor: 'border-amber-500/30', accent: '#f59e0b' },
];

const DEFAULT_CATEGORIES = [
  // Despesas
  { id: 'cat-1', name: 'Alimentação', value: 'Alimentação', label: 'Alimentação', type: 'expense', emoji: '🍔' },
  { id: 'cat-2', name: 'Habitação', value: 'Habitação', label: 'Habitação', type: 'expense', emoji: '🏠' },
  { id: 'cat-3', name: 'Lazer', value: 'Lazer', label: 'Lazer', type: 'expense', emoji: '🎮' },
  { id: 'cat-4', name: 'Saúde', value: 'Saúde', label: 'Saúde', type: 'expense', emoji: '🏥' },
  { id: 'cat-5', name: 'Transporte', value: 'Transporte', label: 'Transporte', type: 'expense', emoji: '🚗' },
  { id: 'cat-6', name: 'Outros', value: 'Outros', label: 'Outras Despesas', type: 'expense', emoji: '🏷️' },
  // Receitas
  { id: 'cat-7', name: 'Salário', value: 'Salário', label: 'Salário / Renda', type: 'income', emoji: '💼' },
  { id: 'cat-8', name: 'Investimentos', value: 'Investimentos', label: 'Investimentos / Rendimentos', type: 'income', emoji: '📈' },
  { id: 'cat-9', name: 'Outros', value: 'Outros', label: 'Outras Receitas', type: 'income', emoji: '🟢' },
];

const DEFAULT_RECURRING = [
  { id: 'rec-1', name: 'Condomínio', type: 'expense', emoji: '🏠', value: 680 },
  { id: 'rec-2', name: 'Salário Wesley', type: 'income', emoji: '💼', value: 9500 },
];

const MOCK_TRANSACTIONS = [
  { id: 't-1', date: '2026-08-01', type: 'expense', category: 'Alimentação', accountId: 'acc-1', payee: 'Supermercado Carrefour', product: 'Compras do mês', value: 450.80, status: 'paid', origin: 'manual' },
  { id: 't-2', date: '2026-08-02', type: 'expense', category: 'Lazer', accountId: 'acc-1', payee: 'Restaurante Coco Bambu', product: 'Jantar com a Noiva', value: 220.00, status: 'paid', origin: 'manual' },
  { id: 't-3', date: '2026-08-02', type: 'income', category: 'Salário', accountId: 'acc-2', payee: 'Empresa Tech SA', product: 'Salário Wesley', value: 9500.00, status: 'paid', origin: 'manual' },
  { id: 't-4', date: '2026-08-02', type: 'expense', category: 'Habitação', accountId: 'acc-2', payee: 'Administradora de Condomínio', product: 'Mensalidade condomínio', value: 680.00, status: 'pending', origin: 'manual' },
  { id: 't-5', date: '2026-08-02', type: 'expense', category: 'Saúde', accountId: 'acc-3', payee: 'Farmácia Drogasil', product: 'Medicamentos', value: 45.90, status: 'paid', origin: 'manual' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('financas');
  const [activeSubTab, setActiveSubTab] = useState('dashline');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [bankAccounts, setBankAccounts] = useLocalStorage('nexus_bank_accounts', DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // ─── Central de Controle ─ Estado Global Persistido ─────────────────────────────────────
  const [cards, setCards] = useLocalStorage('nexus_cards', DEFAULT_CARDS);
  const [categories, setCategories] = useLocalStorage('nexus_categories', DEFAULT_CATEGORIES);
  const [recurringItems, setRecurringItems] = useLocalStorage('nexus_recurring', DEFAULT_RECURRING);

  // Carregar dados (Supabase com fallback para Mock)
  useEffect(() => {
    async function loadData() {
      try {
        const { data: accounts, error: accountsError } = await supabase
          .from('bank_accounts')
          .select('*');
        
        if (accountsError) throw accountsError;

        const { data: transs, error: transsError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (transsError) throw transsError;

        if (accounts && accounts.length > 0) setBankAccounts(accounts);
        if (transs && transs.length > 0) setTransactions(transs);
        setIsUsingSupabase(true);
      } catch (err) {
        console.warn('Supabase não configurado ou tabelas inexistentes. Rodando com dados simulados (Mock).');
        setIsUsingSupabase(false);
      }
    }

    loadData();
  }, []);

  // ─── Central de Controle ─ CRUD Handlers ────────────────────────────────────────

  // Cartões
  const handleAddCard = (card) => setCards(prev => [...prev, card]);
  const handleEditCard = (updated) => setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  const handleDeleteCard = (id) => setCards(prev => prev.filter(c => c.id !== id));

  // Contas Bancárias
  const handleAddAccount = (acc) => setBankAccounts(prev => [...prev, acc]);
  const handleEditAccount = (updated) => setBankAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
  const handleDeleteAccount = (id) => setBankAccounts(prev => prev.filter(a => a.id !== id));

  // Categorias
  const handleAddCategory = (cat) => setCategories(prev => [...prev, cat]);
  const handleEditCategory = (updated) => setCategories(prev => prev.map(c => (c.id || c.value) === (updated.id || updated.value) ? updated : c));
  const handleDeleteCategory = (idOrValue) => setCategories(prev => prev.filter(c => (c.id || c.value) !== idOrValue));

  // Itens Recorrentes
  const handleAddRecurring = (item) => setRecurringItems(prev => [...prev, item]);
  const handleEditRecurring = (updated) => setRecurringItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  const handleDeleteRecurring = (id) => setRecurringItems(prev => prev.filter(i => i.id !== id));

  // Adicionar Lançamento
  const handleAddTransaction = async (newTx) => {
    const uniqueId = `t-${Date.now()}`;
    const preparedTx = { id: uniqueId, origin: 'manual', ...newTx };

    if (isUsingSupabase) {
      try {
        const { error } = await supabase
          .from('transactions')
          .insert([preparedTx]);

        if (error) throw error;
        
        if (newTx.status === 'paid') {
          const account = bankAccounts.find(a => a.id === newTx.accountId);
          if (account) {
            const newBalance = newTx.type === 'income' 
              ? account.balance + newTx.value 
              : account.balance - newTx.value;
            
            await supabase
              .from('bank_accounts')
              .update({ balance: newBalance })
              .eq('id', newTx.accountId);
          }
        }
        
        const { data: transs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        const { data: accounts } = await supabase.from('bank_accounts').select('*');
        if (transs) setTransactions(transs);
        if (accounts) setBankAccounts(accounts);
      } catch (err) {
        console.error('Falha ao salvar no Supabase, executando em estado local:', err);
        executeLocalAdd(preparedTx);
      }
    } else {
      executeLocalAdd(preparedTx);
    }
  };

  const executeLocalAdd = (tx) => {
    setTransactions(prev => [tx, ...prev]);

    setBankAccounts(prevAccounts => {
      return prevAccounts.map(account => {
        if (account.id === tx.accountId) {
          const diff = tx.type === 'income' ? tx.value : -tx.value;
          return {
            ...account,
            balance: account.balance + diff
          };
        }
        return account;
      });
    });
  };

  // Atualizar Status do Lançamento (ex: Marcar como Pago)
  const handleUpdateStatus = (id, newStatus) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  // Atualizar Categoria do Lançamento
  const handleUpdateCategory = (id, newCategory) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, category: newCategory };
      }
      return t;
    }));
  };

  // Editar Lançamento Completo
  const handleEditTransaction = async (updatedTx) => {
    if (isUsingSupabase && !updatedTx.id.toString().startsWith('t-')) {
      try {
        const { error } = await supabase
          .from('transactions')
          .update({
            date: updatedTx.date,
            type: updatedTx.type,
            category: updatedTx.category,
            accountId: updatedTx.accountId,
            payee: updatedTx.payee,
            product: updatedTx.product,
            value: updatedTx.value,
            status: updatedTx.status
          })
          .eq('id', updatedTx.id);

        if (error) throw error;

        const { data: transs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        const { data: accounts } = await supabase.from('bank_accounts').select('*');
        if (transs) setTransactions(transs);
        if (accounts) setBankAccounts(accounts);
      } catch (err) {
        console.error('Falha ao editar no Supabase, executando localmente:', err);
        executeLocalEdit(updatedTx);
      }
    } else {
      executeLocalEdit(updatedTx);
    }
  };

  const executeLocalEdit = (updatedTx) => {
    const oldTx = transactions.find(t => t.id === updatedTx.id);
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));

    if (oldTx) {
      setBankAccounts(prevAccounts => {
        let accounts = [...prevAccounts];
        if (oldTx.status === 'paid') {
          const oldDiff = oldTx.type === 'income' ? -oldTx.value : oldTx.value;
          accounts = accounts.map(acc => acc.id === oldTx.accountId ? { ...acc, balance: acc.balance + oldDiff } : acc);
        }
        if (updatedTx.status === 'paid') {
          const newDiff = updatedTx.type === 'income' ? updatedTx.value : -updatedTx.value;
          accounts = accounts.map(acc => acc.id === updatedTx.accountId ? { ...acc, balance: acc.balance + newDiff } : acc);
        }
        return accounts;
      });
    }
  };

  // Confirmar Pagamento de Lembrete (Total vs Parcial)
  const handleConfirmPayment = async (reminderTx, { paymentDate, paidValue, accountId }) => {
    const isTotal = paidValue >= reminderTx.value;

    if (isTotal) {
      // Pagamento Total: Altera status para 'paid', atualiza data, valor e conta bancária
      const updatedTx = {
        ...reminderTx,
        date: paymentDate,
        value: paidValue,
        accountId: accountId || reminderTx.accountId,
        status: 'paid'
      };
      await handleEditTransaction(updatedTx);
    } else {
      // Pagamento Parcial:
      // 1. Atualiza a transação pendente existente com o valor restante
      const remainingValue = Math.max(0, parseFloat((reminderTx.value - paidValue).toFixed(2)));
      const updatedPendingTx = {
        ...reminderTx,
        value: remainingValue
      };

      // 2. Cria nova transação para a parcela quitada com status 'paid'
      const paidTx = {
        id: `t-pay-${Date.now()}`,
        date: paymentDate,
        type: reminderTx.type || 'expense',
        category: reminderTx.category || 'Outros',
        accountId: accountId || reminderTx.accountId,
        payee: reminderTx.payee || reminderTx.description || 'Lançamento',
        product: reminderTx.product ? `${reminderTx.product} (Pagamento Parcial)` : 'Pagamento Parcial',
        value: paidValue,
        status: 'paid',
        origin: reminderTx.origin || 'manual'
      };

      if (isUsingSupabase && !reminderTx.id.toString().startsWith('t-')) {
        try {
          // Atualiza valor restante na pendente
          await supabase
            .from('transactions')
            .update({ value: remainingValue })
            .eq('id', reminderTx.id);

          // Insere a parcela paga
          await supabase
            .from('transactions')
            .insert([paidTx]);

          // Atualiza saldo bancário da parcela paga
          const account = bankAccounts.find(a => a.id === paidTx.accountId);
          if (account) {
            const newBalance = paidTx.type === 'income' 
              ? account.balance + paidTx.value 
              : account.balance - paidTx.value;
            
            await supabase
              .from('bank_accounts')
              .update({ balance: newBalance })
              .eq('id', paidTx.accountId);
          }

          const { data: transs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
          const { data: accounts } = await supabase.from('bank_accounts').select('*');
          if (transs) setTransactions(transs);
          if (accounts) setBankAccounts(accounts);
        } catch (err) {
          console.error('Falha ao registrar pagamento parcial no Supabase, executando em estado local:', err);
          executeLocalPartialPayment(updatedPendingTx, paidTx);
        }
      } else {
        executeLocalPartialPayment(updatedPendingTx, paidTx);
      }
    }
  };

  const executeLocalPartialPayment = (updatedPendingTx, paidTx) => {
    setTransactions(prev => [
      paidTx,
      ...prev.map(t => t.id === updatedPendingTx.id ? updatedPendingTx : t)
    ]);

    setBankAccounts(prevAccounts => {
      return prevAccounts.map(account => {
        if (account.id === paidTx.accountId) {
          const diff = paidTx.type === 'income' ? paidTx.value : -paidTx.value;
          return {
            ...account,
            balance: account.balance + diff
          };
        }
        return account;
      });
    });
  };

  // Excluir Lançamento
  const handleDeleteTransaction = async (id) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    if (isUsingSupabase && !id.toString().startsWith('t-')) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        if (txToDelete.status === 'paid') {
          const account = bankAccounts.find(a => a.id === txToDelete.accountId);
          if (account) {
            const newBalance = txToDelete.type === 'income'
              ? account.balance - txToDelete.value
              : account.balance + txToDelete.value;
            
            await supabase
              .from('bank_accounts')
              .update({ balance: newBalance })
              .eq('id', txToDelete.accountId);
          }
        }

        const { data: transs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        const { data: accounts } = await supabase.from('bank_accounts').select('*');
        if (transs) setTransactions(transs);
        if (accounts) setBankAccounts(accounts);
      } catch (err) {
        console.error('Falha ao excluir no Supabase, executando localmente:', err);
        executeLocalDelete(id, txToDelete);
      }
    } else {
      executeLocalDelete(id, txToDelete);
    }
  };

  const executeLocalDelete = (id, tx) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    setBankAccounts(prevAccounts => {
      return prevAccounts.map(account => {
        if (account.id === tx.accountId) {
          const diff = tx.type === 'income' ? -tx.value : tx.value;
          return {
            ...account,
            balance: account.balance + diff
          };
        }
        return account;
      });
    });
  };

  // Adicionar Lançamentos em Lote (Importação de Extrato)
  const handleAddBatchTransactions = (newTxs) => {
    const formattedTxs = newTxs.map((item, idx) => ({
      id: item.id || `t-imp-${Date.now()}-${idx}`,
      date: item.date ? item.date.split('/').reverse().join('-') : '2026-08-05',
      type: item.type === 'receita' ? 'income' : 'expense',
      category: item.category && item.category !== 'Entrada' && item.category !== 'Saída' ? item.category : '',
      accountId: 'acc-1',
      payee: item.description,
      product: 'Importação Extrato',
      value: Math.abs(item.value),
      status: 'paid',
      origin: 'extrato'
    }));

    setTransactions(prev => [...formattedTxs, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] flex">
      {/* Sidebar Lateral Colapsável */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Área de Conteúdo Principal */}
      <main className={`flex-1 flex flex-col min-h-screen overflow-y-auto transition-all duration-300 ${
        isSidebarCollapsed ? 'pl-20' : 'pl-64'
      }`}>
        {/* Header Superior */}
        <header className="h-20 border-b border-[#192234] px-8 flex items-center justify-between bg-[#06090e]/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-extrabold text-xl text-white tracking-tight">
              Módulo Financeiro
            </h2>
            <span className={`text-[9px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
              isUsingSupabase 
                ? 'bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {isUsingSupabase ? 'Supabase Integrado' : 'Modo Simulador'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-[#475569] font-mono hidden md:inline-block">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="relative">
              <button className="p-2 rounded-xl bg-[#0d1320] border border-[#192234] text-[#94a3b8] hover:text-[#00ff87] transition-colors cursor-pointer">
                <Bell size={16} />
              </button>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00ff87] animate-ping"></span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00ff87]"></span>
            </div>
          </div>
        </header>

        {/* Sub-menu / Abas de Navegação Interna */}
        {activeTab === 'financas' && (
          <FinancialNavTabs activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
        )}

        {/* Visualização de Conteúdo Dinâmico */}
        <div className="flex-1 p-8 space-y-8">
          {activeTab === 'financas' && (
            <>
              {/* ABA 1: DASHLINE (Painel Analítico Read-Only) */}
              {activeSubTab === 'dashline' && (
                <Dashline bankAccounts={bankAccounts} />
              )}

              {/* ABA 2: CARTÕES (Gestão Integrada de Faturas) */}
              {activeSubTab === 'cartoes' && (
                <CardsModule />
              )}

              {/* ABA 3: PREENCHIMENTO (Refatorado com Extrato Geral & Painel de Lembretes de Pagamento) */}
              {activeSubTab === 'preenchimento' && (
                <PreenchimentoModule
                  transactions={transactions}
                  bankAccounts={bankAccounts}
                  categories={categories}
                  onAddTransaction={handleAddTransaction}
                  onAddBatchTransactions={handleAddBatchTransactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onEditTransaction={handleEditTransaction}
                  onConfirmPayment={handleConfirmPayment}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateCategory={handleUpdateCategory}
                />
              )}

              {/* ABA 4: SIMULAÇÕES (Simulador de Impacto de Compras) */}
              {activeSubTab === 'simulacoes' && (
                <SimulacaoModule
                  transactions={transactions}
                  bankAccounts={bankAccounts}
                  cards={cards}
                  recurringItems={recurringItems}
                />
              )}

              {/* ABA 5: CENTRAL DE CONTROLE */}
              {activeSubTab === 'centraldecontrole' && (
                <ControlCenterModule
                  cards={cards}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                  bankAccounts={bankAccounts}
                  onAddAccount={handleAddAccount}
                  onEditAccount={handleEditAccount}
                  onDeleteAccount={handleDeleteAccount}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  recurringItems={recurringItems}
                  onAddRecurring={handleAddRecurring}
                  onEditRecurring={handleEditRecurring}
                  onDeleteRecurring={handleDeleteRecurring}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
