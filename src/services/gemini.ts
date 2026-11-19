import { Attempt, CodeSnippet, Concept, ConceptStat, Difficulty, SnippetMutationOption } from '../types';
import { CONCEPTS_META, SNIPPETS_BANK } from '../data/snippets';
import { buildChallengeFromCode, ChallengeBuildError } from './challengeBuilder';

/*
 * Cliente de Gemini para el Coach IA.
 * La clave se toma de VITE_GEMINI_API_KEY en tiempo de build: Vite la incrusta en el
 * JavaScript publicado, así que cualquiera que abra el sitio puede leerla.
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY ?? '').trim();
export const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL ?? '').trim() || 'gemini-4-hydrogen';

const CONCEPT_IDS = Object.keys(CONCEPTS_META) as Concept[];
const DIFFICULTIES: Difficulty[] = ['básico', 'medio', 'avanzado'];

export function isGeminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

export class GeminiError extends Error {}

// ---------------------------------------------------------------------------
// Llamada base a generateContent con salida JSON
// ---------------------------------------------------------------------------

async function postGenerateContent(body: unknown): Promise<Response> {
  try {
    return await fetch(`${API_BASE}/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new GeminiError('No se pudo conectar con Gemini. Revisa tu conexión a internet.');
  }
}

async function readApiErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return String(data?.error?.message ?? '');
  } catch {
    return '';
  }
}

function describeHttpError(status: number, apiMessage: string): string {
  if (/api key/i.test(apiMessage)) return 'La clave de Gemini no es válida. Revisa VITE_GEMINI_API_KEY.';
  if (status === 403) return 'La clave de Gemini no tiene permiso para esta petición (¿está restringida a otro sitio web?).';
  if (status === 404) return `El modelo "${GEMINI_MODEL}" no existe o no está disponible para esta clave. Cambia VITE_GEMINI_MODEL.`;
  if (status === 429) return 'Se agotó la cuota de Gemini por ahora. Espera un momento e intenta de nuevo.';
  if (status >= 500) return 'Gemini no está disponible en este momento. Intenta de nuevo en unos minutos.';
  return `Gemini rechazó la petición (${status})${apiMessage ? `: ${apiMessage}` : '.'}`;
}

async function generateJson(systemInstruction: string, prompt: string, schema: object): Promise<unknown> {
  if (!isGeminiConfigured()) {
    throw new GeminiError('Falta configurar la clave de Gemini (VITE_GEMINI_API_KEY).');
  }

  const buildBody = (withSchema: boolean) => ({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      ...(withSchema ? { responseJsonSchema: schema } : {})
    }
  });

  let res = await postGenerateContent(buildBody(true));
  if (res.status === 400) {
    // Si el modelo no acepta el esquema, reintenta solo con modo JSON:
    // el prompt ya describe la forma exacta de la respuesta.
    const apiMessage = await readApiErrorMessage(res);
    if (/api key/i.test(apiMessage)) throw new GeminiError(describeHttpError(400, apiMessage));
    res = await postGenerateContent(buildBody(false));
  }
  if (!res.ok) {
    throw new GeminiError(describeHttpError(res.status, await readApiErrorMessage(res)));
  }

  const data = await res.json();
  if (data?.promptFeedback?.blockReason) {
    throw new GeminiError(`Gemini bloqueó la petición (${data.promptFeedback.blockReason}).`);
  }

  const candidate = data?.candidates?.[0];
  const text: string = (candidate?.content?.parts ?? [])
    .filter((p: any) => typeof p?.text === 'string' && !p.thought)
    .map((p: any) => p.text)
    .join('');

  if (!text) {
    const reason = candidate?.finishReason ? ` (${candidate.finishReason})` : '';
    throw new GeminiError(`Gemini no devolvió contenido${reason}.`);
  }
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new GeminiError('La respuesta de Gemini quedó incompleta. Intenta de nuevo.');
  }

  try {
    return JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ''));
  } catch {
    throw new GeminiError('Gemini devolvió una respuesta que no es JSON válido. Intenta de nuevo.');
  }
}

// ---------------------------------------------------------------------------
// 1. Recomendaciones a partir de las estadísticas
// ---------------------------------------------------------------------------

export interface CoachRecommendation {
  snippetId: string;
  reason: string;
}

export interface CoachAnalysis {
  diagnosis: string;
  focusConcepts: Concept[];
  recommendations: CoachRecommendation[];
  studyTip: string;
  createdAt: number;
}

export interface CoachContext {
  stats: ConceptStat[];
  attempts: Attempt[];
  streak: number;
  reviewQueue: { concept: Concept; reason: string; isOverdue: boolean }[];
}

const COACH_SYSTEM = `Eres el Coach IA de TraceGym, una app donde estudiantes de Ingeniería de Sistemas entrenan a predecir en papel qué imprime un código Python sin ejecutarlo (como en un parcial escrito).
Respondes siempre en español neutro, de forma breve, concreta y motivadora, hablándole al estudiante de "tú".
Solo recomiendas ejercicios cuyo id aparezca en el catálogo que se te entrega.`;

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    diagnosis: { type: 'string', description: 'Diagnóstico de 2 a 4 frases sobre el rendimiento del estudiante.' },
    focusConcepts: {
      type: 'array',
      description: 'Entre 1 y 3 conceptos en los que debe enfocarse, del más al menos urgente.',
      items: { type: 'string', enum: CONCEPT_IDS }
    },
    recommendations: {
      type: 'array',
      description: 'Entre 3 y 5 ejercicios del catálogo, en el orden en que debe hacerlos.',
      items: {
        type: 'object',
        properties: {
          snippetId: { type: 'string', description: 'id exacto de un ejercicio del catálogo.' },
          reason: { type: 'string', description: 'Por qué este ejercicio, en una frase.' }
        },
        required: ['snippetId', 'reason']
      }
    },
    studyTip: { type: 'string', description: 'Un consejo práctico para trazar mejor este tipo de código en papel.' }
  },
  required: ['diagnosis', 'focusConcepts', 'recommendations', 'studyTip']
};

export async function getCoachAnalysis({ stats, attempts, streak, reviewQueue }: CoachContext): Promise<CoachAnalysis> {
  const attemptsBySnippet = new Map<string, { tries: number; ok: number }>();
  for (const a of attempts) {
    const entry = attemptsBySnippet.get(a.snippetId) ?? { tries: 0, ok: 0 };
    entry.tries += 1;
    if (a.isCorrect) entry.ok += 1;
    attemptsBySnippet.set(a.snippetId, entry);
  }

  const statsLines = stats.map(s =>
    `- ${s.concept} (${s.label}): ${s.totalAttempts} intentos, ${s.successes} aciertos, precisión ${s.totalAttempts ? `${s.accuracyRate}%` : 'sin datos'}, estado ${s.status}. Trampa típica: ${CONCEPTS_META[s.concept].examTrap}`
  );

  const recentLines = attempts.slice(0, 20).map(a =>
    `- ${a.snippetId} | ${a.concept} | ${a.difficulty} | mutación: ${a.mutationType} | pistas: ${a.hintsUsed} | ${a.isCorrect ? 'acierto' : 'fallo'}`
  );

  const reviewLines = reviewQueue.map(r => `- ${r.concept}: ${r.reason}${r.isOverdue ? ' (pendiente)' : ''}`);

  const catalogLines = SNIPPETS_BANK.map(s => {
    const done = attemptsBySnippet.get(s.id);
    const history = done ? `${done.ok}/${done.tries} aciertos` : 'sin intentar';
    return `- ${s.id} | ${s.concept} | ${s.difficulty} | "${s.title}" | ${history}`;
  });

  const prompt = `Analiza el progreso de este estudiante y recomiéndale qué practicar a continuación.

RACHA: ${streak} día(s) seguidos practicando.
TOTAL DE INTENTOS: ${attempts.length}.

ESTADÍSTICAS POR CONCEPTO:
${statsLines.join('\n')}

COLA DE REPETICIÓN ESPACIADA (1, 3 y 7 días):
${reviewLines.join('\n')}

ÚLTIMOS INTENTOS (más reciente primero):
${recentLines.length ? recentLines.join('\n') : '- Aún no hay intentos.'}

CATÁLOGO DE EJERCICIOS DISPONIBLES (id | concepto | dificultad | título | historial):
${catalogLines.join('\n')}

Reglas:
- Prioriza conceptos con baja precisión, fallos recientes o repasos pendientes; si no hay datos, propone un recorrido inicial de dificultad básica por conceptos variados.
- Sube la dificultad solo en conceptos donde ya acierta de forma consistente.
- Prefiere ejercicios que no ha intentado o que falló.
- Responde únicamente con JSON con esta forma: {"diagnosis": string, "focusConcepts": [${CONCEPT_IDS.map(c => `"${c}"`).join(' | ')}], "recommendations": [{"snippetId": string, "reason": string}], "studyTip": string}.`;

  const raw = (await generateJson(COACH_SYSTEM, prompt, ANALYSIS_SCHEMA)) as any;

  const validIds = new Set(SNIPPETS_BANK.map(s => s.id));
  const seen = new Set<string>();
  const recommendations: CoachRecommendation[] = (Array.isArray(raw?.recommendations) ? raw.recommendations : [])
    .filter((r: any) => typeof r?.snippetId === 'string' && validIds.has(r.snippetId) && !seen.has(r.snippetId) && seen.add(r.snippetId))
    .slice(0, 5)
    .map((r: any) => ({ snippetId: r.snippetId, reason: String(r.reason ?? '').trim() }));

  const focusConcepts: Concept[] = (Array.isArray(raw?.focusConcepts) ? raw.focusConcepts : [])
    .filter((c: any) => CONCEPT_IDS.includes(c))
    .slice(0, 3);

  if (recommendations.length === 0) {
    throw new GeminiError('Gemini no recomendó ejercicios válidos del banco. Intenta de nuevo.');
  }

  return {
    diagnosis: String(raw?.diagnosis ?? '').trim(),
    focusConcepts,
    recommendations,
    studyTip: String(raw?.studyTip ?? '').trim(),
    createdAt: Date.now()
  };
}

// ---------------------------------------------------------------------------
// 2. Ejercicios nuevos generados por Gemini y validados en Pyodide
// ---------------------------------------------------------------------------

export interface GeneratedExercise {
  snippet: CodeSnippet;
  mutation: SnippetMutationOption;
  focus: string;
  createdAt: number;
}

const EXERCISE_SYSTEM = `Eres un profesor de Programación en Python que escribe ejercicios de "¿qué imprime este código?" para parciales escritos de Ingeniería de Sistemas.
Escribes código Python 3 corto, determinista y autocontenido, con nombres de variables en español.`;

const EXERCISE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Título corto en español (máximo 60 caracteres).' },
    code: { type: 'string', description: 'Programa Python completo, con saltos de línea reales.' },
    focus: { type: 'string', description: 'Qué trampa mental entrena el ejercicio, en una frase.' }
  },
  required: ['title', 'code', 'focus']
};

// El código corre en Pyodide dentro de la página: se rechaza cualquier cosa que no sea Python puro.
const FORBIDDEN_CODE = /^\s*(import|from)\s|__import__|\beval\s*\(|\bexec\s*\(|\bopen\s*\(|\binput\s*\(|\bcompile\s*\(|\bglobals\s*\(|\bbreakpoint\s*\(/m;

const MAX_GENERATION_TRIES = 3;

export async function generateExercise(
  concept: Concept,
  difficulty: Difficulty,
  onProgress?: (message: string) => void
): Promise<GeneratedExercise> {
  if (!DIFFICULTIES.includes(difficulty)) throw new GeminiError('Dificultad no válida.');
  const meta = CONCEPTS_META[concept];
  const examples = SNIPPETS_BANK.filter(s => s.concept === concept).slice(0, 2);

  let lastProblem = '';
  for (let attempt = 1; attempt <= MAX_GENERATION_TRIES; attempt++) {
    onProgress?.(`Gemini está escribiendo el ejercicio (intento ${attempt}/${MAX_GENERATION_TRIES})…`);

    const prompt = `Escribe UN ejercicio nuevo de predicción de salida.

Concepto: ${meta.label} — ${meta.shortDesc}
Trampa típica de examen que debe poner a prueba: ${meta.examTrap}
Dificultad: ${difficulty}

Requisitos del código:
- Entre 6 y 25 líneas, Python 3 puro, sin import, sin input(), sin aleatoriedad, sin archivos.
- Debe imprimir con print() entre 1 y 8 líneas de salida, siempre iguales en cada ejecución.
- Debe terminar sin errores en menos de un segundo.
- Incluye comparaciones (<, <=, ==), operaciones aritméticas, range(...), slices [a:b] o .append(...), porque el motor de TraceGym mutará una de esas partes.
- Sin comentarios que revelen la salida.
${lastProblem ? `\nEl intento anterior no sirvió: ${lastProblem}\nEscribe uno distinto que cumpla todos los requisitos.\n` : ''}
Ejemplos del estilo esperado (no los copies):
${examples.map(e => `--- ${e.title}\n${e.originalCode}`).join('\n')}

Responde únicamente con JSON: {"title": string, "code": string, "focus": string}.`;

    const raw = (await generateJson(EXERCISE_SYSTEM, prompt, EXERCISE_SCHEMA)) as any;
    const code = String(raw?.code ?? '').replace(/\r\n/g, '\n').trim();
    const title = String(raw?.title ?? '').trim().slice(0, 80) || `Ejercicio IA: ${meta.label}`;
    const focus = String(raw?.focus ?? '').trim();

    if (!code || code.split('\n').length > 40) {
      lastProblem = 'el código estaba vacío o tenía más de 40 líneas.';
      continue;
    }
    if (FORBIDDEN_CODE.test(code)) {
      lastProblem = 'usaba import, input(), eval/exec u otra función no permitida.';
      continue;
    }

    onProgress?.(`Validando el ejercicio en Pyodide (intento ${attempt}/${MAX_GENERATION_TRIES})…`);
    try {
      const { snippet, mutation } = await buildChallengeFromCode(code, {
        concept,
        difficulty,
        title,
        idPrefix: 'ai'
      });
      return { snippet, mutation, focus, createdAt: Date.now() };
    } catch (e) {
      if (!(e instanceof ChallengeBuildError)) throw e;
      lastProblem = e.message;
    }
  }

  throw new GeminiError(
    `Gemini no logró un ejercicio válido después de ${MAX_GENERATION_TRIES} intentos. Último problema: ${lastProblem}`
  );
}

// ---------------------------------------------------------------------------
// Persistencia local del Coach (para no gastar cuota repitiendo peticiones)
// ---------------------------------------------------------------------------

const STORAGE_KEY_COACH = 'tracegym_ai_coach_v1';
const MAX_SAVED_EXERCISES = 10;

export interface CoachState {
  analysis: CoachAnalysis | null;
  exercises: GeneratedExercise[];
}

export function loadCoachState(): CoachState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COACH);
    if (!raw) return { analysis: null, exercises: [] };
    const parsed = JSON.parse(raw);
    return {
      analysis: parsed?.analysis ?? null,
      exercises: Array.isArray(parsed?.exercises) ? parsed.exercises : []
    };
  } catch {
    return { analysis: null, exercises: [] };
  }
}

export function saveCoachState(state: CoachState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY_COACH,
      JSON.stringify({ ...state, exercises: state.exercises.slice(0, MAX_SAVED_EXERCISES) })
    );
  } catch (e) {
    console.error('Error guardando el estado del Coach IA', e);
  }
}
