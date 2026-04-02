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
    <div className="flex items-center justify-center gap-4">
      {/* Team A */}
      <div className="flex items-center gap-2">
        {servingTeamSide === 'A' && <span className="text-accent text-xs">🏐</span>}
        <span className="text-sm font-bold text-foreground truncate">{teamAName}</span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-muted-foreground">S{setNumber}</span>
        <span className="text-xs text-muted-foreground">({setsWonA}-{setsWonB})</span>
        <span className={`font-mono text-2xl font-black ml-2 ${scoreA > scoreB ? 'text-score-win' : 'text-foreground'}`}>
          {scoreA}
        </span>
        <span className="text-muted-foreground text-sm">:</span>
        <span className={`font-mono text-2xl font-black ${scoreB > scoreA ? 'text-score-win' : 'text-foreground'}`}>
          {scoreB}
        </span>
      </div>

      {/* Team B */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-foreground truncate">{teamBName}</span>
        {servingTeamSide === 'B' && <span className="text-accent text-xs">🏐</span>}
      </div>
    </div>
  );
};

export default ScoreBoard;
