import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWA({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show mobile instructions if on iOS and not installed
    if (isIosDevice && !window.matchMedia('(display-mode: standalone)').matches) {
      const hasSeenInstructions = localStorage.getItem('pwa-instructions-seen');
      if (!hasSeenInstructions) {
        setShowMobileInstructions(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowMobileInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback if prompt is not available but user clicked
      setShowMobileInstructions(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const closeInstructions = () => {
    setShowMobileInstructions(false);
    localStorage.setItem('pwa-instructions-seen', 'true');
  };

  return (
    <>
      {/* Sidebar Button */}
      <button
        onClick={handleInstallClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-[#CC0000] hover:bg-[#AA0000] rounded-xl transition-colors",
          className
        )}
      >
        <Download size={20} />
        Baixar App
      </button>

      {/* Mobile Instructions Popup */}
      {showMobileInstructions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-xl transform transition-all">
            <button 
              onClick={closeInstructions}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#CC0000]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="text-[#CC0000]" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instalar Aplicativo</h3>
              <p className="text-gray-600 text-sm">
                Instale o AZA Hub no seu dispositivo para acesso rápido e fácil.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-3">
              {isIOS ? (
                <>
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center font-bold text-xs shrink-0">1</span>
                    Toque no menu do navegador (três pontinhos) ou no ícone de instalação na barra de endereço.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white shadow flex items-center justify-center font-bold text-xs shrink-0">2</span>
                    Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                  </p>
                </>
              )}
            </div>
            
            <button 
              onClick={closeInstructions}
              className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
