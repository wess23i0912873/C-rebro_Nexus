import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function getMenuPosition(anchor, optionCount) {
  const rect = anchor.getBoundingClientRect();
  const viewportPadding = 8;
  const width = Math.min(Math.max(rect.width, 240), window.innerWidth - viewportPadding * 2);
  const left = Math.min(
    Math.max(viewportPadding, rect.left),
    window.innerWidth - width - viewportPadding
  );
  const desiredHeight = Math.min(280, Math.max(48, optionCount * 42 + 12));
  const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
  const spaceAbove = rect.top - viewportPadding;
  const opensAbove = spaceBelow < Math.min(desiredHeight, 120) && spaceAbove > spaceBelow;
  const availableSpace = opensAbove ? spaceAbove : spaceBelow;
  const height = Math.min(desiredHeight, Math.max(80, availableSpace));

  return {
    left,
    top: opensAbove ? rect.top - height - 4 : rect.bottom + 4,
    width,
    maxHeight: height
  };
}

function hasSameValue(left, right) {
  return left !== undefined
    && left !== null
    && right !== undefined
    && right !== null
    && String(left) === String(right);
}

export default function FloatingSelect({
  value,
  options = [],
  onChange,
  label,
  emptyMessage = 'Nenhuma opção disponível',
  className = '',
  title,
  fallback
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selectedOption = options.find(option => hasSameValue(option.value, value));

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      if (triggerRef.current) {
        setPosition(getMenuPosition(triggerRef.current, options.length));
      }
    };

    const handlePointerDown = (event) => {
      if (
        !triggerRef.current?.contains(event.target)
        && !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    updatePosition();
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, options.length]);

  const menu = isOpen && position && createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label={label}
      className="rounded-xl bg-[#0b0f19] border border-[#192234] shadow-[0_10px_40px_rgba(0,0,0,0.95)] p-1.5 space-y-1 overflow-y-auto"
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
        zIndex: 99999
      }}
    >
      {options.length === 0 ? (
        <p className="px-2 py-2 text-xs text-[#64748b]">{emptyMessage}</p>
      ) : options.map(option => {
        const isSelected = hasSameValue(option.value, value);
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isSelected
                ? 'bg-[#00ff87]/15 text-[#00ff87] border border-[#00ff87]/30'
                : 'text-white hover:bg-[#121927]'
            }`}
          >
            {option.leading}
            <span className="truncate text-left">{option.label}</span>
            {option.detail && (
              <span className="ml-auto shrink-0 text-[10px] text-[#64748b]">{option.detail}</span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!isOpen && triggerRef.current) {
            setPosition(getMenuPosition(triggerRef.current, options.length));
          }
          setIsOpen(open => !open);
        }}
        className={className}
        title={title || selectedOption?.label || label}
      >
        {selectedOption ? (
          <>
            {selectedOption.leading}
            {selectedOption.triggerLabel && (
              <span className="truncate">{selectedOption.triggerLabel}</span>
            )}
          </>
        ) : fallback}
      </button>
      {menu}
    </>
  );
}
