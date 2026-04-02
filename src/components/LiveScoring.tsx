import React, { useEffect, useCallback } from 'react';
import { useMatchStore } from '@/store/matchStore';
import { useShortcutsStore } from '@/store/shortcutsStore';
import VolleyCourt from '@/components/VolleyCourt';
import InputGuide from '@/components/InputGuide';
import ScoreBoard from '@/components/ScoreBoard';
import ActionLog from '@/components/ActionLog';

const LiveScoring: React.FC = () => {
  const {
    match,
    inputState,
    endPoint,
    assignPointWinner,
    processKeyInput,
    addCourtClick,
    setView,
    getCurrentSet,
    getCurrentPointActions,
  } = useMatchStore();

  const currentSet = getCurrentSet();
  const { shortcuts } = useShortcutsStore();
  const currentActions = getCurrentPointActions();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;

    // End point shortcut (only when in a point, not idle or point_winner)
    if (key === shortcuts.startEndPoint) {
      e.preventDefault();
      if (inputState.phase !== 'idle' && inputState.phase !== 'point_winner') {
        endPoint();
      }
      return;
    }

    if (inputState.phase === 'point_winner') {
      if (key === shortcuts.winnerLeft && match) {
        assignPointWinner(match.teamA.id);
      } else if (key === shortcuts.winnerRight && match) {
        assignPointWinner(match.teamB.id);
      }
      return;
    }

    if (key === 'Enter') {
      processKeyInput('enter');
    } else if (key === 'Backspace') {
      e.preventDefault();
      processKeyInput('backspace');
    } else if (key.length === 1) {
      processKeyInput(key.toLowerCase());
    }
  }, [inputState.phase, match, endPoint, assignPointWinner, processKeyInput, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!match || !currentSet) return null;

  const lastPoint = currentSet.points[currentSet.points.length - 1];
  const servingTeamId = lastPoint?.servingTeamId || match.teamA.id;
  const servingSide: 'A' | 'B' = servingTeamId === match.teamA.id ? 'A' : 'B';

  return (
    <div className="h-screen flex flex-col no-select overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black tracking-tighter text-foreground">
            pure<span className="text-primary">volley</span>
          </h1>
          <span className="text-xs text-muted-foreground font-mono">{match.name}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('dashboard')}
            className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md font-semibold hover:bg-secondary/80 transition-colors"
          >
            📊 Stats
          </button>
          <button
            onClick={() => setView('settings')}
            className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md font-semibold hover:bg-secondary/80 transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Score */}
      <div className="px-4 pt-2 shrink-0">
        <ScoreBoard
          teamAName={match.teamA.name}
          teamBName={match.teamB.name}
          scoreA={currentSet.scoreA}
          scoreB={currentSet.scoreB}
          setsWonA={match.setsWonA}
          setsWonB={match.setsWonB}
          setNumber={currentSet.setNumber}
          servingTeamSide={servingSide}
        />
      </div>

      {/* Main area: Court left + Action log right */}
      <div className="flex-1 flex min-h-0 px-4 py-2 gap-3">
        {/* Court - takes most space, pinned left */}
        <div className="flex-1 flex items-center justify-start">
          <div className="w-full max-w-4xl">
            <VolleyCourt
              onCourtClick={addCourtClick}
              clicks={inputState.courtClicks}
              servingSide={servingSide === 'A' ? 'left' : 'right'}
              rotationLeft={currentSet.currentRotationA}
              rotationRight={currentSet.currentRotationB}
              teamLeftName={match.teamA.name}
              teamRightName={match.teamB.name}
              liberoLeft={match.teamA.liberos.map(l => l.number)}
              liberoRight={match.teamB.liberos.map(l => l.number)}
            />
          </div>
        </div>

        {/* Action log - right panel */}
        <div className="w-64 shrink-0">
          <ActionLog
            actions={currentActions}
            teamAName={match.teamA.name}
            teamBName={match.teamB.name}
            teamAId={match.teamA.id}
          />
        </div>
      </div>

      {/* Input guide at bottom */}
      <div className="px-4 pb-3 shrink-0">
        <InputGuide
          phase={inputState.phase}
          buffer={inputState.buffer}
          teamAName={match.teamA.name}
          teamBName={match.teamB.name}
        />
      </div>

      {/* Point winner modal */}
      {inputState.phase === 'point_winner' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-primary/30 rounded-xl p-8 glow-primary animate-slide-in max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-center text-foreground mb-6">
              Qui a gagné le point ?
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => assignPointWinner(match.teamA.id)}
                className="bg-primary text-primary-foreground py-6 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
              >
                ← {match.teamA.name}
              </button>
              <button
                onClick={() => assignPointWinner(match.teamB.id)}
                className="bg-primary text-primary-foreground py-6 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
              >
                {match.teamB.name} →
              </button>
            </div>
            <p className="text-center text-muted-foreground text-xs mt-4 font-mono">
              [{shortcuts.winnerLeft === 'ArrowLeft' ? '←' : shortcuts.winnerLeft}] ou [{shortcuts.winnerRight === 'ArrowRight' ? '→' : shortcuts.winnerRight}] sur le clavier
            </p>
          </div>
        </div>
      )}

      {/* Set won indicator */}
      {currentSet.winnerTeamId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-primary/10 border border-primary/30 rounded-lg p-4 text-center z-40">
          <p className="text-primary font-bold text-lg">
            Set gagné par {currentSet.winnerTeamId === match.teamA.id ? match.teamA.name : match.teamB.name} !
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            {match.setsWonA} - {match.setsWonB}
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveScoring;
