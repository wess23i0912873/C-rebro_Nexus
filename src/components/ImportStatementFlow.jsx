import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  CheckCircle2, 
  Lock, 
  AlertCircle, 
  ArrowLeftRight, 
  X, 
  Search, 
  MoreHorizontal,
  ChevronRight,
  Layers
} from 'lucide-react';
import ImportAuditModal from './ImportAuditModal';
import { processStatementFile } from '../lib/statementParser';
import BankIcon from './BankIcon';
import { PRESET_BANK_ICONS } from '../constants/assetOptions';

// Os 4 bancos principais em destaque
const PRIMARY_BANK_IDS = ['nubank', 'mercadopago', 'inter', 'itau'];

export default function ImportStatementFlow({ onImportSuccess }) {
  const [selectedBank, setSelectedBank] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOtherBanksModalOpen, setIsOtherBanksModalOpen] = useState(false);
  const [otherBankSearch, setOtherBankSearch] = useState('');
  
  const [parsedData, setParsedData] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estado para pop-up de divergência de banco
  const [mismatchInfo, setMismatchInfo] = useState(null);

  // 4 Bancos Principais
  const primaryBanks = useMemo(() => {
    return PRIMARY_BANK_IDS.map(id => PRESET_BANK_ICONS.find(b => b.id === id) || PRESET_BANK_ICONS[0]);
  }, []);

  // Lista de Outros Bancos filtrados para o Modal
  const filteredOtherBanks = useMemo(() => {
    const term = otherBankSearch.toLowerCase().trim();
    if (!term) return PRESET_BANK_ICONS;
    return PRESET_BANK_ICONS.filter(b => 
      b.name.toLowerCase().includes(term) || 
      b.shortName.toLowerCase().includes(term)
    );
  }, [otherBankSearch]);

  // Verifica se o banco atualmente selecionado é um dos 4 principais
  const isSelectedBankPrimary = useMemo(() => {
    if (!selectedBank) return false;
    return PRIMARY_BANK_IDS.includes(selectedBank.id);
  }, [selectedBank]);

  // O 5º slot: se o usuário escolheu um banco "Outro", exibe ele no 5º slot
  const fifthSlotBank = useMemo(() => {
    if (selectedBank && !isSelectedBankPrimary) {
      return selectedBank;
    }
    return PRESET_BANK_ICONS.find(b => b.id === 'outros') || {
      id: 'outros',
      name: 'Outros Bancos',
      shortName: 'Outros',
      path: '/imagens/icones_de_banco/icone_banco-outros.png'
    };
  }, [selectedBank, isSelectedBankPrimary]);

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
    const fullDetectedBank = PRESET_BANK_ICONS.find(b => b.id === mismatchInfo.detectedBank.id) || mismatchInfo.detectedBank;
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

  const handleSelectOtherBank = (bank) => {
    setSelectedBank(bank);
    setIsOtherBanksModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* SELEÇÃO DO BANCO: 4 PRINCIPAIS + 5º OUTROS */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white text-center">
          Selecione o banco
        </h3>

        {/* Grid de 5 Botões (4 Principais + 5º Outros) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 max-w-4xl mx-auto">
          
          {/* Os 4 Bancos Principais */}
          {primaryBanks.map((bank) => {
            const isSelected = selectedBank?.id === bank.id;
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => setSelectedBank(bank)}
                className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#00ff87] bg-[#00ff87]/10 shadow-[0_0_25px_rgba(0,255,135,0.35)] scale-[1.03]'
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

          {/* O 5º Botão: "Outros" (ou o banco personalizado selecionado) */}
          <button
            type="button"
            onClick={() => setIsOtherBanksModalOpen(true)}
            className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
              !isSelectedBankPrimary && selectedBank
                ? 'border-2 border-[#00ff87] bg-[#00ff87]/10 shadow-[0_0_25px_rgba(0,255,135,0.35)] scale-[1.03]'
                : 'border-[#192234] bg-[#0b0f19] hover:bg-[#101625] hover:border-cyan-500/40'
            }`}
          >
            {/* Badge de Selecionado quando é um banco de Outros */}
            {!isSelectedBankPrimary && selectedBank && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#00ff87] text-black flex items-center justify-center shadow-[0_0_10px_rgba(0,255,135,0.6)]">
                <CheckCircle2 size={13} strokeWidth={3} />
              </span>
            )}

            {/* Ícone PNG do Banco escolhido ou de Outros */}
            <BankIcon 
              src={fifthSlotBank.path} 
              bankName={fifthSlotBank.name} 
              size="xl" 
              className="w-14 h-14 rounded-2xl shadow-md group-hover:scale-110 transition-transform" 
            />

            <div className="w-full text-center">
              <h4 className={`text-xs font-bold truncate w-full transition-colors ${
                !isSelectedBankPrimary && selectedBank ? 'text-[#00ff87]' : 'text-white group-hover:text-cyan-400'
              }`}>
                {!isSelectedBankPrimary && selectedBank ? selectedBank.name : 'Outros'}
              </h4>
              <p className="text-[9px] text-[#64748b] group-hover:text-[#94a3b8]">
                {!isSelectedBankPrimary && selectedBank ? 'Trocar banco' : 'Ver todos'}
              </p>
            </div>
          </button>

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
                Arraste e solte o extrato do <strong>{selectedBank.name}</strong> aqui ou clique para selecionar o arquivo (.ofx / .csv)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* POP-UP / MODAL DE SELEÇÃO DE OUTROS BANCOS */}
      {isOtherBanksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#080c14] border border-[#192234] rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,255,135,0.15)] space-y-5 max-h-[90vh] flex flex-col">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#192234] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Selecionar Banco para Importação</h3>
                  <p className="text-xs text-[#94a3b8]">Escolha o banco correspondente ao arquivo de extrato</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOtherBanksModalOpen(false)}
                className="p-2 rounded-xl bg-[#121927] border border-[#192234] text-[#64748b] hover:text-white hover:border-red-500/40 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="relative shrink-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                value={otherBankSearch}
                onChange={e => setOtherBankSearch(e.target.value)}
                placeholder="Buscar banco por nome..."
                className="w-full h-11 bg-[#0d1320] border border-[#192234] rounded-xl pl-10 pr-4 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00ff87] focus:ring-1 focus:ring-[#00ff87]/30 transition-all"
                autoFocus
              />
            </div>

            {/* Grid com Todos os Bancos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar flex-1 p-1">
              {filteredOtherBanks.map(bank => {
                const isSelected = selectedBank?.id === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => handleSelectOtherBank(bank)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                      isSelected
                        ? 'border-2 border-[#00ff87] bg-[#00ff87]/15 shadow-[0_0_15px_rgba(0,255,135,0.3)] scale-[1.02]'
                        : 'bg-[#0d1320] border-[#192234] hover:border-cyan-500/40 hover:bg-[#101625]'
                    }`}
                  >
                    <BankIcon 
                      src={bank.path} 
                      bankName={bank.name} 
                      size="lg" 
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span className={`text-xs font-bold truncate w-full ${isSelected ? 'text-[#00ff87]' : 'text-white group-hover:text-cyan-300'}`}>
                      {bank.name}
                    </span>
                  </button>
                );
              })}

              {filteredOtherBanks.length === 0 && (
                <div className="col-span-full py-8 text-center text-[#64748b] text-xs">
                  Nenhum banco encontrado com "{otherBankSearch}".
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-2 border-t border-[#192234] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsOtherBanksModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#192234] text-xs text-[#94a3b8] hover:bg-[#121927] hover:text-white transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POP-UP DE DIVERGÊNCIA DE BANCO */}
      {mismatchInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0b0f19] border border-amber-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.2)] space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#192234]">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Divergência de Banco Detectada</h3>
                <p className="text-xs text-[#94a3b8]">O extrato parece pertencer a outro banco</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0e1422] border border-[#192234] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Banco que você selecionou:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <BankIcon src={mismatchInfo.selectedBank.path} bankName={mismatchInfo.selectedBank.name} size="xs" />
                  {mismatchInfo.selectedBank.name}
                </span>
              </div>
              <div className="h-px bg-[#192234]" />
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8]">Banco detectado no arquivo:</span>
                <span className="font-bold text-[#00ff87] flex items-center gap-1.5">
                  <BankIcon src={mismatchInfo.detectedBank.path} bankName={mismatchInfo.detectedBank.name} size="xs" />
                  {mismatchInfo.detectedBank.name}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleSwitchToDetectedBank}
                className="flex-1 py-3 px-4 rounded-xl bg-[#00ff87] text-black text-xs font-bold hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeftRight size={14} />
                Mudar para {mismatchInfo.detectedBank.name}
              </button>
              <button
                type="button"
                onClick={handleContinueWithSelectedBank}
                className="py-3 px-4 rounded-xl border border-[#192234] text-xs text-[#94a3b8] hover:bg-[#121927] hover:text-white transition-all cursor-pointer"
              >
                Continuar com {mismatchInfo.selectedBank.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORIA E IMPORTAÇÃO */}
      <ImportAuditModal
        isOpen={isModalOpen}
        onClose={handleDiscard}
        bank={selectedBank}
        parsedData={parsedData}
        isError={isError}
        onConfirm={handleConfirmImport}
        onDiscard={handleDiscard}
      />

    </div>
  );
}
