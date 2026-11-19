import React, { useState, useEffect } from 'react';
import { CodeSnippet, SnippetMutationOption, Attempt } from '../types';
import { SNIPPETS_BANK, CONCEPTS_META } from '../data/snippets';
import { getAvailableMutation } from '../services/mutationEngine';
import { runPythonWithTrace } from '../services/pythonRunner';
import { saveAttempt } from '../services/storage';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowRight, 
  Terminal, 
  Target
} from 'lucide-react';

interface SessionModeModalProps {
  onFinishSession: () => void;
  onExit: () => void;
}

export const SessionModeModal: React.FC<SessionModeModalProps> = ({
  onFinishSession,
  onExit
}) => {
  const TOTAL_CHALLENGES = 5;
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [sessionSnippets, setSessionSnippets] = useState<{ snippet: CodeSnippet; mutation: SnippetMutationOption }[]>([]);
  const [userPrediction, setUserPrediction] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sessionAttempts, setSessionAttempts] = useState<Attempt[]>([]);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; actual: string } | null>(null);

  useEffect(() => {
    const shuffled = [...SNIPPETS_BANK].sort(() => 0.5 - Math.random());
    const selected: { snippet: CodeSnippet; mutation: SnippetMutationOption }[] = [];

    for (const snip of shuffled) {
      if (selected.length >= TOTAL_CHALLENGES) break;
      const mut = getAvailableMutation(snip);
      if (mut) {
        selected.push({ snippet: snip, mutation: mut });
      }
    }

    setSessionSnippets(selected);
  }, []);

  useEffect(() => {
    if (isSessionFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSessionFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionFinished]);

  const currentItem = sessionSnippets[currentIndex];

  const handleVerifyCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || isEvaluating) return;

    setIsEvaluating(true);
    const execRes = await runPythonWithTrace(currentItem.mutation.mutatedCode);
    const actualClean = execRes.stdout.trim();
    const userClean = userPrediction.trim();
    const isCorrect = userClean === actualClean;

    const score = isCorrect ? 100 : 0;
    const attempt: Attempt = {
      id: `sess_att_${Date.now()}`,
      snippetId: currentItem.snippet.id,
      concept: currentItem.snippet.concept,
      difficulty: currentItem.snippet.difficulty,
      mutationType: currentItem.mutation.mutationType,
      userPrediction: userClean,
      actualOutput: actualClean,
      isCorrect,
      hintsUsed: 0,
      score,
      timeSpentSeconds: 20 * 60 - timeLeft,
      timestamp: Date.now()
    };

    saveAttempt(attempt);
    setSessionAttempts(prev => [...prev, attempt]);
    setFeedback({ isCorrect, actual: actualClean });
    setIsEvaluating(false);
  };

  const handleNextChallenge = () => {
    setFeedback(null);
    setUserPrediction('');
    if (currentIndex + 1 >= TOTAL_CHALLENGES) {
      setIsSessionFinished(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (isSessionFinished) {
    const hits = sessionAttempts.filter(a => a.isCorrect).length;
    const accuracy = sessionAttempts.length > 0 ? Math.round((hits / sessionAttempts.length) * 100) : 0;

    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 animate-fadeIn py-8">
        <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] text-center space-y-6 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5F6] border border-[#FFCCD3] flex items-center justify-center mx-auto text-[#FF0033]">
            <Award className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-[#71717A] font-semibold">
              Sesión de 20 Minutos Completada
            </span>
            <h1 className="text-2xl font-bold text-[#0A0A0A] mt-1">
              Diagnóstico para tu Parcial
            </h1>
            <p className="text-xs text-[#71717A] mt-1 max-w-md mx-auto">
              Este resultado simula el tiempo y presión real que tendrás frente a la hoja de examen.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3.5 max-w-md mx-auto">
            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#71717A] font-semibold">Aciertos</span>
              <div className="text-xl font-bold font-mono text-[#0A0A0A] mt-1">{hits} / {sessionAttempts.length}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#71717A] font-semibold">Precisión</span>
              <div className={`text-xl font-bold font-mono mt-1 ${accuracy >= 70 ? 'text-emerald-600' : 'text-[#FF0033] text-red-elegant text-2xl'}`}>
                {accuracy}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-mono text-[#71717A] font-semibold">Tiempo</span>
              <div className="text-xl font-bold font-mono text-[#0A0A0A] mt-1">
                {20 - Math.ceil(timeLeft / 60)} min
              </div>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="space-y-2 text-left max-w-lg mx-auto pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Resumen por Reto Evaluado
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              {sessionAttempts.map((att, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
                  <span className="text-[#0A0A0A] font-semibold">Reto {i + 1}: {CONCEPTS_META[att.concept]?.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#71717A]">{att.mutationType}</span>
                    {att.isCorrect ? (
                      <span className="text-emerald-600 font-bold">✓ Acierto</span>
                    ) : (
                      <span className="text-[#FF0033] font-bold text-red-elegant">✗ Fallo</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4 pt-3">
            <button
              onClick={onFinishSession}
              className="btn-primary text-xs py-2.5 px-6 font-bold flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Ver en el Mapa de Puntos Ciegos</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="py-20 text-center text-xs text-[#71717A] space-y-2">
        <div className="w-5 h-5 border-2 border-[#FF0033] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Preparando batería de 5 retos express...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn pb-10">
      {/* Top Session Progress Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
            <Clock className="w-4 h-4 text-[#FF0033]" />
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-[#0A0A0A] font-bold">
              Reto {currentIndex + 1} de {TOTAL_CHALLENGES}
            </div>
            <span className="text-xs text-[#71717A]">
              Concepto: {CONCEPTS_META[currentItem.snippet.concept].label}
            </span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF0033] animate-pulse"></span>
            <span className="text-[#0A0A0A] font-bold">{timeFormatted}</span>
          </div>

          <button
            onClick={onExit}
            className="text-xs text-[#71717A] hover:text-[#0A0A0A] transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Code Box */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between text-xs font-mono">
          <span className="text-[#0A0A0A] font-bold">{currentItem.snippet.title}</span>
          <span className="text-[#FF0033] text-red-elegant text-xs font-bold">Sin ejecutar en computador</span>
        </div>

        <div className="p-4 font-mono text-sm text-[#18181B] bg-[#FAFAFA] overflow-x-auto leading-relaxed">
          <pre>{currentItem.mutation.mutatedCode}</pre>
        </div>
      </div>

      {/* Input or Feedback */}
      {!feedback ? (
        <form onSubmit={handleVerifyCurrent} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-[#FF0033]" />
              <label htmlFor="session-predict" className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                ¿Qué imprime exactamente?
              </label>
            </div>
            <span className="text-xs text-[#71717A]">Escribe la salida en papel mental</span>
          </div>

          <textarea
            id="session-predict"
            rows={3}
            value={userPrediction}
            onChange={(e) => setUserPrediction(e.target.value)}
            placeholder="Salida por consola..."
            className="w-full bg-[#FAFAFA] text-[#0A0A0A] font-mono text-sm p-3 rounded-xl border border-[#E5E7EB] focus:border-[#FF0033] focus:bg-white focus:outline-none leading-relaxed"
            required
          />

          <button
            type="submit"
            disabled={isEvaluating}
            className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isEvaluating ? (
              <span>Evaluando en Pyodide WASM...</span>
            ) : (
              <span>Confirmar Predicción y Continuar</span>
            )}
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 space-y-3.5 animate-fadeIn shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <XCircle className="w-5 h-5 text-[#FF0033]" />
              )}
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">
                  {feedback.isCorrect ? '¡Acierto!' : 'Fallo en este reto'}
                </h3>
                <p className={`text-xs ${feedback.isCorrect ? 'text-emerald-700' : 'text-[#DC2626] text-red-elegant text-sm'}`}>
                  {feedback.isCorrect ? 'Tu deducción fue perfecta.' : '«La salida real no coincidió con tu predicción.»'}
                </p>
              </div>
            </div>

            <button
              onClick={handleNextChallenge}
              className="btn-primary text-xs py-2 px-4 font-bold flex items-center space-x-1.5"
            >
              <span>{currentIndex + 1 < TOTAL_CHALLENGES ? 'Siguiente Reto' : 'Finalizar Sesión'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
            <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
              <span className="text-[#71717A] text-[10px] uppercase font-semibold">Tu Predicción:</span>
              <pre className="text-[#0A0A0A] mt-1 whitespace-pre-wrap">{userPrediction || '(vacío)'}</pre>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
              <span className="text-[#71717A] text-[10px] uppercase font-semibold">Salida Real:</span>
              <pre className="text-emerald-700 font-bold mt-1 whitespace-pre-wrap">{feedback.actual || '(sin salida)'}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
