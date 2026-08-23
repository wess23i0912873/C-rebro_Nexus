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

const DEFAULT_ACCOUNTS = [];
const DEFAULT_CARDS = [];

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

const DEFAULT_RECURRING = [];
const MOCK_TRANSACTIONS = [];

export default function App() {
  const [activeTab, setActiveTab] = useState('financas');
  const [activeSubTab, setActiveSubTab] = useState('dashline');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [bankAccounts, setBankAccounts] = useLocalStorage('nexus_bank_accounts', DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useLocalStorage('nexus_transactions', MOCK_TRANSACTIONS);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // ─── Central de Controle ─ Estado Global Persistido ─────────────────────────────────────
  const [cards, setCards] = useLocalStorage('nexus_cards', DEFAULT_CARDS);
  const [categories, setCategories] = useLocalStorage('nexus_categories', DEFAULT_CATEGORIES);
  const [recurringItems, setRecurringItems] = useLocalStorage('nexus_recurring', DEFAULT_RECURRING);

  // Limpeza de legado de mocks prévios se existirem no localStorage
  useEffect(() => {
    try {
      const storedTxs = window.localStorage.getItem('nexus_transactions');
      if (storedTxs && storedTxs.includes('"id":"t-1"')) {
        window.localStorage.setItem('nexus_transactions', JSON.stringify([]));
        setTransactions([]);
      }
      const storedAccs = window.localStorage.getItem('nexus_bank_accounts');
      if (storedAccs && storedAccs.includes('"id":"acc-1"')) {
        window.localStorage.setItem('nexus_bank_accounts', JSON.stringify([]));
        setBankAccounts([]);
      }
      const storedCards = window.localStorage.getItem('nexus_cards');
      if (storedCards && storedCards.includes('"id":"card-1"')) {
        window.localStorage.setItem('nexus_cards', JSON.stringify([]));
        setCards([]);
      }
      const storedRec = window.localStorage.getItem('nexus_recurring');
      if (storedRec && storedRec.includes('"id":"rec-1"')) {
        window.localStorage.setItem('nexus_recurring', JSON.stringify([]));
        setRecurringItems([]);
      }
    } catch (e) {
      console.warn('Erro ao verificar limpeza de mocks:', e);
    }
  }, []);

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
  const handleEditAccount = (updated, oldAccount) => {
    setBankAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (oldAccount && oldAccount.id !== updated.id) {
      setTransactions(prev => prev.map(t => t.accountId === oldAccount.id ? { ...t, accountId: updated.id } : t));
    }
  };
  const handleDeleteAccount = (id) => setBankAccounts(prev => prev.filter(a => a.id !== id));

  // Categorias (com propagação imediata para todo o extrato)
  const handleAddCategory = (cat) => setCategories(prev => [...prev, cat]);
  const handleEditCategory = (updated, oldCategory) => {
    setCategories(prev => prev.map(c => ((c.id && c.id === updated.id) || c.value === (oldCategory?.value || updated.value)) ? updated : c));
    
    // Atualiza o nome da categoria em todas as transações correspondentes
    const oldName = oldCategory?.name || oldCategory?.value;
    const newName = updated.name || updated.value;
    if (oldName && newName && oldName !== newName) {
      setTransactions(prev => prev.map(t => (t.category === oldName || t.category === oldCategory?.value) ? { ...t, category: newName } : t));
    }
  };
  const handleDeleteCategory = (idOrValue) => {
    setCategories(prev => prev.filter(c => (c.id !== idOrValue && c.value !== idOrValue && c.name !== idOrValue)));
  };

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
          if (newTx.type === 'transfer') {
            const originAcc = bankAccounts.find(a => a.id === newTx.accountId);
            const destAcc = bankAccounts.find(a => a.id === newTx.destinationAccountId);
            if (originAcc) {
              await supabase.from('bank_accounts').update({ balance: originAcc.balance - newTx.value }).eq('id', originAcc.id);
            }
            if (destAcc) {
              await supabase.from('bank_accounts').update({ balance: destAcc.balance + newTx.value }).eq('id', destAcc.id);
            }
          } else {
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

    if (tx.status === 'paid') {
      setBankAccounts(prevAccounts => {
        return prevAccounts.map(account => {
          if (tx.type === 'transfer') {
            if (account.id === tx.accountId) {
              return { ...account, balance: Math.round((account.balance - tx.value) * 100) / 100 };
            }
            if (account.id === tx.destinationAccountId) {
              return { ...account, balance: Math.round((account.balance + tx.value) * 100) / 100 };
            }
            return account;
          } else {
            if (account.id === tx.accountId) {
              const diff = tx.type === 'income' ? tx.value : -tx.value;
              return {
                ...account,
                balance: Math.round((account.balance + diff) * 100) / 100
              };
            }
            return account;
          }
        });
      });
    }
  };

  // Atualizar Status do Lançamento (ex: Marcar como Pago ou Pendente)
  const handleUpdateStatus = (id, newStatus) => {
    const targetTx = transactions.find(t => t.id === id);
    if (!targetTx) return;
    const oldStatus = targetTx.status;

    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: newStatus };
      }
      return t;
    }));

    if (oldStatus !== newStatus) {
      setBankAccounts(prevAccounts => {
        let accounts = [...prevAccounts];
        const isBecomingPaid = newStatus === 'paid';
        const multiplier = isBecomingPaid ? 1 : -1;

        if (targetTx.type === 'transfer') {
          accounts = accounts.map(acc => {
            if (acc.id === targetTx.accountId) {
              return { ...acc, balance: Math.round((acc.balance - (targetTx.value * multiplier)) * 100) / 100 };
            }
            if (acc.id === targetTx.destinationAccountId) {
              return { ...acc, balance: Math.round((acc.balance + (targetTx.value * multiplier)) * 100) / 100 };
            }
            return acc;
          });
        } else {
          accounts = accounts.map(acc => {
            if (acc.id === targetTx.accountId) {
              const diff = targetTx.type === 'income' ? (targetTx.value * multiplier) : -(targetTx.value * multiplier);
              return { ...acc, balance: Math.round((acc.balance + diff) * 100) / 100 };
            }
            return acc;
          });
        }
        return accounts;
      });
    }
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
        
        // Reverter impacto do status antigo
        if (oldTx.status === 'paid') {
          if (oldTx.type === 'transfer') {
            accounts = accounts.map(acc => {
              if (acc.id === oldTx.accountId) return { ...acc, balance: Math.round((acc.balance + oldTx.value) * 100) / 100 };
              if (acc.id === oldTx.destinationAccountId) return { ...acc, balance: Math.round((acc.balance - oldTx.value) * 100) / 100 };
              return acc;
            });
          } else {
            const oldDiff = oldTx.type === 'income' ? -oldTx.value : oldTx.value;
            accounts = accounts.map(acc => acc.id === oldTx.accountId ? { ...acc, balance: Math.round((acc.balance + oldDiff) * 100) / 100 } : acc);
          }
        }
        
        // Aplicar impacto do novo status
        if (updatedTx.status === 'paid') {
          if (updatedTx.type === 'transfer') {
            accounts = accounts.map(acc => {
              if (acc.id === updatedTx.accountId) return { ...acc, balance: Math.round((acc.balance - updatedTx.value) * 100) / 100 };
              if (acc.id === updatedTx.destinationAccountId) return { ...acc, balance: Math.round((acc.balance + updatedTx.value) * 100) / 100 };
              return acc;
            });
          } else {
            const newDiff = updatedTx.type === 'income' ? updatedTx.value : -updatedTx.value;
            accounts = accounts.map(acc => acc.id === updatedTx.accountId ? { ...acc, balance: Math.round((acc.balance + newDiff) * 100) / 100 } : acc);
          }
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
    
    if (tx.status === 'paid') {
      setBankAccounts(prevAccounts => {
        return prevAccounts.map(account => {
          if (tx.type === 'transfer') {
            if (account.id === tx.accountId) {
              return { ...account, balance: Math.round((account.balance + tx.value) * 100) / 100 };
            }
            if (account.id === tx.destinationAccountId) {
              return { ...account, balance: Math.round((account.balance - tx.value) * 100) / 100 };
            }
            return account;
          } else {
            if (account.id === tx.accountId) {
              const diff = tx.type === 'income' ? -tx.value : tx.value;
              return {
                ...account,
                balance: Math.round((account.balance + diff) * 100) / 100
              };
            }
            return account;
          }
        });
      });
    }
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
              {/* ABA 1: DASHLINE (Painel Analítico) */}
              {activeSubTab === 'dashline' && (
                <Dashline 
                  bankAccounts={bankAccounts}
                  transactions={transactions}
                  cards={cards}
                  recurringItems={recurringItems}
                  categories={categories}
                  onAddTransaction={handleAddTransaction}
                  onEditAccount={handleEditAccount}
                />
              )}

              {/* ABA 2: CARTÕES (Gestão Integrada de Faturas) */}
              {activeSubTab === 'cartoes' && (
                <CardsModule 
                  cards={cards}
                  bankAccounts={bankAccounts}
                  transactions={transactions}
                />
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
