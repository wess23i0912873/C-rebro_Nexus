import React, { useState, useEffect } from 'react';
import { maskCurrencyInput, formatFloatToBRL, parseToFloat } from '../lib/currencyMask';

/**
 * Input universal com Máscara Monetária Brasileira (pt-BR)
 * Formata da direita para a esquerda: '1' -> '0,01' -> '15' -> '0,15' -> '2410335' -> '24.103,35'
 * Retorna no onChange o valor Float numérico puro (ex: 24103.35)
 */
export default function CurrencyInput({
  value,
  onChange,
  name,
  id,
  placeholder = '0,00',
  className = '',
  prefix = 'R$',
  disabled = false,
  autoFocus = false,
  required = false,
  onFocus,
  onBlur
}) {
  // Estado local para controle da string formatada no input
  const [displayValue, setDisplayValue] = useState(() => {
    if (value === 0 || value === '0' || value === '') return '';
    return formatFloatToBRL(value, false);
  });

  // Sincroniza se o valor pai mudar externamente
  useEffect(() => {
    if (value === 0 || value === '0' || value === '' || value === null || value === undefined) {
      // Se displayValue já era vazio, mantém vazio para placeholder
      if (!displayValue || displayValue === '0,00') {
        setDisplayValue('');
      }
    } else {
      const currentFloat = parseToFloat(displayValue);
      const incomingFloat = parseToFloat(value);
      if (currentFloat !== incomingFloat) {
        setDisplayValue(formatFloatToBRL(incomingFloat, false));
      }
    }
  }, [value]);

  const handleChange = (e) => {
    const rawVal = e.target.value;
    const { floatValue, displayValue: formatted } = maskCurrencyInput(rawVal);
    setDisplayValue(formatted);

    if (onChange) {
      // Passa o valor float puro para a aplicação
      // Também provê um objeto evento-like caso a função espere e.target.value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: floatValue,
          formattedValue: formatted
        }
      };
      
      // Suporta tanto onChange(floatValue) quanto onChange(event)
      if (typeof onChange === 'function') {
        onChange(syntheticEvent);
      }
    }
  };

  const handleKeyDown = (e) => {
    // Permite teclas de controle: Backspace, Tab, Enter, Delete, setas direcionais, Ctrl/Cmd + A, C, V, X
    const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (
      allowedKeys.includes(e.key) ||
      (e.ctrlKey || e.metaKey)
    ) {
      return;
    }

    // Bloqueia qualquer caractere que não seja dígito numérico (inclusive vírgulas, pontos e letras)
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative w-full flex items-center">
      {prefix && (
        <span className="absolute left-3 text-xs text-[#64748b] font-mono pointer-events-none select-none font-bold">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        required={required}
        className={`${prefix ? 'pl-9' : 'pl-3'} pr-3 ${className}`}
      />
    </div>
  );
}
