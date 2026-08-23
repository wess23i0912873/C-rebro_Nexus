import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Sparkles, X, ChevronDown, Check, Smile } from 'lucide-react';
import { EMOJI_CATEGORIES, getSuggestedEmojis } from '../constants/emojiLibrary';

/**
 * Componente avançado de seleção de emojis com IA de sugestão automática por texto
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
  const containerRef = useRef(null);

  // Emojis sugeridos dinamicamente pelo texto digitado
  const suggestedList = useMemo(() => {
    return getSuggestedEmojis(targetText, type);
  }, [targetText, type]);

  // Lista de emojis filtrados por busca e categoria
  const displayEmojis = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    // Se houver busca, pesquisa em todas as categorias
    if (term) {
      const all = EMOJI_CATEGORIES.flatMap(cat => cat.emojis);
      // Remove duplicados
      return Array.from(new Set(all));
    }

    // Se selecionou categoria específica
    if (activeCategory !== 'all') {
      const cat = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
      return cat ? cat.emojis : [];
    }

    // Se 'all', lista todos agrupados
    return EMOJI_CATEGORIES.flatMap(cat => cat.emojis);
  }, [activeCategory, searchTerm]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleChoose = (emoji) => {
    onSelect(emoji);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`space-y-2 relative ${className}`} ref={containerRef}>
      
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
                  title="Clique para selecionar"
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

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex items-center justify-between p-2.5 rounded-2xl bg-[#0d1320] border border-[#192234] hover:border-amber-500/50 transition-all cursor-pointer group shadow-inner"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                {selectedEmoji || '🏷️'}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block">
                  Emoji Selecionado: <span className="text-amber-300 font-mono text-sm">{selectedEmoji}</span>
                </span>
                <span className="text-[10px] text-[#64748b]">
                  Clique para abrir a biblioteca completa (+500 opções)
                </span>
              </div>
            </div>

            <div className={`w-8 h-8 rounded-lg bg-[#121927] border border-[#192234] flex items-center justify-center text-[#94a3b8] group-hover:text-white transition-all ${isOpen ? 'rotate-180 text-amber-400 border-amber-500/40' : ''}`}>
              <ChevronDown size={15} />
            </div>
          </button>
        </div>
      </div>

      {/* 3. POPOVER / PAINEL COMPLETO DE EMOJIS (MODAL FLUTUANTE ULTRA MODERNO) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-3xl bg-[#080c14] border border-[#192234] shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.15)] p-4 space-y-3.5 animate-fade-in">
          
          {/* Topo do Seletor com Fechar */}
          <div className="flex items-center justify-between pb-2 border-b border-[#192234]">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Smile size={16} className="text-amber-400" />
              <span>Biblioteca Universal de Emojis</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg bg-[#121927] border border-[#192234] text-[#64748b] hover:text-white hover:border-red-500/40 transition-all cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Barra de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar text-[11px]">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-[#0d1320] text-[#94a3b8] border border-[#192234] hover:text-white hover:bg-[#121927]'
              }`}
            >
              🌟 Todos
            </button>

            {EMOJI_CATEGORIES.map(cat => {
              const isCatActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchTerm('');
                  }}
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

          {/* Grid de Emojis em Alta Resolução */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1 bg-[#05080e] rounded-2xl border border-[#192234]">
            {displayEmojis.map((emoji, idx) => {
              const isSelected = selectedEmoji === emoji;
              return (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  onClick={() => handleChoose(emoji)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-110'
                      : 'hover:bg-[#121927] hover:scale-115 active:scale-95'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {/* Rodapé Informativo */}
          <div className="flex items-center justify-between text-[10px] text-[#64748b] pt-1">
            <span>Mais de 500 emojis universais organizados</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-amber-400 font-bold hover:underline cursor-pointer"
            >
              Concluir Seleção
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
