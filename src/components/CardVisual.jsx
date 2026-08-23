import React, { useState } from 'react';
import { Sparkles, CreditCard } from 'lucide-react';
import { findCardPreset } from '../constants/assetOptions';

/**
 * Componente de visualização de Cartões com suporte a PNG real e fallback premium
 */
export default function CardVisual({ 
  image, 
  cardName = '', 
  digits = '', 
  variant = 'full', // 'full' | 'compact' | 'thumbnail' | 'badge'
  className = '',
  accentColor
}) {
  const [hasError, setHasError] = useState(false);
  const preset = findCardPreset(image || cardName);

  const imageSrc = image || preset?.path;
  const cardDigits = digits || '•••• 0000';
  const displayName = cardName || preset?.name || 'Cartão de Crédito';

  // ── 1. Modo THUMBNAIL (Ideal para selects, tabelas de simulação e listas compactas)
  if (variant === 'thumbnail') {
    if (imageSrc && !hasError) {
      return (
        <div className={`relative w-11 h-7 rounded-lg overflow-hidden shrink-0 shadow-md border border-white/10 ${className}`}>
          <img
            src={imageSrc}
            alt={displayName}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <div 
        className={`w-11 h-7 rounded-lg shrink-0 flex flex-col justify-between p-1 shadow-md border border-white/10 bg-gradient-to-br ${preset?.gradient || 'from-slate-900 to-black'} ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="w-2.5 h-2 rounded-[2px] bg-amber-400/80"></div>
          <span className="text-[7px] font-mono text-white/70 font-bold">{preset?.bank?.slice(0, 3)}</span>
        </div>
        <span className="text-[7px] font-mono text-white/80 font-semibold truncate leading-none">
          {cardDigits.slice(-4)}
        </span>
      </div>
    );
  }

  // ── 2. Modo BADGE / ÍCONE MÉDIO (Para cabeçalhos de faturas)
  if (variant === 'badge') {
    if (imageSrc && !hasError) {
      return (
        <div className={`relative w-14 h-9 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/15 ${className}`}>
          <img
            src={imageSrc}
            alt={displayName}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>
      );
    }
    return (
      <div 
        className={`w-14 h-9 rounded-xl shrink-0 p-1.5 flex flex-col justify-between shadow-lg border border-white/15 bg-gradient-to-br ${preset?.gradient || 'from-slate-900 to-black'} ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="w-3.5 h-2.5 rounded-[2px] bg-gradient-to-tr from-amber-400 to-yellow-200 border border-amber-300/40"></div>
          <Sparkles size={10} className="text-white/60" />
        </div>
        <span className="text-[9px] font-mono text-white font-bold tracking-wider leading-none">
          {cardDigits.slice(-4)}
        </span>
      </div>
    );
  }

  // ── 3. Modo FULL (Layout de destaque para o Módulo de Cartões e Central de Controle)
  if (imageSrc && !hasError) {
    return (
      <div className={`relative w-full aspect-[1.58/1] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group ${className}`}>
        <img
          src={imageSrc}
          alt={displayName}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay sutil de reflexo com dados sobrepostos elegantes se necessário */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 pointer-events-none">
          <div className="flex items-end justify-between">
            <span className="text-xs font-mono font-bold text-white tracking-widest drop-shadow">
              {cardDigits}
            </span>
            <span className="text-[10px] uppercase font-bold text-white/90 drop-shadow">
              {displayName}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback FULL estilizado realista
  return (
    <div 
      className={`relative w-full aspect-[1.58/1] rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-2xl border ${preset?.border || 'border-white/15'} bg-gradient-to-br ${preset?.gradient || 'from-slate-900 via-neutral-950 to-black'} ${className}`}
    >
      {/* Detalhe de fundo */}
      <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full opacity-20 blur-xl pointer-events-none" style={{ backgroundColor: accentColor || preset?.accent || '#00ff87' }}></div>

      {/* Topo do Cartão */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 border border-amber-300/60 shadow-inner flex items-center justify-center">
            <span className="w-3.5 h-2.5 border border-amber-800/40 rounded-sm"></span>
          </div>
          <span className="text-xs font-bold text-white/90 font-display tracking-wide">{preset?.bank || 'NEXUS'}</span>
        </div>
        <Sparkles size={16} className="text-white/70" />
      </div>

      {/* Meio e Rodapé */}
      <div className="space-y-1 z-10">
        <p className="text-sm sm:text-base font-mono font-bold text-white tracking-widest drop-shadow">
          {cardDigits}
        </p>
        <div className="flex items-center justify-between text-[10px] text-[#94a3b8] font-medium pt-1">
          <span className="truncate uppercase max-w-[150px]">{displayName}</span>
          <span className="font-mono uppercase font-bold text-white/80">CREDIT</span>
        </div>
      </div>
    </div>
  );
}
