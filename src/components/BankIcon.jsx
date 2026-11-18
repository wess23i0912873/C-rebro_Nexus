import React, { useState } from 'react';
import { findBankPreset } from '../constants/assetOptions';
import { publicAssetUrl } from '../lib/publicAssetUrl';

/**
 * Componente reutilizável para exibição de ícones de Bancos com fallback elegante
 */
export default function BankIcon({ 
  src, 
  bankName = '', 
  size = 'md', 
  className = '',
  showBorder = false 
}) {
  const [hasError, setHasError] = useState(false);
  const preset = findBankPreset(src || bankName);

  // Mapeamento de tamanhos
  const sizeMap = {
    xs: 'w-5 h-5 text-[9px] rounded-md',
    sm: 'w-6 h-6 text-[10px] rounded-lg',
    md: 'w-8 h-8 text-xs rounded-xl',
    lg: 'w-10 h-10 text-sm rounded-xl',
    xl: 'w-12 h-12 text-base rounded-2xl'
  };

  const currentSizeClass = sizeMap[size] || (typeof size === 'string' && size.includes('w-') ? size : sizeMap.md);

  // Caminho da imagem: usa src fornecido ou infere do preset
  const imageSrc = publicAssetUrl(src || preset?.path);

  if (imageSrc && !hasError) {
    return (
      <div className={`relative shrink-0 overflow-hidden flex items-center justify-center ${currentSizeClass} ${showBorder ? 'border border-white/10' : ''} ${className}`}>
        <img
          src={imageSrc}
          alt={bankName || preset?.name || 'Banco'}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain object-center rounded-[inherit]"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback visual estilizado (Squircle com cor de marca e abreviação do banco)
  return (
    <div 
      className={`shrink-0 flex items-center justify-center font-black select-none shadow-sm ${currentSizeClass} ${showBorder ? 'border border-white/10' : ''} ${className}`}
      style={{
        backgroundColor: preset?.bgColor || '#1e293b',
        color: preset?.textColor || '#ffffff'
      }}
      title={bankName || preset?.name}
    >
      <span className="leading-none text-center truncate px-0.5">
        {preset?.shortName || (bankName ? bankName.slice(0, 2).toUpperCase() : '🏛️')}
      </span>
    </div>
  );
}
