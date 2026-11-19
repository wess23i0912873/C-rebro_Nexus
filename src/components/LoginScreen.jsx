import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertCircle, Loader2, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { loginWithGoogle } from '../lib/googleSheetsApi';

export default function LoginScreen({ onLoginSuccess, sheetsUrl, googleClientId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [gisLoaded, setGisLoaded] = useState(false);
  const buttonContainerRef = useRef(null);

  const isConfigured = Boolean(sheetsUrl && googleClientId);

  // Monitora o carregamento da biblioteca Google Identity Services (GIS)
  useEffect(() => {
    if (!isConfigured) return;

    let intervalId;
    let attempts = 0;

    const checkGis = () => {
      attempts += 1;
      if (window.google?.accounts?.id) {
        setGisLoaded(true);
        if (intervalId) clearInterval(intervalId);
      } else if (attempts > 60) {
        // 6 segundos de tentativas
        if (intervalId) clearInterval(intervalId);
        setErrorMessage('Não foi possível carregar o serviço de autenticação do Google. Verifique sua conexão com a internet.');
      }
    };

    checkGis();
    if (!window.google?.accounts?.id) {
      intervalId = setInterval(checkGis, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isConfigured]);

  // Inicializa o botão do Google quando a GIS estiver pronta
  useEffect(() => {
    if (!gisLoaded || !buttonContainerRef.current || !googleClientId || isLoading) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Limpa renderizações anteriores
      buttonContainerRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        shape: 'pill',
        theme: 'filled_black',
        text: 'signin_with',
        size: 'large',
        logo_alignment: 'left',
        width: 280,
      });
    } catch (err) {
      console.error('Erro ao inicializar botão do Google:', err);
      setErrorMessage('Erro ao inicializar o login do Google.');
    }
  }, [gisLoaded, googleClientId, isLoading]);

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setErrorMessage('Nenhuma credencial recebida do Google.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const sessionData = await loginWithGoogle(sheetsUrl, response.credential);
      onLoginSuccess(sessionData);
    } catch (err) {
      console.error('Falha na autenticação com o Apps Script:', err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-[#f3f4f6] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#00ff87]/30 selection:text-white">
      {/* Luzes de fundo decorativas */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00ff87]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in space-y-6">
        
        {/* Logo e Título */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#00ff87]/20 via-[#00ff87]/10 to-cyan-500/10 border border-[#00ff87]/30 shadow-[0_0_35px_rgba(0,255,135,0.25)] text-[#00ff87]">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              CÉREBRO NEXUS
              <Sparkles size={20} className="text-[#00ff87]" />
            </h1>
            <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 font-medium">
              Central Pessoal de Inteligência Financeira
            </p>
          </div>
        </div>

        {/* Card Principal de Login */}
        <div className="glass-card rounded-3xl border border-[#192234] p-6 sm:p-8 shadow-2xl backdrop-blur-xl bg-[#0b0f19]/80 space-y-6 relative overflow-hidden">
          
          <div className="space-y-2 text-center">
            <h2 className="text-base font-bold text-white tracking-wide">
              Acesso Seguro e Restrito
            </h2>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Entre com a sua conta Google autorizada para visualizar e gerenciar suas finanças sincronizadas com a sua Planilha Google.
            </p>
          </div>

          {/* Alerta de Configuração Ausente */}
          {!isConfigured && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={16} />
                <span>Configuração Pendente</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                As variáveis de ambiente não foram detectadas. Configure <code className="px-1 py-0.5 rounded bg-black/40 font-mono text-[11px]">VITE_SHEETS_URL</code> e <code className="px-1 py-0.5 rounded bg-black/40 font-mono text-[11px]">VITE_GOOGLE_CLIENT_ID</code> no arquivo <code className="px-1 py-0.5 rounded bg-black/40 font-mono text-[11px]">.env</code> ou nas Variables do GitHub.
              </p>
            </div>
          )}

          {/* Alerta de Erro de Login */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-fade-in">
              <AlertCircle size={18} className="shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-red-200">Falha ao entrar</p>
                <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Botão de Login do Google / Loading */}
          {isConfigured && (
            <div className="flex flex-col items-center justify-center pt-2 space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <Loader2 size={32} className="text-[#00ff87] animate-spin" />
                  <p className="text-xs text-[#94a3b8] font-mono animate-pulse">
                    Autenticando sessão com a Planilha Google...
                  </p>
                </div>
              ) : (
                <>
                  <div ref={buttonContainerRef} className="min-h-[44px] flex items-center justify-center" />
                  {!gisLoaded && !errorMessage && (
                    <p className="text-[11px] text-[#64748b] font-mono animate-pulse">
                      Carregando Google Identity Services...
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Rodapé do Card com Garantias */}
          <div className="pt-4 border-t border-[#192234] grid grid-cols-2 gap-3 text-[11px] text-[#64748b]">
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-[#00ff87]" />
              <span>Sessão de 30 dias</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <CheckCircle2 size={12} className="text-[#00ff87]" />
              <span>Planilha Google ativa</span>
            </div>
          </div>

        </div>

        <p className="text-[11px] text-center text-[#475569] font-mono">
          Cérebro Nexus v2.0 • Sincronização Serverless
        </p>

      </div>
    </div>
  );
}
