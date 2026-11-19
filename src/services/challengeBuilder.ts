import { CodeSnippet, Concept, Difficulty, SnippetMutationOption } from '../types';
import { generateCandidateMutations } from './mutationEngine';
import { runPythonWithTrace } from './pythonRunner';

export class ChallengeBuildError extends Error {}

interface BuildOptions {
  concept: Concept;
  difficulty: Difficulty;
  title: string;
  idPrefix: string;
}

/**
 * Convierte código Python arbitrario en un reto de predicción:
 * 1. Ejecuta el original en Pyodide (debe correr sin errores).
 * 2. Busca mutaciones sintácticas con el motor.
 * 3. Elige la primera mutación que corre sin errores y cambia la salida.
 * Las salidas esperadas siempre las calcula Python, nunca quien escribió el código.
 */
export async function buildChallengeFromCode(
  code: string,
  { concept, difficulty, title, idPrefix }: BuildOptions
): Promise<{ snippet: CodeSnippet; mutation: SnippetMutationOption }> {
  const origExec = await runPythonWithTrace(code, 4000);
  if (origExec.error) {
    throw new ChallengeBuildError(`Error sintáctico o de ejecución en el código original:\n${origExec.error}`);
  }

  const candidates = generateCandidateMutations(code);
  if (candidates.length === 0) {
    throw new ChallengeBuildError(
      'El código no admite ninguna de las mutaciones sintácticas definidas por el motor (operadores, range, slices, mutaciones in-place).'
    );
  }

  const stamp = Date.now();
  for (const cand of candidates) {
    const mutExec = await runPythonWithTrace(cand.mutatedCode, 4000);
    if (!mutExec.error && mutExec.stdout.trim() !== origExec.stdout.trim()) {
      const mutation: SnippetMutationOption = {
        id: `${idPrefix}_mut_${stamp}`,
        mutationType: cand.mutationType,
        line: cand.line,
        originalSnippet: cand.originalSnippet,
        mutatedSnippet: cand.mutatedSnippet,
        mutatedCode: cand.mutatedCode,
        expectedMutatedOutput: mutExec.stdout.trim(),
        hint1_concept: cand.hint1_concept,
        hint2_line: cand.hint2_line,
        explanation: cand.explanation
      };

      const snippet: CodeSnippet = {
        id: `${idPrefix}_${stamp}`,
        title,
        concept,
        difficulty,
        originalCode: code,
        expectedOriginalOutput: origExec.stdout.trim(),
        mutations: [mutation]
      };

      return { snippet, mutation };
    }
  }

  throw new ChallengeBuildError(
    'Las mutaciones generadas producen la misma salida que el original o provocan errores. Prueba con otro fragmento.'
  );
}
