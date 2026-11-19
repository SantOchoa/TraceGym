import { CodeSnippet, SnippetMutationOption, Concept } from '../types';

export interface MutationRule {
  type: string;
  pattern: RegExp;
  replacements: (match: string, ...groups: any[]) => string[];
  hint1: string;
  hint2: (line: number) => string;
  explanationTemplate: (orig: string, mut: string) => string;
}

export const DYNAMIC_RULES: MutationRule[] = [
  // Comparison operators
  {
    type: 'Operador de comparación',
    pattern: /(\b[a-zA-Z0-9_]+)\s*(<=|>=|==|!=|<|>)\s*([a-zA-Z0-9_]+)/g,
    replacements: (_match, left, op, right) => {
      const map: Record<string, string[]> = {
        '<=': ['<', '>='],
        '>=': ['>', '<='],
        '==': ['!='],
        '!=': ['=='],
        '<': ['<=', '>'],
        '>': ['>=', '<']
      };
      const targets = map[op] || ['!='];
      return targets.map(t => `${left} ${t} ${right}`);
    },
    hint1: 'Atención a las condiciones de frontera y operadores relacionales.',
    hint2: (line) => `Revisa la condición en la línea ${line}: el operador relacional fue modificado.`,
    explanationTemplate: (orig, mut) =>
      `La condición mutó de "${orig}" a "${mut}". En programación de sistemas, un cambio entre operador estricto e inclusivo (< vs <=) o igualdad altera el flujo de ejecución o el número exacto de iteraciones (error off-by-one).`
  },
  // Range limits
  {
    type: 'Límites de range',
    pattern: /range\(([^)]+)\)/g,
    replacements: (_match, inner) => {
      const parts = inner.split(',').map((s: string) => s.trim());
      if (parts.length === 1) {
        const n = parts[0];
        return [
          `range(1, ${n})`,
          `range(${n} - 1)`,
          `range(${n} + 1)`
        ];
      } else if (parts.length === 2) {
        return [
          `range(${parts[0]}, ${parts[1]} - 1)`,
          `range(${parts[0]} + 1, ${parts[1]})`,
          `range(${parts[0]}, ${parts[1]}, 2)`
        ];
      } else if (parts.length === 3) {
        const step = parts[2];
        const newStep = step === '2' ? '1' : '2';
        return [`range(${parts[0]}, ${parts[1]}, ${newStep})`];
      }
      return [];
    },
    hint1: 'Presta atención a los límites y pasos del generador range().',
    hint2: (line) => `Observa la línea ${line}: los parámetros pasados a range(...) fueron alterados.`,
    explanationTemplate: (orig, mut) =>
      `El rango "${orig}" fue cambiado por "${mut}". Recuerda que range(stop) genera valores desde 0 hasta stop-1. Cambiar sus cotas modifica la cantidad de iteraciones y los valores que toma la variable de control.`
  },
  // Slice operations
  {
    type: 'Indexación por slice',
    pattern: /\[\s*(-?\d*)\s*:\s*(-?\d*)\s*(?::\s*(-?\d*)\s*)?\]/g,
    replacements: (_match, start, stop, step) => {
      const candidates: string[] = [];
      if (step === '-1' || step === '-2') {
        candidates.push(`[${start || ''}:${stop || ''}:2]`, `[${start || ''}:${stop || ''}]`);
      } else if (!step) {
        candidates.push(`[${start || ''}:${stop || ''}:-1]`, `[${start || ''}:${stop || ''}:2]`);
      }
      if (start && stop) {
        candidates.push(`[${Number(start) + 1}:${stop}]`, `[${start}:${Number(stop) - 1}]`);
      }
      return candidates.length > 0 ? candidates : ['[::-1]'];
    },
    hint1: 'Este reto evalúa la indexación por slices en secuencias de Python.',
    hint2: (line) => `Observa la línea ${line}: los límites o el paso del corte [::] fueron mutados.`,
    explanationTemplate: (orig, mut) =>
      `El slice "${orig}" se transformó en "${mut}". Recuerda que los cortes en Python siguen [inicio:fin:paso], donde fin es siempre excluyente y un paso negativo recorre la secuencia en orden inverso.`
  },
  // Arithmetic operators
  {
    type: 'Operador aritmético',
    pattern: /(\b[a-zA-Z0-9_]+)\s*(\+|\-|\*|\/\/|\%)\s*([a-zA-Z0-9_]+)/g,
    replacements: (_match, left, op, right) => {
      const map: Record<string, string[]> = {
        '+': ['-', '*'],
        '-': ['+', '*'],
        '*': ['//', '+'],
        '//': ['%', '*'],
        '%': ['//']
      };
      const targets = map[op] || ['+'];
      return targets.map(t => `${left} ${t} ${right}`);
    },
    hint1: 'Observa cuidadosamente las operaciones aritméticas y la precedencia de operadores.',
    hint2: (line) => `Línea ${line}: se alteró el operador aritmético en la expresión.`,
    explanationTemplate: (orig, mut) =>
      `La expresión "${orig}" fue sustituida por "${mut}". En el trazado mental en papel, una sustitución de suma/resta o división entera (//) cambia completamente los acumuladores.`
  },
  // List alias vs copy
  {
    type: 'Alias de lista vs Copia',
    pattern: /(\b[a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\[:\]/g,
    replacements: (_match, left, right) => [`${left} = ${right}`],
    hint1: 'Paso por referencia vs copia superficial de listas.',
    hint2: (line) => `Línea ${line}: la asignación se convirtió en un alias directo en lugar de una copia.`,
    explanationTemplate: (_orig, _mut) =>
      `Se eliminó la copia superficial [:] por una asignación directa. Ambas variables ahora apuntan a la misma dirección física en memoria (referencia compartida).`
  },
  // Append vs Concatenation
  {
    type: 'Mutación in-place vs Reasignación',
    pattern: /(\b[a-zA-Z0-9_]+)\.append\(([^)]+)\)/g,
    replacements: (_match, varName, arg) => [`${varName} = ${varName} + [${arg}]`],
    hint1: 'Mutación in-place (.append) vs creación de nuevo objeto en memoria (+).',
    hint2: (line) => `Línea ${line}: .append() se sustituyó por una reasignación con concatenación.`,
    explanationTemplate: (_orig, _mut) =>
      `Se sustituyó la mutación in-place por una concatenación reasignada. Si la variable es un parámetro recibido o tiene alias, la reasignación desvincula la referencia local.`
  },
  // Continue vs Break
  {
    type: 'Control de flujo de bucle',
    pattern: /\b(continue|break)\b/g,
    replacements: (_match, keyword) => [keyword === 'continue' ? 'break' : 'continue'],
    hint1: 'Control de bucles: salto a la siguiente iteración vs terminación abrupta.',
    hint2: (line) => `Línea ${line}: el comando de control de flujo fue invertido.`,
    explanationTemplate: (orig, mut) =>
      `Se cambió "${orig}" por "${mut}". Mientras "continue" finaliza la iteración actual y avanza el bucle, "break" termina de inmediato el bucle anidado más cercano.`
  }
];

export interface GeneratedMutationCandidate {
  mutatedCode: string;
  originalSnippet: string;
  mutatedSnippet: string;
  line: number;
  mutationType: string;
  hint1_concept: string;
  hint2_line: string;
  explanation: string;
}

/**
 * Searches and generates candidate mutations for a given Python code snippet.
 */
export function generateCandidateMutations(pythonCode: string): GeneratedMutationCandidate[] {
  const lines = pythonCode.split('\n');
  const candidates: GeneratedMutationCandidate[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    for (const rule of DYNAMIC_RULES) {
      // Test regex on this line
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match = regex.exec(lineText);

      while (match !== null) {
        const fullMatch = match[0];
        const matchIndex = match.index;
        const replacements = rule.replacements(fullMatch, ...match.slice(1));

        for (const replacement of replacements) {
          if (replacement === fullMatch) continue;

          const newLine = lineText.slice(0, matchIndex) + replacement + lineText.slice(matchIndex + fullMatch.length);
          const mutatedLines = [...lines];
          mutatedLines[lineIdx] = newLine;
          const mutatedCode = mutatedLines.join('\n');

          candidates.push({
            mutatedCode,
            originalSnippet: fullMatch,
            mutatedSnippet: replacement,
            line: lineIdx + 1,
            mutationType: rule.type,
            hint1_concept: rule.hint1,
            hint2_line: rule.hint2(lineIdx + 1),
            explanation: rule.explanationTemplate(fullMatch, replacement)
          });
        }

        match = regex.exec(lineText);
      }
    }
  }

  return candidates;
}

/**
 * Picks a valid mutation for a snippet.
 * If the snippet has predefined mutations, it prefers one.
 * If custom code or no predefined, evaluates candidate mutants.
 */
export function getAvailableMutation(snippet: CodeSnippet): SnippetMutationOption | null {
  if (snippet.mutations && snippet.mutations.length > 0) {
    const idx = Math.floor(Math.random() * snippet.mutations.length);
    return snippet.mutations[idx];
  }

  const dynamicCandidates = generateCandidateMutations(snippet.originalCode);
  if (dynamicCandidates.length === 0) return null;

  const chosen = dynamicCandidates[Math.floor(Math.random() * dynamicCandidates.length)];
  return {
    id: `dyn_${Date.now()}`,
    mutationType: chosen.mutationType,
    line: chosen.line,
    originalSnippet: chosen.originalSnippet,
    mutatedSnippet: chosen.mutatedSnippet,
    mutatedCode: chosen.mutatedCode,
    expectedMutatedOutput: '', // To be filled by runner
    hint1_concept: chosen.hint1_concept,
    hint2_line: chosen.hint2_line,
    explanation: chosen.explanation
  };
}
