import React from 'react';
import { Check, Loader2, Clock, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Indicador de sincronização do Header
 * Estados:
 * - 'saved': Salvo às HH:MM ✓
 * - 'saving': Salvando…
 * - 'pending': Pendente (não salvo ainda)
 * - 'offline': Sem conexão (salvo só neste aparelho)
 * - 'error': Erro ao salvar (com botão Tentar de novo)
 */
export default function SyncStatusBadge({
  status = 'saved', // 'saved' | 'saving' | 'pending' | 'offline' | 'error'
  lastSavedAt = null,
  error = '',
  onRetry = () => {},
}) {
  const formatTime = (dateOrStr) => {
    if (!dateOrStr) {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (status === 'saving') {
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] animate-pulse"
        title="Gravando alterações na Planilha Google..."
      >
        <Loader2 size={13} className="animate-spin text-cyan-400" />
        <span>Salvando…</span>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
        title="Alterações locais salvas no navegador. Aguardando envio para a planilha."
      >
        <Clock size={13} className="text-amber-400" />
        <span>Pendente (não salvo ainda)</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/30"
        title="Sem conexão com a internet. Os dados estão seguros no navegador e serão sincronizados ao reconectar."
      >
        <WifiOff size={13} className="text-slate-400" />
        <span>Sem conexão (salvo só neste aparelho)</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-red-500/10 text-red-300 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          title={error ? `Falha ao salvar: ${error}` : 'Falha ao sincronizar com a Planilha Google.'}
        >
          <AlertTriangle size={13} className="text-red-400" />
          <span>Erro ao salvar</span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#121927] border border-red-500/40 text-red-300 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer shadow-sm"
          title="Tentar salvar novamente agora"
        >
          <RefreshCw size={11} />
          <span>Tentar de novo</span>
        </button>
      </div>
    );
  }

  // Padrão: 'saved' (Salvo)
  const timeStr = formatTime(lastSavedAt);
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30 shadow-[0_0_12px_rgba(0,255,135,0.15)]"
      title={lastSavedAt ? `Todas as alterações foram confirmadas pela Planilha Google às ${timeStr}.` : 'Sincronizado com a Planilha Google.'}
    >
      <Check size={13} className="text-[#00ff87]" />
      <span>Salvo{timeStr ? ` às ${timeStr}` : ''} ✓</span>
    </div>
  );
}
