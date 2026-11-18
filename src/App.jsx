import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import FinancialNavTabs from './components/FinancialNavTabs';
import Dashline from './components/Dashline';
import CardsModule from './components/CardsModule';
import PreenchimentoModule from './components/PreenchimentoModule';
import SimulacaoModule from './components/SimulacaoModule';
import ControlCenterModule from './components/ControlCenterModule';
import { useLocalStorage } from './lib/useLocalStorage';
import { Bell } from 'lucide-react';
import { readSheetData, writeSheetData } from './lib/googleSheetsApi';

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

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function toSheetSnapshot({ bankAccounts, cards, transactions, recurringItems, categories }) {
  const snapshot = {
    accounts: bankAccounts,
    cards,
    transactions,
    subscriptions: recurringItems,
    categories,
  };
  return JSON.parse(JSON.stringify(snapshot));
}

function normalizeSheetSnapshot(data = {}) {
  return {
    accounts: Array.isArray(data.accounts) ? data.accounts : [],
    cards: Array.isArray(data.cards) ? data.cards : [],
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    subscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
  };
}

function mergePendingChanges(base, local, remote) {
  const merged = {};

  Object.keys(remote).forEach(entity => {
    const remoteById = new Map(remote[entity].map(record => [String(record.id), record]));
    const localById = new Map(local[entity].map(record => [String(record.id), record]));
    const baseById = base
      ? new Map(base[entity].map(record => [String(record.id), record]))
      : null;

    if (!baseById) {
      local[entity].forEach(record => {
        const id = String(record.id);
        if (!remoteById.has(id)) remoteById.set(id, record);
      });
    } else {
      baseById.forEach((baseRecord, id) => {
        const localRecord = localById.get(id);
        if (!localRecord) {
          remoteById.delete(id);
        } else if (stableStringify(localRecord) !== stableStringify(baseRecord)) {
          remoteById.set(id, localRecord);
        }
      });
      localById.forEach((localRecord, id) => {
        if (!baseById.has(id)) remoteById.set(id, localRecord);
      });
    }

    merged[entity] = Array.from(remoteById.values());
  });

  return merged;
}

function pendingChangesConfirmed(base, local, remote) {
  return Object.keys(local).every(entity => {
    const baseById = new Map(base[entity].map(record => [String(record.id), record]));
    const localById = new Map(local[entity].map(record => [String(record.id), record]));
    const remoteById = new Map(remote[entity].map(record => [String(record.id), record]));

    for (const [id, baseRecord] of baseById) {
      if (!localById.has(id) && remoteById.has(id)) return false;
      const localRecord = localById.get(id);
      if (localRecord && stableStringify(localRecord) !== stableStringify(baseRecord)
        && stableStringify(remoteById.get(id)) !== stableStringify(localRecord)) return false;
    }
    for (const [id, localRecord] of localById) {
      if (!baseById.has(id) && stableStringify(remoteById.get(id)) !== stableStringify(localRecord)) return false;
    }
    return true;
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('financas');
  const [activeSubTab, setActiveSubTab] = useState('dashline');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [bankAccounts, setBankAccounts] = useLocalStorage('nexus_bank_accounts', DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useLocalStorage('nexus_transactions', MOCK_TRANSACTIONS);

  // ─── Central de Controle ─ Estado Global Persistido ─────────────────────────────────────
  const [cards, setCards] = useLocalStorage('nexus_cards', DEFAULT_CARDS);
  const [categories, setCategories] = useLocalStorage('nexus_categories', DEFAULT_CATEGORIES);
  const [recurringItems, setRecurringItems] = useLocalStorage('nexus_recurring', DEFAULT_RECURRING);
  const [sheetsConfig, setSheetsConfig] = useLocalStorage('nexus_google_sheets_config', { url: '', token: '' });
  const [syncedSnapshot, setSyncedSnapshot] = useLocalStorage('nexus_google_sheets_snapshot', null);
  const [syncStatus, setSyncStatus] = useState('local');
  const [syncRetry, setSyncRetry] = useState(0);
  const [syncRevision, setSyncRevision] = useState(0);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const writingRef = useRef(false);
  const syncedSnapshotRef = useRef(syncedSnapshot);
  syncedSnapshotRef.current = syncedSnapshot;
  const localDataRef = useRef(null);
  localDataRef.current = { bankAccounts, cards, transactions, recurringItems, categories };

  useEffect(() => {
    let cancelled = false;
    let interval;
    let loading = false;
    const { url, token } = sheetsConfig;
    setRemoteLoaded(false);

    if (!url) {
      setSyncStatus('local');
      return undefined;
    }

    const loadData = async () => {
      if (writingRef.current || loading || document.visibilityState === 'hidden') return;
      loading = true;
      setSyncStatus('syncing');
      try {
        const data = await readSheetData(url, token);
        if (cancelled) return;
        const remote = normalizeSheetSnapshot(data);
        const local = toSheetSnapshot(localDataRef.current);
        const previousBaseline = syncedSnapshotRef.current;
        const merged = mergePendingChanges(previousBaseline, local, remote);
        syncedSnapshotRef.current = remote;
        if (stableStringify(previousBaseline) !== stableStringify(remote)) setSyncedSnapshot(remote);
        if (stableStringify(local.accounts) !== stableStringify(merged.accounts)) setBankAccounts(merged.accounts);
        if (stableStringify(local.cards) !== stableStringify(merged.cards)) setCards(merged.cards);
        if (stableStringify(local.transactions) !== stableStringify(merged.transactions)) setTransactions(merged.transactions);
        if (stableStringify(local.subscriptions) !== stableStringify(merged.subscriptions)) setRecurringItems(merged.subscriptions);
        if (stableStringify(local.categories) !== stableStringify(merged.categories)) setCategories(merged.categories);
        setRemoteLoaded(true);
        setSyncStatus(stableStringify(merged) === stableStringify(remote) ? 'synced' : 'syncing');
      } catch (error) {
        if (cancelled) return;
        console.error('Falha ao carregar dados da planilha:', error);
        setSyncStatus('error');
      } finally {
        loading = false;
      }
    };

    loadData();
    interval = window.setInterval(loadData, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    window.addEventListener('focus', loadData);
    window.addEventListener('online', loadData);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', loadData);
      window.removeEventListener('online', loadData);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sheetsConfig.url, sheetsConfig.token, syncRetry, setBankAccounts, setCards, setTransactions, setRecurringItems, setCategories, setSyncedSnapshot]);

  useEffect(() => {
    if (!sheetsConfig.url || !remoteLoaded) return undefined;
    const currentSnapshot = toSheetSnapshot({ bankAccounts, cards, transactions, recurringItems, categories });
    const baseline = syncedSnapshotRef.current;
    if (!baseline || stableStringify(currentSnapshot) === stableStringify(baseline)) return undefined;

    const timeout = window.setTimeout(() => {
      if (writingRef.current) return;
      const snapshot = toSheetSnapshot(localDataRef.current);
      const base = syncedSnapshotRef.current;
      if (!base || stableStringify(snapshot) === stableStringify(base)) return;
      setSyncStatus('syncing');
      writingRef.current = true;
      writeSheetData(sheetsConfig.url, sheetsConfig.token, snapshot, base)
        .then(data => {
          const remote = normalizeSheetSnapshot(data);
          if (!pendingChangesConfirmed(base, snapshot, remote)) {
            throw new Error('A planilha não confirmou todas as alterações enviadas.');
          }
          const latestLocal = toSheetSnapshot(localDataRef.current);
          const settled = mergePendingChanges(snapshot, latestLocal, remote);
          syncedSnapshotRef.current = remote;
          setSyncedSnapshot(remote);
          if (stableStringify(latestLocal.accounts) !== stableStringify(settled.accounts)) setBankAccounts(settled.accounts);
          if (stableStringify(latestLocal.cards) !== stableStringify(settled.cards)) setCards(settled.cards);
          if (stableStringify(latestLocal.transactions) !== stableStringify(settled.transactions)) setTransactions(settled.transactions);
          if (stableStringify(latestLocal.subscriptions) !== stableStringify(settled.subscriptions)) setRecurringItems(settled.subscriptions);
          if (stableStringify(latestLocal.categories) !== stableStringify(settled.categories)) setCategories(settled.categories);
          setSyncStatus('synced');
        })
        .catch(error => {
          console.error('Falha ao sincronizar com Google Sheets:', error);
          setSyncStatus('error');
        })
        .finally(() => {
          writingRef.current = false;
          setSyncRevision(value => value + 1);
        });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [bankAccounts, cards, transactions, recurringItems, categories, remoteLoaded, sheetsConfig.url, sheetsConfig.token, syncRevision, setSyncedSnapshot, setBankAccounts, setCards, setTransactions, setRecurringItems, setCategories]);

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

  const executeLocalAdd = (preparedTx) => {
    setTransactions(prev => [preparedTx, ...prev]);
    if (preparedTx.status !== 'paid' || preparedTx.paymentMethod === 'credit') return;
    setBankAccounts(prev => prev.map(account => {
      if (preparedTx.type === 'transfer') {
        if (account.id === preparedTx.accountId) return { ...account, balance: account.balance - preparedTx.value };
        if (account.id === preparedTx.destinationAccountId) return { ...account, balance: account.balance + preparedTx.value };
        return account;
      }
      if (account.id !== preparedTx.accountId) return account;
      const diff = preparedTx.type === 'income' ? preparedTx.value : -preparedTx.value;
      return { ...account, balance: account.balance + diff };
    }));
  };

  // Adicionar Lançamento
  const handleAddTransaction = async (newTx) => {
    const uniqueId = `t-${Date.now()}`;
    executeLocalAdd({ id: uniqueId, origin: 'manual', ...newTx });
  };

  // Adicionar Compra Parcelada no Cartão de Crédito
  const handleAddCardPurchase = ({ purchaseData, installments, card }) => {
    if (!installments || installments.length === 0) return;

    setTransactions(prev => [...installments, ...prev]);

    // Atualiza o limite usado do cartão sem debitar a conta bancária
    if (card && purchaseData.value) {
      setCards(prevCards => prevCards.map(c => {
        if (c.id === card.id) {
          const currentUsed = parseFloat(c.limitUsed) || 0;
          const newUsed = Math.round((currentUsed + purchaseData.value) * 100) / 100;
          return { ...c, limitUsed: newUsed };
        }
        return c;
      }));
    }
  };

  // Excluir Compra Completa no Cartão (Todas as parcelas)
  const handleDeleteCardPurchase = (purchaseId) => {
    const txsToDelete = transactions.filter(t => t.purchaseId === purchaseId);
    if (txsToDelete.length === 0) return;

    const cardId = txsToDelete[0]?.cardId;
    const totalPurchaseVal = txsToDelete.reduce((sum, t) => sum + (parseFloat(t.value) || 0), 0);

    setTransactions(prev => prev.filter(t => t.purchaseId !== purchaseId));

    if (cardId) {
      setCards(prevCards => prevCards.map(c => {
        if (c.id === cardId) {
          const currentUsed = parseFloat(c.limitUsed) || 0;
          const newUsed = Math.max(0, Math.round((currentUsed - totalPurchaseVal) * 100) / 100);
          return { ...c, limitUsed: newUsed };
        }
        return c;
      }));
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
  const handleEditTransaction = async (updatedTx) => executeLocalEdit(updatedTx);

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

      executeLocalPartialPayment(updatedPendingTx, paidTx);
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

    executeLocalDelete(id, txToDelete);
  };

  const executeLocalDelete = (id, tx) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    // Se for transação de cartão de crédito, atualiza o limite do cartão sem tocar na conta corrente
    if (tx.cardId || tx.paymentMethod === 'credit') {
      if (tx.cardId) {
        setCards(prevCards => prevCards.map(c => {
          if (c.id === tx.cardId) {
            const currentUsed = parseFloat(c.limitUsed) || 0;
            const newUsed = Math.max(0, Math.round((currentUsed - (parseFloat(tx.value) || 0)) * 100) / 100);
            return { ...c, limitUsed: newUsed };
          }
          return c;
        }));
      }
      return;
    }

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
              syncStatus === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : syncStatus === 'synced'
                  ? 'bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}>
              {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'synced' ? 'Google Sheets conectado' : syncStatus === 'error' ? 'Erro na sincronização' : 'Planilha não configurada'}
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

              {/* ABA 3: PREENCHIMENTO (Refatorado com Extrato Bancário & Extrato de Cartões) */}
              {activeSubTab === 'preenchimento' && (
                <PreenchimentoModule
                  transactions={transactions}
                  bankAccounts={bankAccounts}
                  cards={cards}
                  categories={categories}
                  onAddTransaction={handleAddTransaction}
                  onAddCardPurchase={handleAddCardPurchase}
                  onAddBatchTransactions={handleAddBatchTransactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onDeleteCardPurchase={handleDeleteCardPurchase}
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
                  sheetsConfig={sheetsConfig}
                  onSaveSheetsConfig={(config) => {
                    setSheetsConfig(config);
                    setSyncRetry(value => value + 1);
                  }}
                  syncStatus={syncStatus}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
