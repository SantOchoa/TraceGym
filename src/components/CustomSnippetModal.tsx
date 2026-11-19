import React, { useState } from 'react';
import { CodeSnippet, Concept, SnippetMutationOption } from '../types';
import { CONCEPTS_META } from '../data/snippets';
import { buildChallengeFromCode, ChallengeBuildError } from '../services/challengeBuilder';
import { Code2, Play, AlertCircle, Sparkles } from 'lucide-react';

interface CustomSnippetModalProps {
  onChallengeCreated: (snippet: CodeSnippet, mutation: SnippetMutationOption) => void;
  onCancel: () => void;
}

const DEFAULT_SAMPLE_CUSTOM = `# Pega aquí tu código de Python (hasta 40 líneas)
def procesar(arr):
    res = []
    for x in arr:
        if x % 2 == 0:
            res.append(x * 2)
    return res

nums = [1, 2, 3, 4, 5]
print(procesar(nums))`;

export const CustomSnippetModal: React.FC<CustomSnippetModalProps> = ({
  onChallengeCreated,
  onCancel
}) => {
  const [code, setCode] = useState(DEFAULT_SAMPLE_CUSTOM);
  const [concept, setConcept] = useState<Concept>('nested_loops');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lines = code.split('\n');
  const lineCount = lines.length;
  const isOverLimit = lineCount > 40;

  const handleGenerateCustomMutation = async () => {
    setErrorMessage(null);

    if (isOverLimit) {
      setErrorMessage('El código excede el límite máximo permitido de 40 líneas.');
      return;
    }

    if (!code.trim()) {
      setErrorMessage('Ingresa un fragmento de código de Python válido.');
      return;
    }

    setIsProcessing(true);

    try {
      const { snippet, mutation } = await buildChallengeFromCode(code, {
        concept,
        difficulty: 'medio',
        title: 'Reto Personalizado del Estudiante',
        idPrefix: 'custom'
      });
      onChallengeCreated(snippet, mutation);
    } catch (e: any) {
      if (e instanceof ChallengeBuildError) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage(`Fallo al procesar el código: ${e?.message || e}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn pb-10">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
            <Code2 className="w-5 h-5 text-[#FF0033]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A0A0A]">
            Pegar Código Propio (Hasta 40 Líneas)
          </h1>
        </div>
        <p className="text-xs text-[#71717A] mt-1">
          Trae un ejercicio de tu taller de programación o examen pasado. El motor AST aplicará una mutación sutil y verificará su determinismo en Pyodide.
        </p>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0A0A0A]">Código Python determinista</span>
            <span className={`font-mono font-bold ${isOverLimit ? 'text-[#FF0033] text-red-elegant text-sm' : 'text-[#71717A]'}`}>
              {lineCount} / 40 líneas
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={15}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="def mi_funcion()..."
              className={`w-full bg-white text-[#18181B] font-mono text-sm p-4 rounded-2xl border ${
                isOverLimit ? 'border-[#FF0033]' : 'border-[#E5E7EB]'
              } focus:border-[#FF0033] focus:outline-none transition-all leading-relaxed resize-y shadow-xs`}
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-3.5">
          <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
              Concepto Principal a Evaluar
            </h3>
            
            <div className="space-y-1.5">
              {(Object.keys(CONCEPTS_META) as Concept[]).map((cKey) => (
                <label 
                  key={cKey} 
                  className={`flex items-center space-x-2.5 p-2 rounded-xl text-xs cursor-pointer border transition-colors ${
                    concept === cKey 
                      ? 'bg-[#FFF0F2] border-[#FFCCD3] text-[#0A0A0A] font-semibold' 
                      : 'bg-white border-[#E5E7EB] text-[#52525B] hover:text-[#0A0A0A] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <input
                    type="radio"
                    name="concept"
                    value={cKey}
                    checked={concept === cKey}
                    onChange={() => setConcept(cKey)}
                    className="accent-[#FF0033] sr-only"
                  />
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${concept === cKey ? 'border-[#FF0033]' : 'border-[#D1D5DB]'}`}>
                    {concept === cKey && <div className="w-1.5 h-1.5 rounded-full bg-[#FF0033]"></div>}
                  </div>
                  <span>{CONCEPTS_META[cKey].label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Validation Notice */}
          <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#71717A] space-y-1 shadow-xs">
            <div className="flex items-center space-x-1.5 text-[#0A0A0A] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#FF0033]" />
              <span>Garantía de Validez</span>
            </div>
            <p>
              El motor descartará mutaciones que arrojen excepciones sintácticas o produzcan la misma salida exacta.
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FFF5F6] border border-[#FFCCD3] flex items-start space-x-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-[#FF0033] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#0A0A0A]">No fue posible generar el reto:</span>
            <p className="text-[#DC2626] whitespace-pre-wrap text-red-elegant text-sm">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-2.5 pt-2">
        <button
          onClick={onCancel}
          className="btn-secondary text-xs py-2 px-4"
        >
          Cancelar
        </button>

        <button
          onClick={handleGenerateCustomMutation}
          disabled={isProcessing || isOverLimit}
          className="btn-primary text-xs py-2 px-5 font-bold flex items-center space-x-1.5 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analizando AST...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Generar Reto y Entrenar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
