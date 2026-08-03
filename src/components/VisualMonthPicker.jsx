import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, X } from 'lucide-react';
import { createPortal } from 'react-dom';

// Custom Trigger Input: APENAS o Ícone de Calendário Discreto
const CustomCalendarIconInput = forwardRef(({ onClick }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    title="Selecione o Mês"
    className="p-1.5 rounded-xl bg-[#121927] border border-[#192234] text-[#00ff87] hover:bg-[#182236] hover:border-[#00ff87]/50 transition-all cursor-pointer flex items-center justify-center shadow-[0_0_10px_rgba(0,255,135,0.1)]"
  >
    <Calendar size={18} className="text-[#00ff87]" />
  </button>
));

export default function VisualMonthPicker({ selectedMonth, onSelectMonth, onReset }) {
  const formatMonthYear = (d) => {
    if (!d) return '';
    const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const year = d.getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)}/${year}`;
  };

  const hasFilter = Boolean(selectedMonth);

  return (
    <div className="flex items-center gap-1.5 bg-[#121927] p-1 rounded-xl border border-[#192234]">
      {/* DatePicker no modo Mês/Ano */}
      <DatePicker
        selected={selectedMonth}
        onChange={(date) => onSelectMonth(date)}
        showMonthYearPicker
        dateFormat="MM/yyyy"
        customInput={<CustomCalendarIconInput />}
        popperContainer={({ children }) => createPortal(children, document.body)}
        popperPlacement="bottom-end"
        isClearable={false}
      />

      {/* Se houver mês customizado selecionado: exibe etiqueta (ex: Jul/2026) e o botão X */}
      {hasFilter && (
        <div className="flex items-center gap-1.5 pl-1 pr-1.5 animate-fadeIn">
          <span className="text-xs font-mono font-semibold text-[#00ff87]">
            {formatMonthYear(selectedMonth)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            title="Restaurar Mês Atual"
            className="p-0.5 rounded-md text-[#64748b] hover:text-red-400 hover:bg-[#182236] transition-all cursor-pointer flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
