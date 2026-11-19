import React, { useEffect, useMemo, useState } from 'react';
import { CodeSnippet, Concept, Difficulty, SnippetMutationOption } from '../types';
import { CONCEPTS_META, SNIPPETS_BANK } from '../data/snippets';
import { getAttempts, getConceptStats, getPrioritizedReviewConcepts } from '../services/storage';
import {
  GEMINI_MODEL,
  CoachState,
  generateExercise,
  getCoachAnalysis,
  isGeminiConfigured,
  loadCoachState,
  saveCoachState
} from '../services/gemini';
import { Sparkles, Brain, Play, Wand2, AlertCircle, KeyRound, Lightbulb, Trash2 } from 'lucide-react';

interface AiCoachViewProps {
  streak: number;
  onPracticeSnippet: (snippetId: string) => void;
  onPracticeGenerated: (snippet: CodeSnippet, mutation: SnippetMutationOption) => void;
}

const DIFFICULTIES: Difficulty[] = ['básico', 'medio', 'avanzado'];

const Spinner: React.FC<{ light?: boolean }> = ({ light }) => (
  <div className={`w-3.5 h-3.5 border-2 ${light ? 'border-white' : 'border-[#FF0033]'} border-t-transparent rounded-full animate-spin`}></div>
);

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-3.5 rounded-xl bg-[#FFF5F6] border border-[#FFCCD3] flex items-start space-x-2.5 text-xs">
    <AlertCircle className="w-4 h-4 text-[#FF0033] shrink-0 mt-0.5" />
    <p className="text-[#DC2626] whitespace-pre-wrap text-red-elegant text-sm">{message}</p>
  </div>
);

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  streak,
  onPracticeSnippet,
  onPracticeGenerated
}) => {
  const configured = isGeminiConfigured();
  const [coach, setCoach] = useState<CoachState>(loadCoachState());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const stats = useMemo(() => getConceptStats(), []);
  const weakestConcept = useMemo<Concept>(() => {
    const focus = coach.analysis?.focusConcepts?.[0];
    if (focus) return focus;
    const attempted = stats.filter(s => s.totalAttempts > 0).sort((a, b) => a.accuracyRate - b.accuracyRate);
    return attempted[0]?.concept ?? 'recursion';
  }, [coach.analysis, stats]);

  const [genConcept, setGenConcept] = useState<Concept>(weakestConcept);
  const [genDifficulty, setGenDifficulty] = useState<Difficulty>('medio');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [genError, setGenError] = useState<string | null>(null);

  // Guarda el análisis y los ejercicios para no gastar cuota repitiendo peticiones
  useEffect(() => {
    saveCoachState(coach);
  }, [coach]);

  const handleAnalyze = async () => {
    setAnalysisError(null);
    setIsAnalyzing(true);
    try {
      const analysis = await getCoachAnalysis({
        stats: getConceptStats(),
        attempts: getAttempts(),
        streak,
        reviewQueue: getPrioritizedReviewConcepts()
      });
      setCoach(prev => ({ ...prev, analysis }));
      if (analysis.focusConcepts[0]) setGenConcept(analysis.focusConcepts[0]);
    } catch (e: any) {
      setAnalysisError(e?.message || String(e));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    setGenError(null);
    setIsGenerating(true);
    try {
      const exercise = await generateExercise(genConcept, genDifficulty, setGenProgress);
      setCoach(prev => ({ ...prev, exercises: [exercise, ...prev.exercises].slice(0, 10) }));
    } catch (e: any) {
      setGenError(e?.message || String(e));
    } finally {
      setIsGenerating(false);
      setGenProgress('');
    }
  };

  const handleRemoveExercise = (id: string) => {
    setCoach(prev => ({ ...prev, exercises: prev.exercises.filter(ex => ex.snippet.id !== id) }));
  };

  const analysis = coach.analysis;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#FF0033]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">Coach IA</h1>
          </div>
          <p className="text-xs text-[#71717A] mt-1">
            Gemini analiza tus puntos ciegos y te recomienda qué entrenar, o crea ejercicios nuevos a tu medida
          </p>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono text-[#71717A] shadow-xs self-start md:self-center">
          <span className={`w-2 h-2 rounded-full ${configured ? 'bg-emerald-500' : 'bg-[#D4D4D8]'}`}></span>
          <span>Gemini · {GEMINI_MODEL}</span>
        </div>
      </div>

      {/* Not configured notice */}
      {!configured && (
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-start space-x-3">
          <KeyRound className="w-5 h-5 text-[#FF0033] shrink-0 mt-0.5" />
          <div className="text-xs text-[#52525B] space-y-1.5">
            <h3 className="text-sm font-bold text-[#0A0A0A]">Falta la clave de Gemini</h3>
            <p>
              Crea una clave en Google AI Studio y guárdala en un archivo <code className="px-1 py-0.5 rounded bg-[#F4F4F5]">.env.local</code> en la raíz del proyecto:
            </p>
            <pre className="p-2.5 rounded-lg bg-[#F4F4F5] text-[#0A0A0A] text-xs overflow-x-auto">VITE_GEMINI_API_KEY=tu_clave_aquí</pre>
            <p>Luego reinicia <code className="px-1 py-0.5 rounded bg-[#F4F4F5]">npm run dev</code> o vuelve a publicar con <code className="px-1 py-0.5 rounded bg-[#F4F4F5]">npm run deploy</code>.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. ANALYSIS & BANK RECOMMENDATIONS */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
                <Brain className="w-4 h-4 text-[#FF0033]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0A0A0A] tracking-tight">Diagnóstico y ejercicios recomendados</h2>
                <p className="text-xs text-[#71717A]">Según tus estadísticas, tu historial y tu racha de {streak} {streak === 1 ? 'día' : 'días'}</p>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!configured || isAnalyzing}
              className="btn-primary text-xs py-2 px-4 font-bold flex items-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
            >
              {isAnalyzing ? <Spinner light /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isAnalyzing ? 'Analizando…' : analysis ? 'Volver a analizar' : 'Analizar mi progreso'}</span>
            </button>
          </div>

          {analysisError && <ErrorBox message={analysisError} />}

          {analysis ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-[#27272A] leading-relaxed">{analysis.diagnosis}</p>
                {analysis.focusConcepts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mr-1">Enfócate en</span>
                    {analysis.focusConcepts.map(c => (
                      <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFF0F2] border border-[#FFCCD3] text-[#0A0A0A] font-semibold">
                        {CONCEPTS_META[c].label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {analysis.recommendations.map((rec, idx) => {
                  const snippet = SNIPPETS_BANK.find(s => s.id === rec.snippetId);
                  if (!snippet) return null;
                  return (
                    <div key={rec.snippetId} className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-3">
                      <div className="flex items-start space-x-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-mono font-bold text-[#0A0A0A] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#0A0A0A]">{snippet.title}</div>
                          <div className="text-[11px] text-[#71717A] font-mono mt-0.5">
                            {CONCEPTS_META[snippet.concept].label} · {snippet.difficulty}
                          </div>
                          {rec.reason && <p className="text-xs text-[#52525B] mt-1">{rec.reason}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => onPracticeSnippet(snippet.id)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center space-x-1.5 shrink-0"
                      >
                        <Play className="w-3 h-3 text-[#FF0033]" />
                        <span>Practicar</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {analysis.studyTip && (
                <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#52525B] flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-[#FF0033] shrink-0 mt-0.5" />
                  <p><strong className="text-[#0A0A0A]">Consejo: </strong>{analysis.studyTip}</p>
                </div>
              )}

              <p className="text-[11px] text-[#A1A1AA]">
                Análisis del {new Date(analysis.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          ) : (
            !isAnalyzing && (
              <p className="py-8 text-center text-xs text-[#A1A1AA]">
                Pulsa «Analizar mi progreso» para que Gemini revise tus estadísticas y elija retos del banco para ti.
              </p>
            )
          )}
        </div>

        {/* 2. NEW AI-GENERATED EXERCISES */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-4 shadow-xs">
            <div className="flex items-center space-x-2.5 border-b border-[#E5E7EB] pb-3.5">
              <div className="p-2 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
                <Wand2 className="w-4 h-4 text-[#FF0033]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0A0A0A] tracking-tight">Ejercicio nuevo con IA</h2>
                <p className="text-xs text-[#71717A]">Gemini lo escribe; Pyodide lo ejecuta y calcula la salida correcta</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ai-concept" className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Concepto</label>
              <select
                id="ai-concept"
                value={genConcept}
                onChange={(e) => setGenConcept(e.target.value as Concept)}
                className="w-full bg-white text-[#0A0A0A] text-xs py-2 px-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:border-[#FF0033]"
              >
                {(Object.keys(CONCEPTS_META) as Concept[]).map(c => (
                  <option key={c} value={c}>{CONCEPTS_META[c].label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold">Dificultad</span>
              <div className="grid grid-cols-3 gap-1 bg-[#F4F4F5] p-1 rounded-full border border-[#E4E4E7]">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setGenDifficulty(d)}
                    className={`py-1.5 rounded-full text-xs capitalize transition-all ${
                      genDifficulty === d ? 'bg-white text-[#0A0A0A] shadow-xs font-semibold' : 'text-[#71717A] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!configured || isGenerating}
              className="btn-primary w-full text-xs py-2.5 font-bold flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isGenerating ? <Spinner light /> : <Wand2 className="w-3.5 h-3.5" />}
              <span>{isGenerating ? 'Generando…' : 'Generar ejercicio'}</span>
            </button>

            {isGenerating && genProgress && (
              <div className="text-xs text-[#71717A] flex items-center space-x-2" role="status">
                <Spinner />
                <span>{genProgress}</span>
              </div>
            )}

            {genError && <ErrorBox message={genError} />}
          </div>

          {/* Generated exercises list */}
          {coach.exercises.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3 shadow-xs">
              <h3 className="text-xs uppercase tracking-wider font-bold text-[#71717A]">
                Tus ejercicios generados ({coach.exercises.length})
              </h3>
              {coach.exercises.map(ex => (
                <div key={ex.snippet.id} className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0A0A0A]">{ex.snippet.title}</div>
                      <div className="text-[11px] text-[#71717A] font-mono mt-0.5">
                        {CONCEPTS_META[ex.snippet.concept].label} · {ex.snippet.difficulty}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(ex.snippet.id)}
                      className="p-1 text-[#A1A1AA] hover:text-[#FF0033] transition-colors"
                      title="Quitar de la lista"
                      aria-label={`Quitar ${ex.snippet.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {ex.focus && <p className="text-xs text-[#52525B]">{ex.focus}</p>}
                  <button
                    onClick={() => onPracticeGenerated(ex.snippet, ex.mutation)}
                    className="btn-secondary w-full text-xs py-1.5 flex items-center justify-center space-x-1.5"
                  >
                    <Play className="w-3 h-3 text-[#FF0033]" />
                    <span>Practicar este ejercicio</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#A1A1AA] text-center">
        Para analizarte se envían a Google Gemini tus estadísticas de práctica (conceptos, aciertos, pistas y tipos de mutación). No se envían datos personales.
      </p>
    </div>
  );
};
