import React from 'react';
import { Target, Zap, Clock, Code2, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'challenge' | 'blindspots' | 'custom' | 'session';
  setActiveTab: (tab: 'challenge' | 'blindspots' | 'custom' | 'session') => void;
  streak: number;
  pyodideReady: boolean;
  onReviewClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  streak,
  pyodideReady,
  onReviewClick
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('challenge')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-center relative overflow-hidden group-hover:border-[#FF0033] transition-colors duration-200">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF0033] shadow-[0_0_8px_#FF0033] animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="font-bold tracking-tight text-xl text-[#0A0A0A]">
                Trace<span className="text-[#FF0033] text-red-elegant text-2xl">Gym</span>
              </span>
              <span className="text-[11px] tracking-wider text-[#71717A] uppercase font-mono font-medium">Sistemas</span>
            </div>
            <p className="text-xs text-[#71717A] italic font-serif">
              Trazado mental de código para parciales en papel
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#F4F4F5] p-1 rounded-full border border-[#E4E4E7]">
          <button
            onClick={() => setActiveTab('challenge')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeTab === 'challenge'
                ? 'bg-white text-[#0A0A0A] shadow-xs font-semibold'
                : 'text-[#71717A] hover:text-[#0A0A0A]'
            }`}
          >
            Gimnasio
          </button>

          <button
            onClick={() => setActiveTab('blindspots')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'blindspots'
                ? 'bg-white text-[#0A0A0A] shadow-xs font-semibold'
                : 'text-[#71717A] hover:text-[#0A0A0A]'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#FF0033]" />
            <span>Puntos Ciegos</span>
          </button>

          <button
            onClick={() => setActiveTab('session')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'session'
                ? 'bg-white text-[#0A0A0A] shadow-xs font-semibold'
                : 'text-[#71717A] hover:text-[#0A0A0A]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#FF0033]" />
            <span>Sesión 20 min</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === 'custom'
                ? 'bg-white text-[#0A0A0A] shadow-xs font-semibold'
                : 'text-[#71717A] hover:text-[#0A0A0A]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Pegar Código</span>
          </button>
        </nav>

        {/* Status & Repasar CTA */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Repasar CTA Button */}
          <button
            onClick={onReviewClick}
            title="Iniciar sesión con los conceptos que más has fallado"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#F9FAFB] text-[#0A0A0A] border border-[#E5E7EB] hover:border-[#FF0033] shadow-xs transition-all duration-200 active:scale-95 group"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FF0033] group-hover:rotate-180 transition-transform duration-500" />
            <span>Repasar</span>
          </button>

          {/* Streak indicator */}
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs shadow-xs">
            <Zap className="w-3.5 h-3.5 text-[#FF0033] fill-[#FF0033]" />
            <span className="font-mono font-semibold text-[#0A0A0A]">{streak}</span>
            <span className="text-[10px] text-[#71717A]">días</span>
          </div>

          {/* WASM engine status pill */}
          <div 
            title={pyodideReady ? 'Pyodide WebAssembly (Python 3.12) activo y listo en tu navegador' : 'Cargando WebAssembly Pyodide...'}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono text-[#71717A] shadow-xs"
          >
            <span className={`w-2 h-2 rounded-full ${pyodideReady ? 'bg-emerald-500' : 'bg-[#FF0033] animate-ping'}`}></span>
            <span>{pyodideReady ? 'WASM' : 'WASM...'}</span>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden px-4 py-2 bg-white border-t border-[#E5E7EB] justify-around text-xs">
        <button
          onClick={() => setActiveTab('challenge')}
          className={`py-1 px-2 ${activeTab === 'challenge' ? 'text-[#0A0A0A] font-bold border-b-2 border-[#FF0033]' : 'text-[#71717A]'}`}
        >
          Gimnasio
        </button>
        <button
          onClick={() => setActiveTab('blindspots')}
          className={`py-1 px-2 ${activeTab === 'blindspots' ? 'text-[#0A0A0A] font-bold border-b-2 border-[#FF0033]' : 'text-[#71717A]'}`}
        >
          Puntos Ciegos
        </button>
        <button
          onClick={() => setActiveTab('session')}
          className={`py-1 px-2 ${activeTab === 'session' ? 'text-[#0A0A0A] font-bold border-b-2 border-[#FF0033]' : 'text-[#71717A]'}`}
        >
          20 Min
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`py-1 px-2 ${activeTab === 'custom' ? 'text-[#0A0A0A] font-bold border-b-2 border-[#FF0033]' : 'text-[#71717A]'}`}
        >
          Pegar
        </button>
      </div>
    </header>
  );
};
