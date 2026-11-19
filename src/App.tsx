import React, { useState, useEffect, useCallback } from 'react';
import { 
  Concept, 
  Difficulty, 
  CodeSnippet, 
  SnippetMutationOption, 
  ExecutionResult, 
  Attempt 
} from './types';
import { SNIPPETS_BANK } from './data/snippets';
import { getAvailableMutation } from './services/mutationEngine';
import { runPythonWithTrace, initPyodide } from './services/pythonRunner';
import { saveAttempt, getStreak, getPrioritizedReviewConcepts } from './services/storage';

// Components
import { Navbar } from './components/Navbar';
import { ChallengeView } from './components/ChallengeView';
import { VerificationView } from './components/VerificationView';
import { BlindSpotsMap } from './components/BlindSpotsMap';
import { CustomSnippetModal } from './components/CustomSnippetModal';
import { SessionModeModal } from './components/SessionModeModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'challenge' | 'blindspots' | 'custom' | 'session'>('challenge');
  const [selectedConcept, setSelectedConcept] = useState<Concept>('recursion');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('básico');
  const [streak, setStreak] = useState<number>(getStreak());
  const [pyodideReady, setPyodideReady] = useState<boolean>(false);

  // Active Challenge State
  const [currentSnippet, setCurrentSnippet] = useState<CodeSnippet>(SNIPPETS_BANK[0]);
  const [currentMutation, setCurrentMutation] = useState<SnippetMutationOption>(SNIPPETS_BANK[0].mutations[0]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Verification Results State
  const [verificationData, setVerificationData] = useState<{
    userPrediction: string;
    userTrace?: string;
    executionResult: ExecutionResult;
    isCorrect: boolean;
    scoreEarned: number;
    hintsUsed: number;
  } | null>(null);

  // Initialize Pyodide on mount
  useEffect(() => {
    initPyodide().then(instance => {
      if (instance) {
        setPyodideReady(true);
      }
    });
  }, []);

  // Function to pick a new challenge matching the selected filters
  const loadChallenge = useCallback((concept: Concept, difficulty: Difficulty) => {
    setVerificationData(null);

    // Filter snippets by concept and difficulty
    let matching = SNIPPETS_BANK.filter(
      s => s.concept === concept && s.difficulty === difficulty
    );

    // If none found for that specific pair, match by concept alone
    if (matching.length === 0) {
      matching = SNIPPETS_BANK.filter(s => s.concept === concept);
    }

    if (matching.length === 0) {
      matching = SNIPPETS_BANK;
    }

    const randomSnippet = matching[Math.floor(Math.random() * matching.length)];
    const mutation = getAvailableMutation(randomSnippet);

    if (randomSnippet && mutation) {
      setCurrentSnippet(randomSnippet);
      setCurrentMutation(mutation);
    }
  }, []);

  // When concept or difficulty change, reload challenge
  const handleSelectConcept = (c: Concept) => {
    setSelectedConcept(c);
    loadChallenge(c, selectedDifficulty);
  };

  const handleSelectDifficulty = (d: Difficulty) => {
    setSelectedDifficulty(d);
    loadChallenge(selectedConcept, d);
  };

  const handleNewChallenge = () => {
    loadChallenge(selectedConcept, selectedDifficulty);
  };

  // Submit prediction and execute in Pyodide
  const handleSubmitPrediction = async (
    userPrediction: string,
    userTrace: string,
    hintsUsed: number,
    possibleScore: number
  ) => {
    setIsExecuting(true);
    const startTime = Date.now();

    try {
      // Execute mutated code in Pyodide with 5s timeout and sys.settrace
      const executionResult = await runPythonWithTrace(currentMutation.mutatedCode, 5000);

      const actualStdoutClean = executionResult.stdout.trim();
      const userPredictionClean = userPrediction.trim();

      // Compare real output line-by-line with prediction
      const isCorrect = !executionResult.error && (actualStdoutClean === userPredictionClean);
      const scoreEarned = isCorrect ? possibleScore : 0;
      const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

      // Record attempt in local storage
      const attempt: Attempt = {
        id: `att_${Date.now()}`,
        snippetId: currentSnippet.id,
        concept: currentSnippet.concept,
        difficulty: currentSnippet.difficulty,
        mutationType: currentMutation.mutationType,
        userPrediction: userPredictionClean,
        userTrace: userTrace.trim() || undefined,
        actualOutput: actualStdoutClean,
        isCorrect,
        hintsUsed,
        score: scoreEarned,
        timeSpentSeconds,
        timestamp: Date.now()
      };

      saveAttempt(attempt);
      setStreak(getStreak());

      // Transition to Verification View
      setVerificationData({
        userPrediction,
        userTrace,
        executionResult,
        isCorrect,
        scoreEarned,
        hintsUsed
      });
    } catch (err: any) {
      console.error('Error during prediction verification:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Review prioritized concepts action ("Repasar")
  const handleReviewPrioritized = () => {
    const prioritized = getPrioritizedReviewConcepts();
    if (prioritized.length > 0) {
      const topConcept = prioritized[0].concept;
      setSelectedConcept(topConcept);
      loadChallenge(topConcept, selectedDifficulty);
      setActiveTab('challenge');
    }
  };

  // Handle custom snippet creation
  const handleCustomChallengeCreated = (
    customSnippet: CodeSnippet,
    customMutation: SnippetMutationOption
  ) => {
    setCurrentSnippet(customSnippet);
    setCurrentMutation(customMutation);
    setSelectedConcept(customSnippet.concept);
    setVerificationData(null);
    setActiveTab('challenge');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col font-sans selection:bg-[#FF0033] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setVerificationData(null);
          setActiveTab(tab);
        }}
        streak={streak}
        pyodideReady={pyodideReady}
        onReviewClick={handleReviewPrioritized}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        
        {/* Practice Gymnasium Tab */}
        {activeTab === 'challenge' && (
          <>
            {!verificationData ? (
              <ChallengeView
                currentSnippet={currentSnippet}
                currentMutation={currentMutation}
                selectedConcept={selectedConcept}
                selectedDifficulty={selectedDifficulty}
                onSelectConcept={handleSelectConcept}
                onSelectDifficulty={handleSelectDifficulty}
                onNewChallenge={handleNewChallenge}
                onSubmitPrediction={handleSubmitPrediction}
                isExecuting={isExecuting}
              />
            ) : (
              <VerificationView
                currentSnippet={currentSnippet}
                currentMutation={currentMutation}
                userPrediction={verificationData.userPrediction}
                userTrace={verificationData.userTrace}
                executionResult={verificationData.executionResult}
                isCorrect={verificationData.isCorrect}
                scoreEarned={verificationData.scoreEarned}
                hintsUsed={verificationData.hintsUsed}
                onNextChallenge={handleNewChallenge}
                onRetryChallenge={() => setVerificationData(null)}
                onOpenBlindSpots={() => setActiveTab('blindspots')}
              />
            )}
          </>
        )}

        {/* Blind Spots Analytics Map Tab */}
        {activeTab === 'blindspots' && (
          <BlindSpotsMap
            streak={streak}
            onStartPracticeConcept={(concept) => {
              setSelectedConcept(concept);
              loadChallenge(concept, selectedDifficulty);
              setActiveTab('challenge');
            }}
            onStartReviewSession={handleReviewPrioritized}
          />
        )}

        {/* Custom Snippet Tab */}
        {activeTab === 'custom' && (
          <CustomSnippetModal
            onChallengeCreated={handleCustomChallengeCreated}
            onCancel={() => setActiveTab('challenge')}
          />
        )}

        {/* 20-Minute Exam Session Mode Tab */}
        {activeTab === 'session' && (
          <SessionModeModal
            onFinishSession={() => setActiveTab('blindspots')}
            onExit={() => setActiveTab('challenge')}
          />
        )}

      </main>

      {/* Ultra-Minimalist Light Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-5 text-xs text-[#666666]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#0A0A0A] tracking-tight text-sm">Trace<span className="text-[#FF0033] text-red-elegant text-base">Gym</span></span>
            <span className="text-[#D1D5DB]">•</span>
            <span className="text-red-elegant text-[#FF0033] text-sm">«Entrena la mente para predecir código sin correrlo»</span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-[#888888]">
            <span>100% Local (Pyodide WASM)</span>
            <span>•</span>
            <span>Sin APIs de pago</span>
            <span>•</span>
            <span>LocalStorage</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
