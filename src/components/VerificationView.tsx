import React, { useState, useEffect } from 'react';
import { 
  CodeSnippet, 
  SnippetMutationOption, 
  ExecutionResult, 
  TraceStep 
} from '../types';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Bug, 
  Sliders, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Cpu 
} from 'lucide-react';

interface VerificationViewProps {
  currentSnippet: CodeSnippet;
  currentMutation: SnippetMutationOption;
  userPrediction: string;
  userTrace?: string;
  executionResult: ExecutionResult;
  isCorrect: boolean;
  scoreEarned: number;
  hintsUsed: number;
  onNextChallenge: () => void;
  onRetryChallenge: () => void;
  onOpenBlindSpots: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  currentSnippet,
  currentMutation,
  userPrediction,
  userTrace,
  executionResult,
  isCorrect,
  scoreEarned,
  hintsUsed,
  onNextChallenge,
  onRetryChallenge,
  onOpenBlindSpots
}) => {
  const traceSteps = executionResult.traceSteps || [];
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlayingTrace, setIsPlayingTrace] = useState<boolean>(false);

  // Trigger celebration confetti on success
  useEffect(() => {
    if (isCorrect) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF0033', '#111111', '#FF3366', '#E5E7EB']
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isCorrect]);

  // Auto-play trace animation effect
  useEffect(() => {
    let interval: any;
    if (isPlayingTrace && traceSteps.length > 0) {
      interval = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= traceSteps.length - 1) {
            setIsPlayingTrace(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isPlayingTrace, traceSteps.length]);

  const activeStep: TraceStep | undefined = traceSteps[currentStepIdx];

  const predictionLines = userPrediction.trim().split('\n');
  const actualLines = executionResult.stdout.trim().split('\n');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* 1. VERDICT BANNER (LIGHT THEME) */}
      <div 
        className={`p-5 rounded-2xl border transition-all duration-300 shadow-xs relative overflow-hidden ${
          isCorrect 
            ? 'bg-emerald-50/70 border-emerald-200' 
            : 'bg-[#FFF5F6] border-[#FFCCD3]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isCorrect ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-[#FFE4E8] border-[#FFCCD3] text-[#FF0033]'
            }`}>
              {isCorrect ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              ) : (
                <XCircle className="w-7 h-7 text-[#FF0033]" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold tracking-tight text-[#0A0A0A]">
                  {isCorrect ? '¡Acierto en el Trazado Mental!' : 'Divergencia en el Trazado'}
                </h2>
                <span className={`text-xs uppercase font-mono px-2.5 py-0.5 rounded-full font-bold ${
                  isCorrect 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-[#FFE4E8] text-[#FF0033] border border-[#FFCCD3] text-red-elegant text-sm'
                }`}>
                  {isCorrect ? `+${scoreEarned} PTS` : '0 PTS'}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isCorrect ? 'text-emerald-800' : 'text-[#DC2626] text-red-elegant text-sm'}`}>
                {isCorrect 
                  ? 'Tu predicción coincide línea a línea con la salida física de Python en WebAssembly.' 
                  : '«Tu deducción se separó de la salida real. Examina abajo la traza paso a paso y la trampa sintáctica.»'
                }
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            {!isCorrect && (
              <button
                onClick={onRetryChallenge}
                className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-3.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            )}
            <button
              onClick={onNextChallenge}
              className="btn-primary text-xs flex items-center space-x-2 py-2 px-4 font-bold"
            >
              <span>Siguiente Reto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. LINE-BY-LINE OUTPUT COMPARISON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Student Prediction */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2.5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-[#71717A]">
              Tu Predicción (A Mano)
            </span>
            <span className="text-xs font-mono text-[#A1A1AA]">{predictionLines.length} línea(s)</span>
          </div>

          <div className="bg-[#FAFAFA] rounded-xl p-3.5 font-mono text-sm border border-[#E5E7EB] flex-1 min-h-[110px] overflow-x-auto text-[#0A0A0A]">
            {predictionLines.length > 0 && predictionLines[0] !== '' ? (
              <table className="w-full">
                <tbody>
                  {predictionLines.map((line, idx) => {
                    const matchActual = actualLines[idx] === line;
                    return (
                      <tr key={idx} className="border-b border-[#F0F0F2] last:border-0">
                        <td className="w-8 select-none text-[#A1A1AA] text-xs py-1 font-mono">L{idx + 1}</td>
                        <td className={`py-1 font-mono text-sm ${matchActual ? 'text-[#0A0A0A] font-medium' : 'text-[#FF0033] font-bold text-red-elegant text-base'}`}>
                          {line}
                        </td>
                        <td className="w-6 text-right py-1">
                          {matchActual ? (
                            <span className="text-emerald-600 text-xs font-bold">✓</span>
                          ) : (
                            <span className="text-[#FF0033] text-xs font-bold text-red-elegant">✗</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <span className="text-[#A1A1AA] italic text-xs">No escribiste salida (o cadena vacía)</span>
            )}
          </div>
        </div>

        {/* Real Pyodide WASM Output */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-2.5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#FF0033]" />
              <span className="text-xs uppercase tracking-wider font-bold text-[#0A0A0A]">
                Salida Real (Pyodide WASM)
              </span>
            </div>
            <span className="text-xs font-mono text-[#71717A]">{executionResult.executionTimeMs} ms</span>
          </div>

          <div className="bg-[#FAFAFA] rounded-xl p-3.5 font-mono text-sm border border-[#E5E7EB] flex-1 min-h-[110px] overflow-x-auto text-[#0A0A0A]">
            {executionResult.error ? (
              <div className="text-[#DC2626] text-xs whitespace-pre-wrap font-mono text-red-elegant">
                {executionResult.error}
              </div>
            ) : actualLines.length > 0 && actualLines[0] !== '' ? (
              <table className="w-full">
                <tbody>
                  {actualLines.map((line, idx) => (
                    <tr key={idx} className="border-b border-[#F0F0F2] last:border-0">
                      <td className="w-8 select-none text-[#A1A1AA] text-xs py-1 font-mono">L{idx + 1}</td>
                      <td className="py-1 font-mono text-sm text-emerald-700 font-bold">{line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span className="text-[#A1A1AA] italic text-xs">(Sin salida por consola)</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. PEDAGOGICAL EXPLANATION ("VER EL PORQUÉ") */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#FFF5F6] border border-[#FFCCD3]">
              <BookOpen className="w-4 h-4 text-[#FF0033]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0A0A0A] tracking-tight">
                El Porqué: Análisis Pedagógico de la Mutación
              </h3>
              <p className="text-xs text-[#71717A]">
                Concepto: <strong className="text-[#0A0A0A]">{currentSnippet.concept}</strong> • Mutación: <strong className="text-[#FF0033] text-red-elegant">{currentMutation.mutationType}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-xs text-[#374151] leading-relaxed">
          <p className="mb-2">{currentMutation.explanation}</p>
          <div className="mt-2.5 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#71717A]">
            <span>Línea divergente: <strong className="text-[#0A0A0A] font-mono">Línea {currentMutation.line}</strong></span>
            <span className="text-red-elegant text-[#FF0033] text-sm font-semibold">«Presta atención al modelo mental de memoria de Python»</span>
          </div>
        </div>
      </div>

      {/* 4. VISUAL DIFF: MUTATED CODE VS ORIGINAL CODE */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bug className="w-4 h-4 text-[#FF0033]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
              Diferencia de Código (Mutante vs Original)
            </span>
          </div>
          <span className="text-xs font-mono text-[#71717A]">
            Mutación aplicada en Línea {currentMutation.line}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB] text-xs font-mono">
          {/* Mutated Code (Evaluated) */}
          <div className="p-3.5 bg-[#FFFDFD] space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-[#FF0033] font-bold pb-1 text-red-elegant">
              Código Mutado (El que evaluaste)
            </div>
            <div className="space-y-0.5">
              {currentMutation.mutatedCode.split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const isMutatedLine = lineNum === currentMutation.line;
                return (
                  <div 
                    key={lineNum}
                    className={`flex items-start px-2 py-0.5 rounded ${
                      isMutatedLine 
                        ? 'bg-[#FF0033]/10 text-[#FF0033] font-bold border-l-2 border-[#FF0033]' 
                        : 'text-[#374151]'
                    }`}
                  >
                    <span className="w-7 text-[#A1A1AA] select-none">{lineNum}</span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Original Code (Before mutation) */}
          <div className="p-3.5 bg-[#FAFAFA] space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-bold pb-1">
              Código Original del Banco
            </div>
            <div className="space-y-0.5">
              {currentSnippet.originalCode.split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const isOriginalLine = lineNum === currentMutation.line;
                return (
                  <div 
                    key={lineNum}
                    className={`flex items-start px-2 py-0.5 rounded ${
                      isOriginalLine 
                        ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-500' 
                        : 'text-[#71717A]'
                    }`}
                  >
                    <span className="w-7 text-[#A1A1AA] select-none">{lineNum}</span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE STEP-BY-STEP EXECUTION TRACE DEBUGGER */}
      {traceSteps.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
                <Sliders className="w-4 h-4 text-[#FF0033]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A] tracking-tight">
                  Traza Paso a Paso: Estado de Variables en Cada Línea
                </h3>
                <p className="text-xs text-[#71717A]">
                  Depurador mental interactivo — Observa la evolución interna del stack y variables
                </p>
              </div>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                disabled={currentStepIdx === 0}
                className="p-1.5 rounded-full bg-[#F4F4F5] hover:bg-[#EAEAEA] border border-[#E5E7EB] text-[#0A0A0A] disabled:opacity-30 active:scale-95 transition-all"
                title="Paso anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlayingTrace(!isPlayingTrace)}
                className="px-3 py-1 rounded-full bg-[#F4F4F5] hover:bg-[#EAEAEA] border border-[#E5E7EB] text-xs font-semibold text-[#0A0A0A] flex items-center space-x-1.5 active:scale-95 transition-all"
              >
                {isPlayingTrace ? (
                  <>
                    <Pause className="w-3 h-3 text-[#FF0033]" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-[#FF0033] text-[#FF0033]" />
                    <span>Auto-Play</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentStepIdx(Math.min(traceSteps.length - 1, currentStepIdx + 1))}
                disabled={currentStepIdx === traceSteps.length - 1}
                className="p-1.5 rounded-full bg-[#F4F4F5] hover:bg-[#EAEAEA] border border-[#E5E7EB] text-[#0A0A0A] disabled:opacity-30 active:scale-95 transition-all"
                title="Paso siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-[#71717A] pl-2">
                Paso <strong className="text-[#0A0A0A]">{currentStepIdx + 1}</strong> de {traceSteps.length}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={traceSteps.length - 1}
              value={currentStepIdx}
              onChange={(e) => setCurrentStepIdx(Number(e.target.value))}
              className="w-full accent-[#FF0033] bg-[#E5E7EB] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Active Step Details */}
          {activeStep && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Executed Line Highlight (7 cols) */}
              <div className="md:col-span-7 bg-[#FAFAFA] p-3.5 rounded-xl border border-[#E5E7EB] space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs text-[#71717A]">
                  <span>Línea actual ejecutada en Python:</span>
                  <span className="text-[#FF0033] font-bold text-red-elegant text-sm">Línea {activeStep.line}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#E5E7EB] text-xs text-[#0A0A0A] font-semibold">
                  <code>{activeStep.lineCode}</code>
                </div>
                {activeStep.stdoutSnapshot && (
                  <div className="pt-1.5 text-xs">
                    <span className="text-[#71717A]">Salida acumulada hasta este paso:</span>
                    <pre className="mt-1 p-2 bg-white border border-[#E5E7EB] rounded-lg text-emerald-700 text-xs overflow-x-auto">
                      {activeStep.stdoutSnapshot}
                    </pre>
                  </div>
                )}
              </div>

              {/* Local Variables Inspector (5 cols) */}
              <div className="md:col-span-5 bg-[#FAFAFA] p-3.5 rounded-xl border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#71717A]">
                  <span>Variables locales en memoria:</span>
                  <span className="font-mono">{Object.keys(activeStep.variables).length} activas</span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {Object.entries(activeStep.variables).length > 0 ? (
                    Object.entries(activeStep.variables).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-mono">
                        <span className="text-[#71717A] font-semibold">{key}:</span>
                        <span className="text-[#0A0A0A] font-medium truncate max-w-[180px]" title={val}>{val}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#A1A1AA] italic text-xs py-2 text-center">
                      Sin variables locales en este marco
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB]">
        <button
          onClick={onOpenBlindSpots}
          className="btn-secondary text-xs py-2 px-4"
        >
          Ver Mapa de Puntos Ciegos
        </button>

        <button
          onClick={onNextChallenge}
          className="btn-primary text-xs py-2.5 px-6 font-bold flex items-center space-x-1.5"
        >
          <span>Continuar con el Siguiente Reto</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
