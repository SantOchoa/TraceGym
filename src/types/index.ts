export type Concept = 
  | 'recursion'
  | 'slicing'
  | 'list_aliasing'
  | 'scope'
  | 'nested_loops'
  | 'mutable_defaults';

export type Difficulty = 'básico' | 'medio' | 'avanzado';

export type AppTab = 'challenge' | 'blindspots' | 'custom' | 'session' | 'coach';

export interface ConceptMeta {
  id: Concept;
  label: string;
  shortDesc: string;
  examTrap: string;
}

export interface CodeSnippet {
  id: string;
  title: string;
  concept: Concept;
  difficulty: Difficulty;
  originalCode: string;
  expectedOriginalOutput: string;
  mutations: SnippetMutationOption[];
}

export interface SnippetMutationOption {
  id: string;
  mutationType: string;
  line: number; // 1-based line number
  originalSnippet: string;
  mutatedSnippet: string;
  mutatedCode: string;
  expectedMutatedOutput: string;
  hint1_concept: string;
  hint2_line: string;
  explanation: string;
}

export interface ExecutionResult {
  stdout: string;
  error?: string;
  executionTimeMs: number;
  traceSteps: TraceStep[];
}

export interface TraceStep {
  step: number;
  line: number;
  lineCode: string;
  variables: Record<string, string>;
  stdoutSnapshot: string;
  callStack?: string[];
}

export interface Attempt {
  id: string;
  snippetId: string;
  concept: Concept;
  difficulty: Difficulty;
  mutationType: string;
  userPrediction: string;
  userTrace?: string;
  actualOutput: string;
  isCorrect: boolean;
  hintsUsed: number; // 0, 1, 2
  score: number; // 0 - 100
  timeSpentSeconds: number;
  timestamp: number; // Unix ms
}

export interface SpacedRepetitionCard {
  concept: Concept;
  level: number; // 0 = failed, 1 = 1 day, 2 = 3 days, 3 = 7 days, 4 = mastered
  lastPracticed: number;
  nextReviewDate: number;
  consecutiveSuccesses: number;
}

export interface ConceptStat {
  concept: Concept;
  label: string;
  totalAttempts: number;
  successes: number;
  accuracyRate: number; // 0 - 100
  lastPracticed?: number;
  status: 'critical' | 'warning' | 'mastered' | 'untested';
}
