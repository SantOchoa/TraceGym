import React, { useState } from 'react';
import { 
  CodeSnippet, 
  SnippetMutationOption, 
  Concept, 
  Difficulty 
} from '../types';
import { CONCEPTS_META } from '../data/snippets';
import { 
  Lightbulb, 
  Play, 
  Shuffle, 
  AlertTriangle, 
  ChevronRight, 
  Terminal, 
  FileCode,
  Sparkles,
  Award
} from 'lucide-react';

interface ChallengeViewProps {
  currentSnippet: CodeSnippet;
  currentMutation: SnippetMutationOption;
  selectedConcept: Concept;
  selectedDifficulty: Difficulty;
  onSelectConcept: (concept: Concept) => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onNewChallenge: () => void;
  onSubmitPrediction: (prediction: string, trace: string, hintsUsed: number, score: number) => void;
  isExecuting: boolean;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  currentSnippet,
  currentMutation,
  selectedConcept,
  selectedDifficulty,
  onSelectConcept,
  onSelectDifficulty,
  onNewChallenge,
  onSubmitPrediction,
  isExecuting
}) => {
  const [prediction, setPrediction] = useState('');
  const [userTrace, setUserTrace] = useState('');
  const [showTraceInput, setShowTraceInput] = useState(false);
  const [hintsUnlocked, setHintsUnlocked] = useState<number>(0);

  // Score calculation: 100 base, -25 per hint
  const currentScore = Math.max(50, 100 - hintsUnlocked * 25);

  const handleUnlockHint = () => {
    if (hintsUnlocked < 2) {
      setHintsUnlocked(prev => prev + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitPrediction(prediction, userTrace, hintsUnlocked, currentScore);
  };

  const lines = currentMutation.mutatedCode.split('\n');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Top Filter Bar: Concept and Difficulty Selectors */}
      <div className="bg-white p-2.5 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Concept pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
          {(Object.keys(CONCEPTS_META) as Concept[]).map((cKey) => {
            const meta = CONCEPTS_META[cKey];
            const isSelected = selectedConcept === cKey;
            return (
              <button
                key={cKey}
                onClick={() => onSelectConcept(cKey)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all duration-150 whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-[#0A0A0A] text-white font-medium shadow-xs'
                    : 'bg-[#F4F4F5] text-[#52525B] hover:text-[#0A0A0A] hover:bg-[#E4E4E7]'
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Difficulty and Shuffle action */}
        <div className="flex items-center space-x-2.5 ml-auto">
          {/* Difficulty selector */}
          <div className="flex items-center bg-[#F4F4F5] p-0.5 rounded-full border border-[#E4E4E7]">
            {(['básico', 'medio', 'avanzado'] as Difficulty[]).map((lvl) => {
              const isSelected = selectedDifficulty === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => onSelectDifficulty(lvl)}
                  className={`px-2.5 py-1 text-xs rounded-full capitalize transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'bg-white text-[#0A0A0A] font-medium shadow-xs'
                      : 'text-[#71717A] hover:text-[#0A0A0A]'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>

          {/* Randomize / New Snippet Button */}
          <button
            onClick={onNewChallenge}
            className="btn-secondary text-xs flex items-center space-x-1.5 py-1.5 px-3"
            title="Cargar otro reto con este concepto y nivel"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Otro Reto</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Code Display (Left) + Prediction Terminal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Mutated Code Box (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs flex flex-col flex-1">
            {/* Header */}
            <div className="px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF0033]"></div>
                </div>
                <div className="h-4 w-[1px] bg-[#E5E7EB] mx-1"></div>
                <FileCode className="w-4 h-4 text-[#FF0033]" />
                <span className="text-xs font-mono font-semibold text-[#0A0A0A]">{currentSnippet.title}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] tracking-wider uppercase font-mono px-2 py-0.5 rounded-full bg-[#F4F4F5] text-[#52525B]">
                  {CONCEPTS_META[currentSnippet.concept].label}
                </span>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FFF0F2] border border-[#FFCCD3] text-[#FF0033] font-semibold text-red-elegant">
                  Código Mutado
                </span>
              </div>
            </div>

            {/* Instruction banner */}
            <div className="px-4 py-2 bg-white border-b border-[#E5E7EB] flex items-center justify-between text-xs text-[#71717A]">
              <span className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF0033]"></span>
                <span>Evalúa el código en tu mente. <strong className="text-[#0A0A0A] font-medium">¿Qué imprimirá en la consola?</strong></span>
              </span>
              <span className="font-mono text-xs text-[#A1A1AA]">{lines.length} líneas</span>
            </div>

            {/* Code lines container - Light paper aesthetic */}
            <div className="p-4 overflow-x-auto flex-1 font-mono text-sm leading-relaxed text-[#18181B] bg-[#FAFAFA]">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => {
                    const lineNum = idx + 1;
                    return (
                      <tr key={lineNum} className="group hover:bg-[#F0F0F2] transition-colors">
                        <td className="w-10 select-none text-right pr-4 text-[#A1A1AA] font-mono text-xs py-0.5">
                          {lineNum}
                        </td>
                        <td className="whitespace-pre pl-2 py-0.5 font-mono">
                          {highlightPythonSyntax(line)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Exam Trap Educational Footnote */}
            <div className="p-3 bg-[#FBFBFC] border-t border-[#E5E7EB] flex items-start space-x-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-[#FF0033] shrink-0 mt-0.5" />
              <p className="text-[#71717A] leading-snug">
                <strong className="text-[#0A0A0A] font-medium">Trampa de examen típica: </strong>
                {CONCEPTS_META[currentSnippet.concept].examTrap}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction, Progressive Hints & Submit (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Progressive Hints Accordion */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-[#FF0033]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Pistas Progresivas ({hintsUnlocked}/2)
                </h3>
              </div>
              <div className="flex items-center space-x-1.5 text-xs">
                <Award className="w-3.5 h-3.5 text-[#FF0033]" />
                <span className="font-mono text-[#0A0A0A] font-bold">{currentScore}</span>
                <span className="text-[#71717A] text-[11px]">pts posibles</span>
              </div>
            </div>

            {/* Hint 1 Display */}
            {hintsUnlocked >= 1 ? (
              <div className="p-3 rounded-xl bg-[#FFF5F6] border border-[#FFCCD3] text-xs text-[#1F2937] animate-fadeIn space-y-1">
                <div className="flex items-center justify-between text-[#FF0033] font-semibold text-red-elegant text-sm">
                  <span>Pista 1: Concepto Involucrado</span>
                  <span className="text-[10px] text-[#71717A] font-mono font-normal">-25 pts</span>
                </div>
                <p className="text-[#374151] leading-relaxed">
                  {currentMutation.hint1_concept}
                </p>
              </div>
            ) : null}

            {/* Hint 2 Display */}
            {hintsUnlocked >= 2 ? (
              <div className="p-3 rounded-xl bg-[#FFF5F6] border border-[#FFCCD3] text-xs text-[#1F2937] animate-fadeIn space-y-1">
                <div className="flex items-center justify-between text-[#FF0033] font-semibold text-red-elegant text-sm">
                  <span>Pista 2: Línea Alterada</span>
                  <span className="text-[10px] text-[#71717A] font-mono font-normal">-25 pts</span>
                </div>
                <p className="text-[#374151] leading-relaxed">
                  {currentMutation.hint2_line}
                </p>
              </div>
            ) : null}

            {/* Hint Unlock Button */}
            {hintsUnlocked < 2 ? (
              <button
                type="button"
                onClick={handleUnlockHint}
                className="w-full py-2 px-3 rounded-xl bg-[#F4F4F5] hover:bg-[#EAEAEA] text-xs text-[#374151] hover:text-[#0A0A0A] border border-[#E5E7EB] transition-all duration-150 flex items-center justify-center space-x-2 active:scale-98 group font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF0033] group-hover:scale-110 transition-transform" />
                <span>
                  Revelar Pista {hintsUnlocked + 1} {hintsUnlocked === 0 ? '(Concepto)' : '(Línea Crítica)'}
                </span>
                <span className="text-xs text-[#FF0033] font-mono text-red-elegant">(-25 pts)</span>
              </button>
            ) : (
              <p className="text-xs text-[#71717A] text-center italic">Todas las pistas han sido reveladas.</p>
            )}
          </div>

          {/* Prediction Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col space-y-3.5 flex-1 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#FF0033]" />
                <label htmlFor="prediction-box" className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Tu Predicción de Salida
                </label>
              </div>
              <span className="text-xs text-[#71717A] font-mono">Salida exacta por consola</span>
            </div>

            {/* Prediction Textarea */}
            <div className="relative flex-1">
              <textarea
                id="prediction-box"
                rows={5}
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                placeholder="Escribe exactamente lo que imprimirá print(...)&#10;Ejemplo:&#10;1&#10;2&#10;3"
                className="w-full bg-[#FAFAFA] text-[#0A0A0A] font-mono text-sm p-3 rounded-xl border border-[#E5E7EB] focus:border-[#FF0033] focus:bg-white focus:outline-none transition-all placeholder:text-[#A1A1AA] resize-y leading-relaxed"
                required
              />
            </div>

            {/* Optional Variable Trace Collapsible */}
            <div className="border-t border-[#E5E7EB] pt-2.5">
              <button
                type="button"
                onClick={() => setShowTraceInput(!showTraceInput)}
                className="text-xs text-[#71717A] hover:text-[#0A0A0A] flex items-center space-x-1.5 transition-colors font-medium"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showTraceInput ? 'rotate-90' : ''}`} />
                <span>Traza manual de variables (Opcional)</span>
              </button>

              {showTraceInput && (
                <div className="mt-2 animate-fadeIn">
                  <textarea
                    rows={3}
                    value={userTrace}
                    onChange={(e) => setUserTrace(e.target.value)}
                    placeholder="Anota tu seguimiento manual de variables por iteración:&#10;i=0 -> x=1, lista=[1]&#10;i=1 -> x=2, lista=[1, 2]"
                    className="w-full bg-[#FAFAFA] text-[#374151] font-mono text-xs p-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#FF0033] focus:bg-white focus:outline-none transition-all placeholder:text-[#A1A1AA]"
                  />
                </div>
              )}
            </div>

            {/* Submit Verification Button with Animation */}
            <button
              type="submit"
              disabled={isExecuting}
              className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Ejecutando en Pyodide WASM...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Verificar Predicción (WASM)</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

/**
 * Lightweight syntax highlighter for clean light minimalist code rendering.
 */
function highlightPythonSyntax(line: string): React.ReactNode {
  // Comments
  if (line.trim().startsWith('#')) {
    return <span className="text-[#71717A] italic">{line}</span>;
  }

  const tokens = line.split(/(\b(?:def|return|if|elif|else|for|in|while|break|continue|print|global|nonlocal|lambda|class|is|not|and|or|True|False|None)\b|".*?"|'.*?'|[0-9]+)/g);

  return (
    <>
      {tokens.map((token, i) => {
        if (/^(def|class|lambda)$/.test(token)) {
          return <span key={i} className="text-[#FF0033] font-semibold">{token}</span>;
        }
        if (/^(return|if|elif|else|for|in|while|break|continue|global|nonlocal|is|not|and|or)$/.test(token)) {
          return <span key={i} className="text-[#09090B] font-semibold">{token}</span>;
        }
        if (token === 'print') {
          return <span key={i} className="text-[#09090B] font-bold">{token}</span>;
        }
        if (/^(True|False|None)$/.test(token)) {
          return <span key={i} className="text-[#C026D3] font-mono font-medium">{token}</span>;
        }
        if (/^(".*?"|'.*?')$/.test(token)) {
          return <span key={i} className="text-[#16A34A]">{token}</span>;
        }
        if (/^[0-9]+$/.test(token)) {
          return <span key={i} className="text-[#2563EB]">{token}</span>;
        }
        return <span key={i}>{token}</span>;
      })}
    </>
  );
}
