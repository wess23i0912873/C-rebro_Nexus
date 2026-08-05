import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, AlertTriangle, Trash2, ArrowUpRight, ArrowDownRight, Calendar, Building2, FileText, Check, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

function detectOwnerName(description) {
  if (!description) return "Titular";
  const clean = description.toLowerCase();
  const hasWesley = clean.includes("wesley");
  const hasStefany = clean.includes("stefany");
  if (hasWesley && hasStefany) return "Wesley & Stefany";
  if (hasWesley) return "Wesley";
  if (hasStefany) return "Stefany";
  return "Titular";
}

export default function ImportAuditModal({ 
  isOpen, 
  onClose, 
  bank, 
  parsedData, 
  isError, 
  onConfirm, 
  onDiscard 
}) {
  // Mapa de decisões para movimentações de titulares: { [transactionId]: 'internal' | 'real' | null }
  const [reviewDecisions, setReviewDecisions] = useState({});
  // Mapa de controle para expansão de texto de cada linha da tabela: { [transactionId]: boolean }
  const [expandedRowIds, setExpandedRowIds] = useState({});

  // Inicializar estado de decisões de titulares quando parsedData muda
  useEffect(() => {
    if (parsedData && parsedData.transactions) {
      const initialDecisions = {};
      parsedData.transactions.forEach(t => {
        if (t.requiresOwnerReview) {
          if (t.autoPreselectedReal) {
            initialDecisions[t.id] = 'real';
          } else {
            initialDecisions[t.id] = null;
          }
        }
      });
      setReviewDecisions(initialDecisions);
    }
  }, [parsedData]);

  // Alternar expansão de texto da linha da tabela
  const toggleRowExpand = (id) => {
    setExpandedRowIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Transações atualizadas em tempo real com base nas escolhas de revisão do usuário
  const updatedTransactions = useMemo(() => {
    if (!parsedData || !parsedData.transactions) return [];
    return parsedData.transactions.map(t => {
      if (t.requiresOwnerReview) {
        const decision = reviewDecisions[t.id];
        const isInternal = decision === 'internal';
        return {
          ...t,
          ownerDecision: decision,
          isInternalTransfer: isInternal
        };
      }
      return t;
    });
  }, [parsedData, reviewDecisions]);

  // Transações com revisão de titular necessária
  const ownerReviewItems = useMemo(() => {
    return updatedTransactions.filter(t => t.requiresOwnerReview);
  }, [updatedTransactions]);

  // Verificar se ainda há transações de titulares sem decisão (pendentes)
  const hasPendingReview = useMemo(() => {
    return ownerReviewItems.some(t => reviewDecisions[t.id] === null || reviewDecisions[t.id] === undefined);
  }, [ownerReviewItems, reviewDecisions]);

  // Recálculo dinâmico dos Totais de Fluxo de Caixa
  const dynamicTotalIncomes = useMemo(() => {
    return updatedTransactions
      .filter(t => !t.isInternalTransfer && t.ownerDecision !== null)
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + t.value, 0);
  }, [updatedTransactions]);

  const dynamicTotalExpenses = useMemo(() => {
    return updatedTransactions
      .filter(t => !t.isInternalTransfer && t.ownerDecision !== null)
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + t.value, 0);
  }, [updatedTransactions]);

  // Ações em Lote (Bulk Actions)
  const handleBulkSet = (decisionType) => {
    setReviewDecisions(prev => {
      const next = { ...prev };
      ownerReviewItems.forEach(item => {
        next[item.id] = decisionType;
      });
      return next;
    });
  };

  const handleDecision = (id, decisionType) => {
    setReviewDecisions(prev => ({
      ...prev,
      [id]: decisionType
    }));
  };

  const handleConfirmAction = () => {
    if (hasPendingReview) return;
    if (onConfirm) {
      onConfirm(updatedTransactions);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full ${ownerReviewItems.length > 0 ? 'max-w-6xl' : 'max-w-4xl'} bg-[#0b0f19] border border-[#192234] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,255,135,0.1)] overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300`}>
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#192234] bg-[#0d1320]/60">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-inner"
              style={{ backgroundColor: bank?.color || '#00ff87' }}
            >
              {bank?.logo ? (
                <span className="text-sm font-black tracking-tighter">{bank.logo}</span>
              ) : (
                <Building2 size={20} className="text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Auditoria de Extrato Bancário
                {isError ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    Erro no Arquivo
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30">
                    Pronto para Importar
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Banco Selecionado: <strong className="text-white">{bank?.name || 'Banco Desconhecido'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#121927] border border-[#192234] text-[#94a3b8] hover:text-white hover:border-[#00ff87]/50 flex items-center justify-center transition-all cursor-pointer"
            title="Fechar sem salvar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* TRATAMENTO DE ERRO SE ARQUIVO INVÁLIDO */}
          {isError ? (
            <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/30 flex flex-col items-center text-center space-y-4 my-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-red-200">Arquivo de Extrato Inválido ou Corrompido</h4>
                <p className="text-sm text-red-300/80 max-w-md">
                  O arquivo que você enviou provavelmente não é um extrato de banco válido. Analise novamente.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onDiscard}
                  className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Descartar e Tentar Novamente</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${ownerReviewItems.length > 0 ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-6 items-start`}>
              
              {/* LADO ESQUERDO: ÁREA PRINCIPAL */}
              <div className={`${ownerReviewItems.length > 0 ? 'lg:col-span-7 xl:col-span-7' : 'lg:col-span-1'} space-y-5`}>
                
                {/* 1. INFORMÁÇÕES DO PERÍODO E ARQUIVO (VERSÃO COMPACTA EM LINHA ÚNICA) */}
                <div className="p-3 px-4 rounded-xl bg-[#0d1320] border border-[#192234] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-[#00ff87]" />
                    <span className="text-[#94a3b8]">Período:</span>
                    <strong className="text-white font-semibold">{parsedData?.startDate || '01/08/2026'} até {parsedData?.endDate || '31/08/2026'}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-[#00ff87]" />
                    <span className="text-[#94a3b8]">Arquivo:</span>
                    <strong className="text-[#00ff87] font-mono">{parsedData?.fileName || 'extrato.ofx'}</strong>
                  </div>

                  <div className="flex items-center gap-1.5 text-[#94a3b8]">
                    <span>Data de importação:</span>
                    <strong className="text-white font-mono">Hoje</strong>
                  </div>
                </div>

                {/* 2. RESUMO FINANCEIRO DINÂMICO (ÍCONES FIXADOS NO CANTO SUPERIOR DIREITO ABSOLUTO) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Entradas */}
                  <div className="relative p-4 rounded-2xl bg-[#0d1320] border border-[#00ff87]/20 flex flex-col justify-between h-20 overflow-hidden">
                    <div>
                      <span className="text-xs text-[#94a3b8] font-medium block">Total Entradas</span>
                      <span className="text-lg font-black text-[#00ff87] font-mono mt-0.5 block">
                        + R$ {dynamicTotalIncomes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-[#00ff87]/10 text-[#00ff87] flex items-center justify-center pointer-events-none">
                      <ArrowDownRight size={18} />
                    </div>
                  </div>

                  {/* Total Saídas */}
                  <div className="relative p-4 rounded-2xl bg-[#0d1320] border border-red-500/20 flex flex-col justify-between h-20 overflow-hidden">
                    <div>
                      <span className="text-xs text-[#94a3b8] font-medium block">Total Saídas</span>
                      <span className="text-lg font-black text-red-400 font-mono mt-0.5 block">
                        - R$ {dynamicTotalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center pointer-events-none">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>

                  {/* Lançamentos Detectados */}
                  <div className="relative p-4 rounded-2xl bg-[#0d1320] border border-[#192234] flex flex-col justify-between h-20 overflow-hidden">
                    <div>
                      <span className="text-xs text-[#94a3b8] font-medium block">Total Lançamentos</span>
                      <span className="text-lg font-black text-white font-mono mt-0.5 block">
                        {updatedTransactions.length} itens
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-[#121927] text-white flex items-center justify-center font-bold text-xs pointer-events-none">
                      #{updatedTransactions.length}
                    </div>
                  </div>
                </div>

                {/* 3. MINI-TABELA DE VALIDAÇÃO VISUAL (COM EXPANSÃO INTERATIVA DE TEXTO) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-[#00ff87]" />
                      Validação Visual (5 Primeiras Transações)
                    </h4>
                    <span className="text-[11px] text-[#64748b]">
                      Clique para expandir/recolher descrições longas
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#192234] bg-[#0d1320] overflow-hidden">
                    <table className="w-full text-left text-xs table-fixed">
                      <thead>
                        <tr className="border-b border-[#192234] bg-[#0a0e17] text-[#64748b] font-medium">
                          <th className="py-3 px-4 w-[95px]">Data</th>
                          <th className="py-3 px-4 w-[50%]">Descrição</th>
                          <th className="py-3 px-4 w-[125px]">Categoria</th>
                          <th className="py-3 px-4 text-right w-[115px]">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#192234]">
                        {updatedTransactions.slice(0, 5).map((item, idx) => {
                          const itemId = item.id || `row-${idx}`;
                          const isExpanded = !!expandedRowIds[itemId];

                          return (
                            <tr 
                              key={itemId} 
                              onClick={() => toggleRowExpand(itemId)}
                              className={`transition-colors cursor-pointer ${
                                item.isInternalTransfer ? 'bg-[#0a0e17]/40 hover:bg-[#121927]/30' : 'hover:bg-[#121927]/60'
                              }`}
                            >
                              <td className="py-3 px-4 font-mono text-[#94a3b8] whitespace-nowrap align-top pt-3.5">
                                {item.date}
                              </td>

                              <td className="py-3 px-4 font-medium text-white align-top">
                                <div className="flex items-start gap-2">
                                  {/* Ícone discreto para expandir/recolher */}
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpand(itemId);
                                    }}
                                    className="mt-0.5 text-[#64748b] hover:text-[#00ff87] transition-colors shrink-0 cursor-pointer"
                                    title={isExpanded ? "Recolher texto" : "Expandir texto completo"}
                                  >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <span 
                                      className={`block transition-all ${
                                        isExpanded 
                                          ? 'whitespace-normal break-words font-semibold text-white' 
                                          : 'truncate'
                                      } ${item.isInternalTransfer ? 'text-[#94a3b8]' : 'text-white'}`}
                                      title={item.description}
                                    >
                                      {item.description}
                                    </span>
                                    {item.isInternalTransfer && (
                                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#192234] text-[#94a3b8] border border-[#334155]">
                                        Ignorado
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap align-top pt-3.5">
                                {item.isInternalTransfer ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#192234] text-[#94a3b8] border border-[#334155] inline-block">
                                    Transf. Interna
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#121927] text-[#94a3b8] border border-[#192234] inline-block truncate max-w-[115px]" title={item.category}>
                                    {item.category || 'Geral'}
                                  </span>
                                )}
                              </td>

                              <td className={`py-3 px-4 text-right font-bold font-mono whitespace-nowrap align-top pt-3.5 ${
                                item.isInternalTransfer
                                  ? 'text-[#64748b]'
                                  : item.type === 'receita'
                                  ? 'text-[#00ff87]'
                                  : 'text-red-400'
                              }`}>
                                {item.type === 'receita' ? '+' : '-'} R$ {Math.abs(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* LADO DIREITO: SIDEBAR DE REVISÃO DE TITULARES */}
              {ownerReviewItems.length > 0 && (
                <div className="lg:col-span-5 xl:col-span-5 p-5 rounded-2xl bg-[#0d1320] border-2 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.12)] flex flex-col space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar">
                  
                  {/* Cabeçalho da Sidebar (Destaque Máximo de Tipografia) */}
                  <div className="space-y-2 pb-3 border-b border-[#192234]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <UserCheck size={20} />
                      </div>
                      <h4 className="text-xl font-extrabold text-white tracking-tight">
                        Revisão Necessária
                      </h4>
                    </div>
                    <p className="text-xs text-[#94a3b8]">
                      Movimentações detectadas nos nomes dos titulares (Wesley / Stefany).
                    </p>

                    {/* Botões de Ação em Lote (Bulk Actions) Compactos */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleBulkSet('internal')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#192234] hover:bg-[#1f2b42] text-[#94a3b8] hover:text-white border border-[#334155] text-[11px] font-medium transition-all cursor-pointer text-center truncate"
                        title="Marcar todas como Internas (Ignorar)"
                      >
                        Marcar todas Internas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkSet('real')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00ff87]/15 hover:bg-[#00ff87]/25 text-[#00ff87] border border-[#00ff87]/40 text-[11px] font-bold transition-all cursor-pointer text-center truncate"
                        title="Marcar todas como Receita (Somar)"
                      >
                        Marcar todas Receita
                      </button>
                    </div>
                  </div>

                  {/* Cards Verticais Estruturados por Item */}
                  <div className="space-y-3">
                    {ownerReviewItems.map(item => {
                      const decision = reviewDecisions[item.id];
                      const ownerName = detectOwnerName(item.description);

                      return (
                        <div 
                          key={item.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col space-y-3 ${
                            decision === null
                              ? 'bg-amber-950/25 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                              : decision === 'internal'
                              ? 'bg-[#06090e] border-[#192234] opacity-80'
                              : 'bg-[#06090e] border-[#00ff87]/40'
                          }`}
                        >
                          {/* 1. TOPO: VALOR DA TRANSAÇÃO EM DESTAQUE */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xl font-black font-mono ${
                              decision === 'internal' 
                                ? 'text-[#64748b]' 
                                : item.type === 'receita' 
                                ? 'text-[#00ff87]' 
                                : 'text-red-400'
                            }`}>
                              {item.type === 'receita' ? '+' : '-'} R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>

                            {/* Badge de Status Compacta */}
                            {decision === null ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                                Pendente
                              </span>
                            ) : decision === 'internal' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#192234] text-[#94a3b8] border border-[#334155]">
                                Ignorado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30 font-bold">
                                Somado
                              </span>
                            )}
                          </div>

                          {/* 2. SECUNDÁRIO: BADGES LADO A LADO (DATA & NOME TITULAR) */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#121927] text-[#94a3b8] border border-[#192234] text-[10px] font-mono font-medium">
                              📅 {item.date}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                              👤 {ownerName}
                            </span>
                            {item.autoPreselectedReal && decision === 'real' && (
                              <span className="px-2 py-0.5 rounded-md bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20 text-[10px] font-mono">
                                ⚡ Salário
                              </span>
                            )}
                          </div>

                          {/* 3. DESCRIÇÃO COMPLETA */}
                          <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed" title={item.description}>
                            {item.description}
                          </p>

                          {/* 4. BOTÕES DE AÇÃO LADO A LADO ENCURTADOS */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDecision(item.id, 'internal')}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer truncate ${
                                decision === 'internal'
                                  ? 'bg-[#192234] text-white border-white/40 font-bold shadow-md'
                                  : 'bg-[#121927] text-[#94a3b8] hover:text-white border-[#192234]'
                              }`}
                            >
                              Ignorar (Interna)
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDecision(item.id, 'real')}
                              className={`px-3 py-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer truncate ${
                                decision === 'real'
                                  ? 'bg-[#00ff87] text-black border-[#00ff87] shadow-[0_0_15px_rgba(0,255,135,0.4)]'
                                  : 'bg-[#121927] text-[#00ff87] hover:bg-[#00ff87]/10 border-[#00ff87]/30'
                              }`}
                            >
                              Somar (Receita)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé com Botões de Ação e Trava de Segurança */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#192234] bg-[#0d1320]/90">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#192234] text-[#94a3b8] hover:text-white hover:bg-[#121927] font-semibold text-sm transition-all cursor-pointer"
          >
            Cancelar
          </button>

          {!isError ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onDiscard}
                className="px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 font-semibold text-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Descartar</span>
              </button>

              <button
                onClick={handleConfirmAction}
                disabled={hasPendingReview}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  hasPendingReview
                    ? 'bg-[#192234] text-[#64748b] border border-[#334155] cursor-not-allowed opacity-60'
                    : 'bg-[#00ff87] text-black shadow-[0_0_25px_rgba(0,255,135,0.4)] hover:shadow-[0_0_35px_rgba(0,255,135,0.6)] hover:bg-[#26ff98]'
                }`}
                title={hasPendingReview ? 'Resolva todas as decisões de titulares pendentes para habilitar a confirmação' : 'Confirmar e salvar'}
              >
                <Check size={18} strokeWidth={3} />
                <span>Confirmar e Armazenar no Sistema</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onDiscard}
              className="px-6 py-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 size={16} />
              <span>Descartar Arquivo</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
