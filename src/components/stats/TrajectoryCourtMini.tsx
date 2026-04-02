import React from 'react';
import type { Coordinate } from '@/types/volleyball';

interface TrajectoryCourtProps {
  trajectories: {
    start: Coordinate;
    end: Coordinate;
    color: string;
    opacity?: number;
  }[];
  title?: string;
}

const TrajectoryCourtMini: React.FC<TrajectoryCourtProps> = ({ trajectories, title }) => {
  const courtLeft = 20;
  const courtRight = 200;
  const courtTop = 5;
  const courtBottom = 95;
  const courtMidX = 110;
  const courtH = 90;
  const courtW = 90;
  const attackLineOffset = 30;

  return (
    <div>
      {title && <p className="text-[10px] text-muted-foreground font-mono mb-1">{title}</p>}
      <svg viewBox="0 0 220 100" className="w-full rounded border border-border bg-background">
        {/* Court */}
        <rect x={courtLeft} y={courtTop} width={courtW * 2} height={courtH} fill="hsl(var(--court))" />
        <rect x={courtLeft} y={courtTop} width={courtW * 2} height={courtH} fill="none" stroke="hsl(var(--court-line))" strokeWidth="0.5" />
        <line x1={courtMidX} y1={courtTop} x2={courtMidX} y2={courtBottom} stroke="hsl(var(--court-line))" strokeWidth="1.5" />
        <line x1={courtMidX - attackLineOffset} y1={courtTop} x2={courtMidX - attackLineOffset} y2={courtBottom}
          stroke="hsl(var(--court-line))" strokeWidth="0.3" strokeDasharray="2,1" opacity="0.5" />
        <line x1={courtMidX + attackLineOffset} y1={courtTop} x2={courtMidX + attackLineOffset} y2={courtBottom}
          stroke="hsl(var(--court-line))" strokeWidth="0.3" strokeDasharray="2,1" opacity="0.5" />

        {/* Service zones */}
        <rect x="0" y={courtTop} width="20" height={courtH} fill="hsl(var(--court))" opacity="0.15" />
        <rect x="200" y={courtTop} width="20" height={courtH} fill="hsl(var(--court))" opacity="0.15" />

        {/* Trajectories */}
        {trajectories.map((t, i) => (
          <line
            key={i}
            x1={t.start.x} y1={t.start.y}
            x2={t.end.x} y2={t.end.y}
            stroke={t.color}
            strokeWidth="1"
            opacity={t.opacity ?? 0.7}
            markerEnd="url(#traj-arrow)"
          />
        ))}

        <defs>
          <marker id="traj-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="hsl(var(--foreground))" opacity="0.5" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default TrajectoryCourtMini;
