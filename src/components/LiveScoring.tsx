import React, { useEffect, useCallback } from 'react';
import { useMatchStore } from '@/store/matchStore';
import { useShortcutsStore } from '@/store/shortcutsStore';
import VolleyCourt from '@/components/VolleyCourt';
import InputGuide from '@/components/InputGuide';
import ScoreBoard from '@/components/ScoreBoard';
import PointsLog from '@/components/PointsLog';

const LiveScoring: React.FC = () => {
  const {
    match,
    inputState,
    startPoint,
    endPoint,
    assignPointWinner,
    processKeyInput,
    addCourtClick,
    setView,
    getCurrentSet,
  } = useMatchStore();

  const currentSet = getCurrentSet();
  const { shortcuts } = useShortcutsStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;
    // Start/end point
    if (key === shortcuts.startEndPoint) {
      e.preventDefault();
      if (inputState.phase === 'idle') {
        startPoint();
      } else if (inputState.phase !== 'point_winner') {
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

    // Forward key to processKeyInput
    if (key.length === 1) {
      processKeyInput(key.toLowerCase());
    }
  }, [inputState.phase, match, startPoint, endPoint, assignPointWinner, processKeyInput, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!match || !currentSet) return null;

  const lastPoint = currentSet.points[currentSet.points.length - 1];
  const servingTeamId = lastPoint?.servingTeamId || match.teamA.id;
  const servingSide: 'A' | 'B' = servingTeamId === match.teamA.id ? 'A' : 'B';

  // Rotation array: index 0 = P1, index 1 = P2, etc. Court component handles position mapping.

  return (
    <div className="min-h-screen flex flex-col no-select">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
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

      {/* Main content */}
      <div className="flex-1 grid grid-cols-[1fr_320px] gap-4 p-4">
        {/* Left: Court + Input */}
        <div className="space-y-4">
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

          <VolleyCourt
            onCourtClick={addCourtClick}
            clicks={inputState.courtClicks}
            servingSide={servingSide === 'A' ? 'left' : 'right'}
            rotationLeft={mapRotationToDisplay(currentSet.currentRotationA)}
            rotationRight={mapRotationToDisplay(currentSet.currentRotationB)}
            teamLeftName={match.teamA.name}
            teamRightName={match.teamB.name}
          />

          <InputGuide phase={inputState.phase} buffer={inputState.buffer} />

          {/* Point winner modal overlay */}
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
                  [←] ou [→] sur le clavier
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: Points log */}
        <div className="space-y-4">
          <PointsLog
            points={currentSet.points}
            teamAName={match.teamA.name}
            teamBName={match.teamB.name}
            teamAId={match.teamA.id}
          />

          {/* Current set rotation display */}
          <div className="bg-card border border-border rounded-lg p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Rotations actuelles</h3>
            {[{ name: match.teamA.name, rotation: currentSet.currentRotationA },
              { name: match.teamB.name, rotation: currentSet.currentRotationB }].map((team, ti) => (
              <div key={ti} className="mb-2">
                <span className="text-[10px] text-primary font-bold">{team.name}</span>
                <div className="flex gap-1 mt-0.5">
                  {team.rotation.map((num, i) => (
                    <span
                      key={i}
                      className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                        i === 0 ? 'bg-accent text-accent-foreground font-bold' : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Set won indicator */}
          {currentSet.winnerTeamId && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
              <p className="text-primary font-bold text-lg">
                Set gagné par {currentSet.winnerTeamId === match.teamA.id ? match.teamA.name : match.teamB.name} !
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {match.setsWonA} - {match.setsWonB}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveScoring;
