import React from 'react';

interface ScoreBoardProps {
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  setsWonA: number;
  setsWonB: number;
  setNumber: number;
  servingTeamSide: 'A' | 'B';
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  setsWonA,
  setsWonB,
  setNumber,
  servingTeamSide,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-center mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Set {setNumber}
        </span>
        <div className="flex items-center justify-center gap-1 mt-1">
          {[setsWonA, setsWonB].map((w, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-muted-foreground text-xs mx-1">-</span>}
              <span className="text-xs font-mono text-muted-foreground">{w}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Team A */}
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            {servingTeamSide === 'A' && (
              <span className="text-accent text-xs">🏐</span>
            )}
            <span className="text-sm font-bold text-foreground truncate">{teamAName}</span>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          <span className={`font-mono text-4xl font-black ${scoreA > scoreB ? 'text-score-win' : 'text-foreground'}`}>
            {scoreA}
          </span>
          <span className="text-muted-foreground text-xl">:</span>
          <span className={`font-mono text-4xl font-black ${scoreB > scoreA ? 'text-score-win' : 'text-foreground'}`}>
            {scoreB}
          </span>
        </div>

        {/* Team B */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground truncate">{teamBName}</span>
            {servingTeamSide === 'B' && (
              <span className="text-accent text-xs">🏐</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;
