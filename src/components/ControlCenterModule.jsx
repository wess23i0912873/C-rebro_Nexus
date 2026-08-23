import React, { useState } from 'react';
import {
  Settings2,
  CreditCard,
  Landmark,
  Tag,
  Repeat2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  User,
  Users,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon
} from 'lucide-react';
import BankIcon from './BankIcon';
import CardVisual from './CardVisual';
import SmartEmojiPicker from './SmartEmojiPicker';
import { 
  PRESET_BANK_ICONS, 
  PRESET_CARD_IMAGES, 
  findBankPreset, 
  findCardPreset 
} from '../constants/assetOptions';

// ─── Defaults ────────────────────────────────────────────────────────────────

const COMMON_EMOJIS = {
  expense: ['🍔','🏠','🎮','🏥','🚗','📦','✈️','🎓','💼','🛒','🧾','📱','💡','🚿','🎬','🏋️','🐾','👕','🔧','📚'],
  income:  ['💼','📈','🟢','💰','🎁','🏆','💵','🤝','🔄','🌟']
};

const EMPTY_CARD = { 
  name: '', 
  owner: 'eu', 
  limitTotal: '', 
  dueDay: '10', 
  digits: '', 
  image: PRESET_CARD_IMAGES[0].path 
};

const EMPTY_ACCOUNT = { 
  name: '', 
  icon: PRESET_BANK_ICONS[0].path 
};

const EMPTY_CATEGORY = { name: '', type: 'expense', emoji: '🏷️' };
const EMPTY_RECURRING = { name: '', type: 'expense', emoji: '🏷️', value: '' };

// ─── Small helpers ────────────────────────────────────────────────────────────

const uid = () => `cc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const inputCls = `w-full bg-[#0d1320] border border-[#192234] rounded-xl px-3 py-2.5 text-sm text-white
  placeholder-[#475569] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all`;

const labelCls = 'block text-[11px] text-[#64748b] uppercase tracking-wider font-bold mb-1.5';

// ─── Inline Modal Responsivo ──────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#080c14] border border-[#192234] rounded-3xl w-full max-w-md shadow-2xl my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#192234] shrink-0">
          <h3 className="text-sm font-bold text-white truncate pr-2">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#121927] border border-[#192234] text-[#64748b] hover:text-white hover:border-red-500/40 transition-all cursor-pointer shrink-0">
            <X size={15} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ label, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#080c14] border border-red-500/30 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <p className="text-sm text-white font-semibold text-center">Excluir <span className="text-red-400">"{label}"</span>?</p>
        <p className="text-xs text-[#94a3b8] text-center">Esta ação atualizará as referências no sistema.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-[#192234] text-xs text-[#94a3b8] hover:bg-[#121927] transition-all cursor-pointer">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300 font-bold hover:bg-red-500/30 transition-all cursor-pointer">Excluir</button>
        </div>
      </div>
    </div>
  );
}

// ─── MODULE 1: Cartões (Com Seleção Visual PNG) ───────────────────────────────

function CardsManager({ cards, onAdd, onEdit, onDelete }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_CARD);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => { setForm(EMPTY_CARD); setModal('add'); };
  const openEdit = (card) => {
    setForm({
      name: card.name,
      owner: card.owner || 'eu',
      limitTotal: card.limitTotal,
      dueDay: card.dueDay || '10',
      digits: card.digits || '',
      image: card.image || findCardPreset(card.name)?.path || PRESET_CARD_IMAGES[0].path
    });
    setModal(card);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.limitTotal) return;
    const cardPreset = findCardPreset(form.image || form.name);
    const payload = {
      name: form.name.trim(),
      owner: form.owner,
      limitTotal: parseFloat(form.limitTotal) || 0,
      limitUsed: modal === 'add' ? 0 : (modal.limitUsed || 0),
      dueDay: form.dueDay || '10',
      digits: form.digits || `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
      image: form.image || cardPreset.path,
      colorGradient: cardPreset.gradient,
      borderColor: cardPreset.border,
      accent: cardPreset.accent,
    };
    if (modal === 'add') onAdd({ id: uid(), ...payload });
    else onEdit({ ...modal, ...payload }, modal);
    setModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#64748b]">{cards.length} cartão(ões) cadastrado(s)</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/25 transition-all cursor-pointer">
          <Plus size={14} /> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(card => {
          const usedPct = card.limitTotal > 0 ? Math.min(100, (card.limitUsed / card.limitTotal) * 100) : 0;
          return (
            <div key={card.id} className="p-5 rounded-3xl bg-[#0c121e] border border-[#192234] hover:border-purple-500/50 space-y-4 relative group shadow-xl transition-all">
              {/* Cabeçalho com Visual PNG do Cartão */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CardVisual 
                    image={card.image} 
                    cardName={card.name} 
                    digits={card.digits} 
                    variant="badge" 
                  />
                  <div>
                    <p className="text-sm font-extrabold text-white">{card.name}</p>
                    <p className="text-[11px] text-[#94a3b8] font-mono mt-0.5">{card.digits || '•••• ????'}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(card)} className="p-1.5 rounded-lg bg-[#121927]/80 text-[#94a3b8] hover:text-white border border-[#192234] transition-all cursor-pointer"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteTarget(card)} className="p-1.5 rounded-lg bg-[#121927]/80 text-[#94a3b8] hover:text-red-400 border border-[#192234] transition-all cursor-pointer"><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Barra de Limite */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-[#94a3b8]">
                  <span>Limite usado</span>
                  <span className="font-mono font-bold text-white">{usedPct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[#00ff87] transition-all" style={{ width: `${usedPct}%` }} />
                </div>
              </div>

              {/* Dados Adicionais */}
              <div className="flex justify-between text-[11px] pt-1 border-t border-[#192234]/80">
                <span className="text-[#64748b]">Limite total</span>
                <span className="font-mono font-bold text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limitTotal || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748b]">Vencimento</span>
                <span className="font-bold text-amber-300">Dia {card.dueDay || '10'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {card.owner === 'eu'
                  ? <><User size={11} className="text-cyan-400" /><span className="text-[10px] text-cyan-400 font-semibold">Meu Cartão</span></>
                  : <><Users size={11} className="text-pink-400" /><span className="text-[10px] text-pink-400 font-semibold">Cartão Noiva</span></>}
              </div>
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="py-12 text-center text-[#475569] text-sm border border-dashed border-[#192234] rounded-2xl">
          Nenhum cartão cadastrado. Clique em "Novo Cartão" para começar.
        </div>
      )}

      {/* Modal Add/Edit Cartão */}
      {modal !== null && (
        <Modal title={modal === 'add' ? 'Novo Cartão' : `Editar — ${modal.name}`} onClose={() => setModal(null)}>
          <div>
            <label className={labelCls}>Nome do Cartão</label>
            <input className={inputCls} placeholder="Ex: Nubank Ultravioleta" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
          </div>

          {/* SELEÇÃO VISUAL DA IMAGEM DO CARTÃO (PNG) */}
          <div>
            <label className={labelCls}>
              Selecione o Modelo do Cartão (PNG)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1 bg-[#090d16] border border-[#192234] rounded-2xl">
              {PRESET_CARD_IMAGES.map(c => {
                const isSelected = form.image === c.path;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setForm(p => ({
                        ...p,
                        image: c.path,
                        name: p.name || c.name
                      }));
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 group ${
                      isSelected
                        ? 'border-2 border-[#00ff87] bg-[#00ff87]/15 shadow-[0_0_15px_rgba(0,255,135,0.35)] scale-[1.02]'
                        : 'bg-[#0d1320] border-[#192234] hover:border-purple-500/40 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <CardVisual image={c.path} cardName={c.name} variant="thumbnail" className="w-full h-11" />
                    <div className="w-full text-center">
                      <p className={`text-[10px] font-bold truncate ${isSelected ? 'text-[#00ff87]' : 'text-white'}`}>{c.name}</p>
                      <p className="text-[9px] text-[#64748b] truncate">{c.bank}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>Número (últimos 4 dígitos)</label>
            <input className={inputCls} placeholder="Ex: 4892" maxLength={4} value={form.digits.replace('•••• ','')} onChange={e => setForm(p => ({...p, digits: `•••• ${e.target.value}`}))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Limite Total (R$)</label>
              <input type="number" className={inputCls} placeholder="15000" value={form.limitTotal} onChange={e => setForm(p => ({...p, limitTotal: e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Dia Vencimento</label>
              <input type="number" className={inputCls} min="1" max="31" placeholder="10" value={form.dueDay} onChange={e => setForm(p => ({...p, dueDay: e.target.value}))} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Responsável</label>
            <div className="flex gap-2">
              {['eu', 'noiva'].map(o => (
                <button key={o} type="button" onClick={() => setForm(p => ({...p, owner: o}))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${form.owner === o ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-[#0d1320] border-[#192234] text-[#94a3b8] hover:border-amber-500/30'}`}>
                  {o === 'eu' ? <><User size={12} /> Eu</> : <><Users size={12} /> Noiva</>}
                </button>
              ))}
            </div>
          </div>

          {/* Prévia em Destaque */}
          <div>
            <label className={labelCls}>Pré-visualização do Cartão</label>
            <CardVisual 
              image={form.image} 
              cardName={form.name || 'Nome do Cartão'} 
              digits={form.digits || '•••• 0000'} 
              variant="full" 
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#192234] text-xs text-[#94a3b8] hover:bg-[#121927] transition-all cursor-pointer">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition-all cursor-pointer flex items-center justify-center gap-2">
              <Check size={14} /> Salvar
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirm label={deleteTarget.name} onCancel={() => setDeleteTarget(null)} onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }} />
      )}
    </div>
  );
}

// ─── MODULE 2: Contas Bancárias (Com Seleção Visual PNG) ───────────────────────

function AccountsManager({ accounts, onAdd, onEdit, onDelete }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_ACCOUNT);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => { setForm(EMPTY_ACCOUNT); setModal('add'); };
  const openEdit = (acc) => { 
    setForm({ 
      name: acc.name, 
      icon: acc.icon || acc.image || findBankPreset(acc.name)?.path || PRESET_BANK_ICONS[0].path 
    }); 
    setModal(acc); 
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const bankPreset = findBankPreset(form.icon || form.name);
    const payload = { 
      name: form.name.trim(), 
      icon: form.icon || bankPreset.path 
    };
    if (modal === 'add') onAdd({ id: uid(), type: 'corrente', balance: 0, ...payload });
    else onEdit({ ...modal, ...payload }, modal);
    setModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#64748b]">{accounts.length} conta(s) cadastrada(s)</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 transition-all cursor-pointer">
          <Plus size={14} /> Nova Conta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {accounts.map(acc => (
          <div key={acc.id} className="p-4 rounded-2xl bg-[#0d1320] border border-[#192234] hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3 group shadow-md">
            <div className="flex items-center gap-3">
              <BankIcon src={acc.icon || acc.image} bankName={acc.name} size="lg" />
              <div>
                <p className="text-sm font-bold text-white">{acc.name}</p>
                <p className="text-[10px] text-[#64748b] font-mono mt-0.5">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.balance || 0)}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg bg-[#121927] text-[#94a3b8] hover:text-white border border-[#192234] transition-all cursor-pointer"><Pencil size={13} /></button>
              <button onClick={() => setDeleteTarget(acc)} className="p-1.5 rounded-lg bg-[#121927] text-[#94a3b8] hover:text-red-400 border border-[#192234] transition-all cursor-pointer"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="py-12 text-center text-[#475569] text-sm border border-dashed border-[#192234] rounded-2xl">
          Nenhuma conta cadastrada.
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Nova Conta Bancária' : `Editar — ${modal.name}`} onClose={() => setModal(null)}>
          <div>
            <label className={labelCls}>Nome do Banco / Carteira</label>
            <input className={inputCls} placeholder="Ex: Nubank, Itaú, Dinheiro Físico" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
          </div>

          {/* SELEÇÃO VISUAL DO ÍCONE DO BANCO (PNG) */}
          <div>
            <label className={labelCls}>Selecione o Ícone do Banco (PNG)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1.5 bg-[#090d16] border border-[#192234] rounded-2xl">
              {PRESET_BANK_ICONS.map(b => {
                const isSelected = form.icon === b.path;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setForm(p => ({
                        ...p,
                        icon: b.path,
                        name: p.name || b.name
                      }));
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                      isSelected
                        ? 'border-2 border-[#00ff87] bg-[#00ff87]/15 shadow-[0_0_15px_rgba(0,255,135,0.35)] scale-[1.02]'
                        : 'bg-[#0d1320] border-[#192234] hover:border-cyan-500/40 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <BankIcon src={b.path} bankName={b.name} size="lg" />
                    <span className={`text-xs font-bold truncate w-full ${isSelected ? 'text-[#00ff87]' : 'text-white'}`}>
                      {b.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#192234] text-xs text-[#94a3b8] hover:bg-[#121927] transition-all cursor-pointer">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center justify-center gap-2">
              <Check size={14} /> Salvar
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirm label={deleteTarget.name} onCancel={() => setDeleteTarget(null)} onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }} />
      )}
    </div>
  );
}

// ─── MODULE 3: Categorias ─────────────────────────────────────────────────────

function CategoriesManager({ categories, onAdd, onEdit, onDelete }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const expenses = categories.filter(c => c.type === 'expense');
  const incomes  = categories.filter(c => c.type === 'income');

  const openAdd = () => { setForm(EMPTY_CATEGORY); setModal('add'); };
  const openEdit = (cat) => { setForm({ name: cat.name || cat.label, type: cat.type, emoji: cat.emoji }); setModal(cat); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), value: form.name.trim(), label: form.name.trim(), type: form.type, emoji: form.emoji };
    if (modal === 'add') onAdd({ id: uid(), ...payload });
    else onEdit({ ...modal, ...payload }, modal);
    setModal(null);
  };

  const CategoryRow = ({ cat }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1320] border border-[#192234] hover:border-emerald-500/30 transition-all group">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{cat.emoji}</span>
        <span className="text-sm text-white font-medium">{cat.name || cat.label}</span>
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg bg-[#121927] text-[#94a3b8] hover:text-white border border-[#192234] transition-all cursor-pointer"><Pencil size={13} /></button>
        <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg bg-[#121927] text-[#94a3b8] hover:text-red-400 border border-[#192234] transition-all cursor-pointer"><Trash2 size={13} /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#64748b]">{categories.length} categoria(s) cadastrada(s)</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all cursor-pointer">
          <Plus size={14} /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} className="text-rose-400" />
            <h5 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Saídas / Despesas ({expenses.length})</h5>
          </div>
          {expenses.map(c => <CategoryRow key={c.id || c.value} cat={c} />)}
          {expenses.length === 0 && <p className="text-xs text-[#475569] py-4 text-center border border-dashed border-[#192234] rounded-xl">Nenhuma categoria de despesa.</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-emerald-400" />
            <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Entradas / Receitas ({incomes.length})</h5>
          </div>
          {incomes.map(c => <CategoryRow key={c.id || c.value} cat={c} />)}
          {incomes.length === 0 && <p className="text-xs text-[#475569] py-4 text-center border border-dashed border-[#192234] rounded-xl">Nenhuma categoria de receita.</p>}
        </div>
      </div>

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Nova Categoria' : `Editar — ${modal.name || modal.label}`} onClose={() => setModal(null)}>
          <div>
            <label className={labelCls}>Nome da Categoria</label>
            <input className={inputCls} placeholder="Ex: Alimentação" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <div className="flex gap-2">
              {[{id:'expense',label:'Despesa (Saída)',icon:TrendingDown,color:'rose'},{id:'income',label:'Receita (Entrada)',icon:TrendingUp,color:'emerald'}].map(t => (
                <button key={t.id} type="button" onClick={() => setForm(p => ({...p, type: t.id, emoji: COMMON_EMOJIS[t.id][0]}))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    form.type === t.id
                      ? t.color === 'rose' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0d1320] border-[#192234] text-[#94a3b8] hover:border-amber-500/30'}`}>
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* SELETOR AVANÇADO DE EMOJIS COM SUGESTÃO POR IA */}
          <SmartEmojiPicker
            selectedEmoji={form.emoji}
            onSelect={e => setForm(p => ({ ...p, emoji: e }))}
            targetText={form.name}
            type={form.type}
            label="Emoji Representativo"
          />
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#192234] text-xs text-[#94a3b8] hover:bg-[#121927] transition-all cursor-pointer">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2">
              <Check size={14} /> Salvar
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirm label={deleteTarget.name || deleteTarget.label} onCancel={() => setDeleteTarget(null)} onConfirm={() => { onDelete(deleteTarget.id || deleteTarget.value); setDeleteTarget(null); }} />
      )}
    </div>
  );
}

// ─── MODULE 4: Gastos & Rendas Vigentes ──────────────────────────────────────

function RecurringManager({ items, onAdd, onEdit, onDelete }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_RECURRING);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const expenses = items.filter(i => i.type === 'expense');
  const incomes  = items.filter(i => i.type === 'income');

  const openAdd = (type = 'expense') => { setForm({...EMPTY_RECURRING, type, emoji: COMMON_EMOJIS[type][0]}); setModal('add'); };
  const openEdit = (item) => { setForm({ name: item.name, type: item.type, emoji: item.emoji, value: item.value || '' }); setModal(item); };

  const handleSave = () => {
    if (!form.name.trim() || !form.value) return;
    const payload = { name: form.name.trim(), type: form.type, emoji: form.emoji, value: parseFloat(form.value) || 0 };
    if (modal === 'add') onAdd({ id: uid(), ...payload });
    else onEdit({ ...modal, ...payload }, modal);
    setModal(null);
  };

  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const ItemRow = ({ item }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0d1320] border border-[#192234] hover:border-amber-500/30 transition-all group">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{item.emoji}</span>
        <div>
          <p className="text-sm text-white font-medium">{item.name}</p>
          <p className="text-[10px] text-[#64748b] font-mono">{fmt(item.value)}/mês</p>
        </div>
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-[#121927] text-[#94a3b8] hover:text-white border border-[#192234] transition-all cursor-pointer"><Pencil size={13} /></button>
        <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg bg-[#121927] text-[#94a3b8] hover:text-red-400 border border-[#192234] transition-all cursor-pointer"><Trash2 size={13} /></button>
      </div>
    </div>
  );

  const totalExpenses = expenses.reduce((s, i) => s + (i.value || 0), 0);
  const totalIncomes  = incomes.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#64748b]">{items.length} item(s) recorrente(s)</p>
        <div className="flex gap-2">
          <button onClick={() => openAdd('expense')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/25 transition-all cursor-pointer">
            <Plus size={13} /> Despesa
          </button>
          <button onClick={() => openAdd('income')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all cursor-pointer">
            <Plus size={13} /> Renda
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center">
          <p className="text-[10px] text-[#64748b] uppercase font-bold">Total Despesas Fixas</p>
          <p className="text-base font-black font-mono text-rose-400 mt-1">{fmt(totalExpenses)}/mês</p>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
          <p className="text-[10px] text-[#64748b] uppercase font-bold">Total Rendas Sólidas</p>
          <p className="text-base font-black font-mono text-emerald-400 mt-1">{fmt(totalIncomes)}/mês</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} className="text-rose-400" />
            <h5 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Despesas Fixas ({expenses.length})</h5>
          </div>
          {expenses.map(i => <ItemRow key={i.id} item={i} />)}
          {expenses.length === 0 && <p className="text-xs text-[#475569] py-4 text-center border border-dashed border-[#192234] rounded-xl">Nenhuma despesa fixa cadastrada.</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-emerald-400" />
            <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Rendas Sólidas ({incomes.length})</h5>
          </div>
          {incomes.map(i => <ItemRow key={i.id} item={i} />)}
          {incomes.length === 0 && <p className="text-xs text-[#475569] py-4 text-center border border-dashed border-[#192234] rounded-xl">Nenhuma renda sólida cadastrada.</p>}
        </div>
      </div>

      {modal !== null && (
        <Modal title={modal === 'add' ? `Novo Item Recorrente (${form.type === 'expense' ? 'Despesa' : 'Renda'})` : `Editar — ${modal.name}`} onClose={() => setModal(null)}>
          <div>
            <label className={labelCls}>Nome</label>
            <input className={inputCls} placeholder={form.type === 'expense' ? 'Ex: Plano de Saúde' : 'Ex: Salário Wesley'} value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
          </div>
          <div>
            <label className={labelCls}>Valor Mensal (R$)</label>
            <input type="number" className={inputCls} placeholder="0,00" step="0.01" value={form.value} onChange={e => setForm(p => ({...p, value: e.target.value}))} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <div className="flex gap-2">
              {[{id:'expense',label:'Despesa',icon:TrendingDown,color:'rose'},{id:'income',label:'Renda',icon:TrendingUp,color:'emerald'}].map(t => (
                <button key={t.id} type="button" onClick={() => setForm(p => ({...p, type: t.id, emoji: COMMON_EMOJIS[t.id][0]}))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    form.type === t.id
                      ? t.color === 'rose' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0d1320] border-[#192234] text-[#94a3b8] hover:border-amber-500/30'}`}>
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* SELETOR AVANÇADO DE EMOJIS COM SUGESTÃO POR IA */}
          <SmartEmojiPicker
            selectedEmoji={form.emoji}
            onSelect={e => setForm(p => ({ ...p, emoji: e }))}
            targetText={form.name}
            type={form.type}
            label="Emoji Representativo"
          />
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#192234] text-xs text-[#94a3b8] hover:bg-[#121927] transition-all cursor-pointer">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2">
              <Check size={14} /> Salvar
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirm label={deleteTarget.name} onCancel={() => setDeleteTarget(null)} onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }} />
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const MODULES = [
  { id: 'cards',      label: 'Cartões de Crédito',     icon: CreditCard, color: 'purple', description: 'Gerencie limites, datas e imagens' },
  { id: 'accounts',  label: 'Contas Bancárias',        icon: Landmark,   color: 'cyan',   description: 'Bancos, carteiras e ícones PNG' },
  { id: 'categories',label: 'Categorias',              icon: Tag,        color: 'emerald',description: 'Entradas e saídas por categoria' },
  { id: 'recurring', label: 'Gastos & Rendas Vigentes',icon: Repeat2,    color: 'amber',  description: 'Despesas fixas e rendas recorrentes' },
];

const COLOR_MAP = {
  purple:  { active: 'bg-purple-500/15 border-purple-500/40 text-purple-300',  glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',  header: 'from-purple-500/15',  icon: 'text-purple-400' },
  cyan:    { active: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',   header: 'from-cyan-500/15',    icon: 'text-cyan-400'   },
  emerald: { active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]', header: 'from-emerald-500/15', icon: 'text-emerald-400'},
  amber:   { active: 'bg-amber-500/15 border-amber-500/40 text-amber-300',     glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',  header: 'from-amber-500/15',   icon: 'text-amber-400'  },
};

export default function ControlCenterModule({
  // Cards
  cards, onAddCard, onEditCard, onDeleteCard,
  // Accounts
  bankAccounts, onAddAccount, onEditAccount, onDeleteAccount,
  // Categories
  categories, onAddCategory, onEditCategory, onDeleteCategory,
  // Recurring
  recurringItems, onAddRecurring, onEditRecurring, onDeleteRecurring,
}) {
  const [activeModule, setActiveModule] = useState('cards');
  const mod = MODULES.find(m => m.id === activeModule);
  const colors = COLOR_MAP[mod.color];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Settings2 size={22} />
            </div>
            <span>Central de Controle</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#94a3b8] sm:ml-[52px]">
            Cadastre cartões, contas com ícones PNG reais, categorias e rendas — tudo com sincronização em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Sincronizado • Imagens PNG
        </div>
      </div>

      {/* ── Module Tabs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {MODULES.map(m => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          const mc = COLOR_MAP[m.color];
          return (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? `${mc.active} ${mc.glow}`
                  : 'bg-[#0d1320] border-[#192234] text-[#64748b] hover:border-[#2a3a52] hover:text-[#94a3b8]'
              }`}
            >
              <Icon size={20} className={isActive ? mc.icon : 'text-[#475569]'} />
              <p className={`text-xs font-bold mt-2 ${isActive ? '' : 'text-[#94a3b8]'}`}>{m.label}</p>
              <p className={`text-[10px] mt-0.5 ${isActive ? 'opacity-80' : 'text-[#475569]'}`}>{m.description}</p>
            </button>
          );
        })}
      </div>

      {/* ── Active Module Panel ── */}
      <div className={`p-4 sm:p-6 rounded-3xl bg-[#0b0f19] border border-[#192234] space-y-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
        {/* Panel Header */}
        <div className={`flex items-center gap-3 pb-4 border-b border-[#192234]`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${COLOR_MAP[mod.color].active}`}>
            <mod.icon size={18} className={colors.icon} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">{mod.label}</h4>
            <p className="text-[11px] text-[#64748b]">{mod.description}</p>
          </div>
        </div>

        {/* Panel Content */}
        {activeModule === 'cards' && (
          <CardsManager cards={cards} onAdd={onAddCard} onEdit={onEditCard} onDelete={onDeleteCard} />
        )}
        {activeModule === 'accounts' && (
          <AccountsManager accounts={bankAccounts} onAdd={onAddAccount} onEdit={onEditAccount} onDelete={onDeleteAccount} />
        )}
        {activeModule === 'categories' && (
          <CategoriesManager categories={categories} onAdd={onAddCategory} onEdit={onEditCategory} onDelete={onDeleteCategory} />
        )}
        {activeModule === 'recurring' && (
          <RecurringManager items={recurringItems} onAdd={onAddRecurring} onEdit={onEditRecurring} onDelete={onDeleteRecurring} />
        )}
      </div>
    </div>
  );
}
