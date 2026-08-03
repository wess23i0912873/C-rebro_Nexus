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
    title="Filtrar Período por Calendário"
    className="p-1.5 rounded-xl bg-[#121927] border border-[#192234] text-[#00ff87] hover:bg-[#182236] hover:border-[#00ff87]/50 transition-all cursor-pointer flex items-center justify-center shadow-[0_0_10px_rgba(0,255,135,0.1)]"
  >
    <Calendar size={18} className="text-[#00ff87]" />
  </button>
));

export default function VisualDateRangePicker({ startDate, endDate, onApplyRange, onReset }) {
  const handleChange = (dates) => {
    const [start, end] = dates;
    onApplyRange(start, end);
  };

  const formatDateShort = (d) => {
    if (!d) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const hasFilter = startDate && endDate;

  return (
    <div className="flex items-center gap-1.5 bg-[#121927] p-1 rounded-xl border border-[#192234]">
      {/* Botão Ícone do Calendário */}
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
        onChange={handleChange}
        customInput={<CustomCalendarIconInput />}
        popperContainer={({ children }) => createPortal(children, document.body)}
        popperPlacement="bottom-end"
        dateFormat="dd/MM/yyyy"
        isClearable={false}
        monthsShown={1}
      />

      {/* Se houver filtro ativo: Texto da Data + Botão X de Reset */}
      {hasFilter && (
        <div className="flex items-center gap-1.5 pl-1 pr-1.5 animate-fadeIn">
          <span className="text-xs font-mono font-semibold text-[#00ff87]">
            {formatDateShort(startDate)} - {formatDateShort(endDate)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            title="Limpar Filtro de Período"
            className="p-0.5 rounded-md text-[#64748b] hover:text-red-400 hover:bg-[#182236] transition-all cursor-pointer flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
