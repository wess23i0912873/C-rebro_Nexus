import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Sparkles, X, ChevronDown, Check, Smile, Keyboard, Plus } from 'lucide-react';
import { EMOJI_CATEGORIES, getSuggestedEmojis } from '../constants/emojiLibrary';

/**
 * Seletor Universal Completo de Emojis (+1.800 opções Unicode) com IA de sugestão automática e digitação manual livre
 */
export default function SmartEmojiPicker({
  selectedEmoji = '🏷️',
  onSelect,
  targetText = '', // Texto digitado no campo de nome (para sugestão inteligente)
  type = 'expense', // 'expense' | 'income'
  label = 'Emoji Representativo',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customInput, setCustomInput] = useState('');

  // Total de emojis na biblioteca
  const totalEmojiCount = useMemo(() => {
    return EMOJI_CATEGORIES.reduce((acc, cat) => acc + cat.emojis.length, 0);
  }, []);

  // Emojis sugeridos dinamicamente pelo texto digitado
  const suggestedList = useMemo(() => {
    return getSuggestedEmojis(targetText, type);
  }, [targetText, type]);

  // Lista de emojis filtrados por categoria ou busca
  const displayEmojis = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    if (term) {
      const all = EMOJI_CATEGORIES.flatMap(cat => cat.emojis);
      // Filtra ou busca
      return Array.from(new Set(all));
    }

    if (activeCategory !== 'all') {
      const cat = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
      return cat ? cat.emojis : [];
    }

    return EMOJI_CATEGORIES.flatMap(cat => cat.emojis);
  }, [activeCategory, searchTerm]);

  const handleChoose = (emoji) => {
    if (!emoji) return;
    onSelect(emoji);
    setIsOpen(false);
    setSearchTerm('');
    setCustomInput('');
  };

  const handleApplyCustom = (e) => {
    e?.preventDefault();
    const clean = customInput.trim();
    if (clean) {
      handleChoose(clean);
    }
  };

  return (
    <div className={`space-y-2 relative ${className}`}>
      
      {/* 1. SEÇÃO DE SUGESTÕES INTELIGENTES EM TEMPO REAL */}
      {suggestedList && suggestedList.length > 0 && (
        <div className="space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#00ff87] flex items-center gap-1.5">
              <Sparkles size={12} className="animate-pulse text-[#00ff87]" />
              Sugestões Automáticas para "{targetText.trim() || (type === 'income' ? 'Renda' : 'Despesa')}":
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {suggestedList.map((emoji, idx) => {
              const isCurrent = selectedEmoji === emoji;
              return (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  onClick={() => onSelect(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'border-2 border-[#00ff87] bg-[#00ff87]/20 shadow-[0_0_12px_rgba(0,255,135,0.4)] scale-105'
                      : 'border border-[#192234] bg-[#0d1320] hover:border-[#00ff87]/50 hover:bg-[#121927] hover:scale-105'
                  }`}
                  title="Clique para selecionar este emoji"
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. BOTÃO GATILHO PARA ABRIR A BIBLIOTECA COMPLETA */}
      <div className="space-y-1">
        <label className="block text-[11px] text-[#64748b] uppercase tracking-wider font-bold">
          {label}
        </label>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#0d1320] border border-[#192234] hover:border-amber-500/50 transition-all cursor-pointer group shadow-inner"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
              {selectedEmoji || '🏷️'}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">
                Emoji Ativo: <span className="text-amber-300 font-mono text-sm ml-1">{selectedEmoji}</span>
              </span>
              <span className="text-[10px] text-[#64748b]">
                Clique para abrir o seletor completo (+{totalEmojiCount} emojis disponíveis)
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-lg bg-[#121927] border border-[#192234] flex items-center justify-center text-[#94a3b8] group-hover:text-white group-hover:border-amber-500/40 transition-all">
            <Smile size={16} />
          </div>
        </button>
      </div>

      {/* 3. MODAL COMPLETO DE EMOJIS (MODAL FLUTUANTE UNIVERSAL COM ROLAGEM E DIGITAÇÃO LIVRE) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#080c14] border border-[#192234] rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.2)] space-y-4 max-h-[92vh] flex flex-col">
            
            {/* Topo do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#192234] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <Smile size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Biblioteca Universal de Emojis</h3>
                  <p className="text-xs text-[#94a3b8]">Todos os emojis Unicode disponíveis (+{totalEmojiCount} opções)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-[#121927] border border-[#192234] text-[#64748b] hover:text-white hover:border-red-500/40 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* DIGITAÇÃO / COLAGEM MANUAL LIVRE DE QUALQUER EMOJI */}
            <form onSubmit={handleApplyCustom} className="p-3 rounded-2xl bg-[#0d1320] border border-[#192234] flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-[#94a3b8] shrink-0">
                <Keyboard size={15} className="text-amber-400" />
                <span className="font-semibold text-white">Cole ou digite qualquer emoji:</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:flex-1">
                <input
                  type="text"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="Cole aqui ou aperte Win + . para abrir o teclado de emojis"
                  className="flex-1 h-9 bg-[#121927] border border-[#192234] rounded-xl px-3 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-amber-500/60 transition-all text-center sm:text-left"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-4 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 disabled:opacity-40 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Check size={13} /> Usar Este
                </button>
              </div>
            </form>

            {/* BARRA DE NAVEGAÇÃO DE CATEGORIAS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar text-xs shrink-0">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeCategory === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-[#0d1320] text-[#94a3b8] border border-[#192234] hover:text-white hover:bg-[#121927]'
                }`}
              >
                🌟 Todos (+{totalEmojiCount})
              </button>

              {EMOJI_CATEGORIES.map(cat => {
                const isCatActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isCatActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-[#0d1320] text-[#94a3b8] border border-[#192234] hover:text-white hover:bg-[#121927]'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* GRID GIGANTE DE EMOJIS (+1.800 EMOJIS) */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 overflow-y-auto custom-scrollbar flex-1 p-2 bg-[#05080e] rounded-2xl border border-[#192234]">
              {displayEmojis.map((emoji, idx) => {
                const isSelected = selectedEmoji === emoji;
                return (
                  <button
                    key={`${emoji}-${idx}`}
                    type="button"
                    onClick={() => handleChoose(emoji)}
                    className={`h-11 rounded-xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-110'
                        : 'hover:bg-[#121927] hover:scale-120 active:scale-95'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>

            {/* Rodapé Informativo com Ação de Fechar */}
            <div className="flex items-center justify-between text-xs text-[#64748b] pt-2 border-t border-[#192234] shrink-0">
              <span className="text-[11px]">
                Exibindo <strong>{displayEmojis.length}</strong> emojis nesta visualização
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold hover:bg-amber-500/25 transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
