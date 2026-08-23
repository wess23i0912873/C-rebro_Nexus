import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle2, Lock, AlertCircle, ArrowLeftRight } from 'lucide-react';
import ImportAuditModal from './ImportAuditModal';
import { processStatementFile } from '../lib/statementParser';
import BankIcon from './BankIcon';
import { PRESET_BANK_ICONS } from '../constants/assetOptions';

const BANK_OPTIONS = PRESET_BANK_ICONS;

export default function ImportStatementFlow({ onImportSuccess }) {
  const [selectedBank, setSelectedBank] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estado para pop-up de divergência de banco
  const [mismatchInfo, setMismatchInfo] = useState(null);

  // Leitura e Parsing Real do Arquivo Enviado
  const handleFileProcess = useCallback(async (file) => {
    setIsProcessing(true);
    try {
      const data = await processStatementFile(file);
      setIsError(false);

      // Checagem preventiva de Divergência de Banco
      if (
        data &&
        data.detectedBank &&
        selectedBank &&
        selectedBank.id !== 'outros' &&
        data.detectedBank.id !== selectedBank.id
      ) {
        setMismatchInfo({
          detectedBank: data.detectedBank,
          selectedBank: selectedBank,
          parsedData: data
        });
      } else {
        setParsedData(data);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.warn('Erro ao processar o arquivo de extrato:', err);
      setIsError(true);
      setParsedData(null);
      setIsModalOpen(true);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedBank]);

  const onDrop = useCallback((acceptedFiles) => {
    if (!selectedBank) return;
    if (acceptedFiles && acceptedFiles.length > 0) {
      handleFileProcess(acceptedFiles[0]);
    }
  }, [selectedBank, handleFileProcess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !selectedBank || isProcessing,
    multiple: false
  });

  const handleSwitchToDetectedBank = () => {
    if (!mismatchInfo) return;
    const fullDetectedBank = BANK_OPTIONS.find(b => b.id === mismatchInfo.detectedBank.id) || mismatchInfo.detectedBank;
    setSelectedBank(fullDetectedBank);
    setParsedData(mismatchInfo.parsedData);
    setMismatchInfo(null);
    setIsModalOpen(true);
  };

  const handleContinueWithSelectedBank = () => {
    if (!mismatchInfo) return;
    setParsedData(mismatchInfo.parsedData);
    setMismatchInfo(null);
    setIsModalOpen(true);
  };

  const handleConfirmImport = () => {
    if (parsedData && parsedData.transactions && onImportSuccess) {
      onImportSuccess(parsedData.transactions, selectedBank);
    }
    setIsModalOpen(false);
    setParsedData(null);
  };

  const handleDiscard = () => {
    setIsModalOpen(false);
    setParsedData(null);
    setIsError(false);
    setMismatchInfo(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* SELEÇÃO DO BANCO (MINIMALISTA) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white text-center">
          Selecione o banco
        </h3>

        {/* Grid de Bancos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {BANK_OPTIONS.map((bank) => {
            const isSelected = selectedBank?.id === bank.id;
            return (
              <button
                key={bank.id}
                onClick={() => setSelectedBank(bank)}
                className={`group relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'border-[#00ff87] bg-[#00ff87]/10 shadow-[0_0_25px_rgba(0,255,135,0.3)] scale-[1.03]'
                    : 'border-[#192234] bg-[#0b0f19] hover:bg-[#101625] hover:border-[#00ff87]/40'
                }`}
              >
                {/* Badge Indicador de Ativo */}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00ff87] text-black flex items-center justify-center shadow-[0_0_10px_rgba(0,255,135,0.6)]">
                    <CheckCircle2 size={13} strokeWidth={3} />
                  </span>
                )}

                {/* Logo / Ícone PNG Real */}
                <BankIcon 
                  src={bank.path} 
                  bankName={bank.name} 
                  size="xl" 
                  className="w-14 h-14 rounded-2xl shadow-md group-hover:scale-110 transition-transform" 
                />

                <h4 className={`text-xs font-bold text-center truncate w-full transition-colors ${isSelected ? 'text-[#00ff87]' : 'text-white group-hover:text-[#00ff87]'}`}>
                  {bank.name}
                </h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* ÁREA DE UPLOAD (DROPZONE MINIMALISTA) */}
      <div>
        <div
          {...getRootProps()}
          className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] ${
            !selectedBank
              ? 'border-[#192234] bg-[#080c14]/50 opacity-60 cursor-not-allowed'
              : isDragActive
              ? 'border-[#00ff87] bg-[#00ff87]/15 shadow-[0_0_40px_rgba(0,255,135,0.3)] scale-[1.01]'
              : 'border-[#192234] hover:border-[#00ff87]/50 bg-[#0b0f19] hover:bg-[#0d1320] cursor-pointer shadow-lg'
          }`}
        >
          <input {...getInputProps()} />

          {!selectedBank ? (
            /* Estado Bloqueado (Nenhum Banco Selecionado) */
            <div className="flex flex-col items-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#121927] border border-[#192234] flex items-center justify-center text-[#64748b]">
                <Lock size={26} />
              </div>
              <p className="text-sm text-[#94a3b8]">
                Selecione um banco acima para enviar o extrato
              </p>
            </div>
          ) : (
            /* Estado Desbloqueado / Limpo */
            <div className="flex flex-col items-center space-y-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isDragActive
                  ? 'bg-[#00ff87] text-black shadow-[0_0_30px_rgba(0,255,135,0.8)] scale-110'
                  : 'bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] shadow-[0_0_20px_rgba(0,255,135,0.15)]'
              }`}>
                <UploadCloud size={36} />
              </div>

              <p className="text-base font-semibold text-white max-w-lg">
                Arraste e solte o seu arquivo aqui ou clique para selecionar o arquivo no seu aparelho
              </p>
            </div>
          )}
        </div>
      </div>

      {/* POP-UP DE ADVERTÊNCIA DE DIVERGÊNCIA DE BANCO */}
      {mismatchInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0b0f19] border border-amber-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                Divergência de Banco Detectada
              </h3>
              <p className="text-sm text-[#94a3b8] leading-relaxed max-w-md mx-auto">
                Você selecionou <strong className="text-white">{mismatchInfo.selectedBank.name}</strong>, mas detectamos que este arquivo parece ser um extrato do <strong className="text-[#00ff87]">{mismatchInfo.detectedBank.name}</strong>.
              </p>
              <p className="text-xs text-[#64748b]">
                Deseja continuar ou gostaria de trocar a seleção automaticamente?
              </p>
            </div>

            {/* Comparativo Visual Lado a Lado */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#0d1320] border border-[#192234]">
              <div className="p-3 rounded-xl bg-[#06090e] border border-[#192234] flex flex-col items-center gap-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">Selecionado</span>
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md"
                  style={{ backgroundColor: mismatchInfo.selectedBank.color }}
                >
                  {mismatchInfo.selectedBank.logo}
                </div>
                <span className="text-xs font-bold text-white">{mismatchInfo.selectedBank.name}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#00ff87]/10 border border-[#00ff87]/40 flex flex-col items-center gap-2 relative">
                <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-[#00ff87] text-black text-[9px] font-black uppercase shadow-md">Detectado</span>
                <span className="text-[10px] text-[#00ff87] uppercase tracking-wider font-semibold">No Arquivo</span>
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md"
                  style={{ backgroundColor: mismatchInfo.detectedBank.color }}
                >
                  {mismatchInfo.detectedBank.logo}
                </div>
                <span className="text-xs font-bold text-[#00ff87]">{mismatchInfo.detectedBank.name}</span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleContinueWithSelectedBank}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#192234] text-[#94a3b8] hover:text-white hover:bg-[#121927] font-semibold text-xs transition-all cursor-pointer"
              >
                Continuar com {mismatchInfo.selectedBank.name}
              </button>

              <button
                type="button"
                onClick={handleSwitchToDetectedBank}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#00ff87] text-black font-bold text-xs shadow-[0_0_20px_rgba(0,255,135,0.4)] hover:bg-[#26ff98] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeftRight size={16} />
                <span>Trocar para {mismatchInfo.detectedBank.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORIA E RESUMO PRÉ-IMPORTAÇÃO */}
      <ImportAuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bank={selectedBank}
        parsedData={parsedData}
        isError={isError}
        onConfirm={handleConfirmImport}
        onDiscard={handleDiscard}
      />

    </div>
  );
}
