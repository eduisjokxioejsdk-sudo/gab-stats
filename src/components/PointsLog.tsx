import React from 'react';
import type { Point } from '@/types/volleyball';

interface PointsLogProps {
  points: Point[];
  teamAName: string;
  teamBName: string;
  teamAId: string;
}

const PointsLog: React.FC<PointsLogProps> = ({ points, teamAName, teamBName, teamAId }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Historique des points
      </h3>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {points.length === 0 && (
          <p className="text-muted-foreground text-xs italic">Aucun point joué</p>
        )}
        {points.map((point, i) => {
          const winnerName = point.winnerTeamId === teamAId ? teamAName : teamBName;
          const isEmpty = point.actions.length === 0;
          const hasEnded = !!point.timecodeEnd;

          return (
            <div
              key={point.id}
              className={`flex items-center justify-between px-2 py-1 rounded text-xs font-mono cursor-pointer hover:bg-secondary/50 transition-colors ${
                !hasEnded ? 'bg-primary/10 border border-primary/20' : ''
              }`}
            >
              <span className="text-muted-foreground w-6">#{i + 1}</span>
              <span className="text-foreground">
                {point.scoreA} - {point.scoreB}
              </span>
              {hasEnded ? (
                <span className={`font-bold ${point.winnerTeamId === teamAId ? 'text-score-win' : 'text-destructive'}`}>
                  {winnerName}
                </span>
              ) : (
                <span className="text-accent animate-pulse-glow">EN COURS</span>
              )}
              {isEmpty && hasEnded && (
                <span className="text-quality-bad text-[10px]">VIDE</span>
              )}
              {!isEmpty && (
                <span className="text-muted-foreground text-[10px]">{point.actions.length} act.</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PointsLog;
