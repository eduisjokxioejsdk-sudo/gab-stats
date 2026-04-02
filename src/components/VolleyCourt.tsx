import React from 'react';
import type { Coordinate } from '@/types/volleyball';

interface VolleyCourtProps {
  onCourtClick: (coord: Coordinate) => void;
  clicks: Coordinate[];
  servingSide?: 'left' | 'right';
  rotationLeft?: number[];
  rotationRight?: number[];
  teamLeftName?: string;
  teamRightName?: string;
}

const VolleyCourt: React.FC<VolleyCourtProps> = ({
  onCourtClick,
  clicks,
  servingSide,
  rotationLeft = [],
  rotationRight = [],
  teamLeftName,
  teamRightName,
}) => {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onCourtClick({ x, y });
  };

  // Position mapping for 6 positions on each side
  // Left side: P4(back-left), P3(back-center), P2(back-right), P5(front-left), P6(front-center), P1(front-right)
  // Actually standard volleyball: P1=back-right, P2=front-right, P3=front-center, P4=front-left, P5=back-left, P6=back-center
  const leftPositions = [
    { label: 'P4', x: 8, y: 30 },   // front-left
    { label: 'P3', x: 20, y: 30 },  // front-center
    { label: 'P2', x: 32, y: 30 },  // front-right
    { label: 'P5', x: 8, y: 70 },   // back-left
    { label: 'P6', x: 20, y: 70 },  // back-center
    { label: 'P1', x: 32, y: 70 },  // back-right (server)
  ];

  const rightPositions = [
    { label: 'P2', x: 68, y: 30 },  // front-left (from their perspective, front-right)
    { label: 'P3', x: 80, y: 30 },  // front-center
    { label: 'P4', x: 92, y: 30 },  // front-right
    { label: 'P1', x: 68, y: 70 },  // back-left (server)
    { label: 'P6', x: 80, y: 70 },  // back-center
    { label: 'P5', x: 92, y: 70 },  // back-right
  ];

  return (
    <div className="relative w-full">
      {/* Team names */}
      <div className="flex justify-between px-2 mb-1">
        <span className="text-xs font-bold text-primary">{teamLeftName || 'Équipe A'}</span>
        <span className="text-xs font-bold text-primary">{teamRightName || 'Équipe B'}</span>
      </div>

      <svg
        viewBox="0 0 100 100"
        className="w-full cursor-crosshair court-shadow rounded-md"
        onClick={handleClick}
        style={{ maxHeight: '300px' }}
      >
        {/* Court background */}
        <rect x="2" y="5" width="96" height="90" rx="2" fill="hsl(var(--court))" />

        {/* Left court */}
        <rect x="3" y="6" width="46" height="88" fill="hsl(var(--court))" stroke="hsl(var(--court-line))" strokeWidth="0.5" />
        {/* Right court */}
        <rect x="51" y="6" width="46" height="88" fill="hsl(var(--court))" stroke="hsl(var(--court-line))" strokeWidth="0.5" />

        {/* Net */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="hsl(var(--court-line))" strokeWidth="1" />

        {/* Attack lines (3m) */}
        <line x1="35" y1="6" x2="35" y2="94" stroke="hsl(var(--court-line))" strokeWidth="0.3" strokeDasharray="2,1" />
        <line x1="65" y1="6" x2="65" y2="94" stroke="hsl(var(--court-line))" strokeWidth="0.3" strokeDasharray="2,1" />

        {/* Center lines */}
        <line x1="3" y1="50" x2="49" y2="50" stroke="hsl(var(--court-line))" strokeWidth="0.15" opacity="0.3" />
        <line x1="51" y1="50" x2="97" y2="50" stroke="hsl(var(--court-line))" strokeWidth="0.15" opacity="0.3" />

        {/* Player positions - Left */}
        {leftPositions.map((pos, i) => (
          <g key={`l-${i}`}>
            <circle cx={pos.x} cy={pos.y} r="3.5" fill="hsl(var(--secondary))" stroke="hsl(var(--primary))" strokeWidth="0.4" />
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" fontSize="3" fill="hsl(var(--foreground))" fontWeight="bold" fontFamily="monospace">
              {rotationLeft[i] || ''}
            </text>
          </g>
        ))}

        {/* Player positions - Right */}
        {rightPositions.map((pos, i) => (
          <g key={`r-${i}`}>
            <circle cx={pos.x} cy={pos.y} r="3.5" fill="hsl(var(--secondary))" stroke="hsl(var(--primary))" strokeWidth="0.4" />
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" fontSize="3" fill="hsl(var(--foreground))" fontWeight="bold" fontFamily="monospace">
              {rotationRight[i] || ''}
            </text>
          </g>
        ))}

        {/* Service indicator */}
        {servingSide && (
          <text
            x={servingSide === 'left' ? 37 : 63}
            y={82}
            textAnchor="middle"
            fontSize="4"
            fill="hsl(var(--accent))"
          >
            🏐
          </text>
        )}

        {/* Click markers */}
        {clicks.map((c, i) => (
          <g key={`click-${i}`}>
            <circle cx={c.x} cy={c.y} r="2" fill="hsl(var(--accent))" opacity="0.9" />
            <circle cx={c.x} cy={c.y} r="3" fill="none" stroke="hsl(var(--accent))" strokeWidth="0.3" opacity="0.5" className="animate-pulse-glow" />
          </g>
        ))}

        {/* Trajectory line */}
        {clicks.length >= 2 && (
          <line
            x1={clicks[0].x}
            y1={clicks[0].y}
            x2={clicks[1].x}
            y2={clicks[1].y}
            stroke="hsl(var(--accent))"
            strokeWidth="0.8"
            strokeDasharray="2,1"
            markerEnd="url(#arrow)"
          />
        )}

        {/* Arrow marker */}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="hsl(var(--accent))" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default VolleyCourt;
