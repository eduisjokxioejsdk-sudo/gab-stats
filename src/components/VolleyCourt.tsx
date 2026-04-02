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
  liberoLeft?: number[];
  liberoRight?: number[];
  setterLeft?: number;
  setterRight?: number;
}

const VolleyCourt: React.FC<VolleyCourtProps> = ({
  onCourtClick,
  clicks,
  servingSide,
  rotationLeft = [],
  rotationRight = [],
  teamLeftName,
  teamRightName,
  liberoLeft = [],
  liberoRight = [],
  setterLeft,
  setterRight,
}) => {
  // Court: 18m x 9m = 2:1. ViewBox 220x100 with service zones on sides.
  // Court area: x=20..110 (left), x=110..200 (right), y=5..95
  const courtLeft = 20;
  const courtRight = 200;
  const courtTop = 5;
  const courtBottom = 95;
  const courtMidX = 110;
  const courtW = 90; // each half
  const courtH = 90;
  const attackLineOffset = 30; // 3m line

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const svgX = inv.a * e.clientX + inv.c * e.clientY + inv.e;
    const svgY = inv.b * e.clientX + inv.d * e.clientY + inv.f;
    onCourtClick({ x: svgX, y: svgY });
  };

  // Player positions: front row near net, back row near baseline
  // Left team (x=20..110): net is at x=110
  //   Front: P4(top), P3(center), P2(bottom) — near net (x ~ 90)
  //   Back: P5(top), P6(center), P1(bottom) — near baseline (x ~ 40)
  // Right team (x=110..200): net is at x=110
  //   Front: P2(top), P3(center), P4(bottom) — near net (x ~ 130)
  //   Back: P1(top), P6(center), P5(bottom) — near baseline (x ~ 180)

  const thirdH = courtH / 3;

  const leftPositions = [
    // Front row (near net x=110)
    { pos: 4, x: courtMidX - 15, y: courtTop + thirdH * 0.5 },
    { pos: 3, x: courtMidX - 15, y: courtTop + thirdH * 1.5 },
    { pos: 2, x: courtMidX - 15, y: courtTop + thirdH * 2.5 },
    // Back row (near baseline x=20)
    { pos: 5, x: courtLeft + 15, y: courtTop + thirdH * 0.5 },
    { pos: 6, x: courtLeft + 15, y: courtTop + thirdH * 1.5 },
    { pos: 1, x: courtLeft + 15, y: courtTop + thirdH * 2.5 },
  ];

  const rightPositions = [
    // Front row (near net x=110)
    { pos: 2, x: courtMidX + 15, y: courtTop + thirdH * 0.5 },
    { pos: 3, x: courtMidX + 15, y: courtTop + thirdH * 1.5 },
    { pos: 4, x: courtMidX + 15, y: courtTop + thirdH * 2.5 },
    // Back row (near baseline x=200)
    { pos: 1, x: courtRight - 15, y: courtTop + thirdH * 0.5 },
    { pos: 6, x: courtRight - 15, y: courtTop + thirdH * 1.5 },
    { pos: 5, x: courtRight - 15, y: courtTop + thirdH * 2.5 },
  ];

  const getPlayerAtPosition = (rotation: number[], pos: number) => rotation[pos - 1];

  return (
    <div className="relative w-full">
      {/* Team names */}
      <div className="flex justify-between px-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary">{teamLeftName || 'Équipe A'}</span>
          {liberoLeft.map((l, i) => (
            <span key={i} className="text-[10px] font-mono bg-accent/20 text-accent px-1 rounded">L{l}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {liberoRight.map((l, i) => (
            <span key={i} className="text-[10px] font-mono bg-accent/20 text-accent px-1 rounded">L{l}</span>
          ))}
          <span className="text-xs font-bold text-primary">{teamRightName || 'Équipe B'}</span>
        </div>
      </div>

      <svg
        viewBox="0 0 220 100"
        className="w-full cursor-crosshair court-shadow rounded-md"
        onClick={handleClick}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect x="0" y="0" width="220" height="100" fill="hsl(var(--background))" rx="2" />

        {/* Service zones */}
        <rect x="0" y={courtTop} width="20" height={courtH} fill="hsl(var(--court))" opacity={servingSide === 'left' ? 0.5 : 0.15} rx="1" />
        <rect x="200" y={courtTop} width="20" height={courtH} fill="hsl(var(--court))" opacity={servingSide === 'right' ? 0.5 : 0.15} rx="1" />
        
        {servingSide === 'left' && (
          <text x="10" y="55" textAnchor="middle" fontSize="5" fill="hsl(var(--accent))" fontWeight="bold" writingMode="tb" letterSpacing="2">SERVICE</text>
        )}
        {servingSide === 'right' && (
          <text x="210" y="55" textAnchor="middle" fontSize="5" fill="hsl(var(--accent))" fontWeight="bold" writingMode="tb" letterSpacing="2">SERVICE</text>
        )}

        {/* Main court */}
        <rect x={courtLeft} y={courtTop} width={courtW * 2} height={courtH} fill="hsl(var(--court))" />

        {/* Court outline */}
        <rect x={courtLeft} y={courtTop} width={courtW * 2} height={courtH} fill="none" stroke="hsl(var(--court-line))" strokeWidth="0.8" />

        {/* Net */}
        <line x1={courtMidX} y1={courtTop - 1} x2={courtMidX} y2={courtBottom + 1} stroke="hsl(var(--court-line))" strokeWidth="2" />

        {/* Attack lines (3m from net) — only lines, no grid */}
        <line x1={courtMidX - attackLineOffset} y1={courtTop} x2={courtMidX - attackLineOffset} y2={courtBottom}
          stroke="hsl(var(--court-line))" strokeWidth="0.5" strokeDasharray="3,1.5" opacity="0.6" />
        <line x1={courtMidX + attackLineOffset} y1={courtTop} x2={courtMidX + attackLineOffset} y2={courtBottom}
          stroke="hsl(var(--court-line))" strokeWidth="0.5" strokeDasharray="3,1.5" opacity="0.6" />

        {/* Player numbers - Left team (blue, setter yellow) */}
        {leftPositions.map((zone) => {
          const playerNum = getPlayerAtPosition(rotationLeft, zone.pos);
          if (!playerNum) return null;
          const isSetter = playerNum === setterLeft;
          const fill = isSetter ? 'hsl(45, 90%, 50%)' : 'hsl(210, 80%, 55%)';
          const stroke = isSetter ? 'hsl(45, 90%, 40%)' : 'hsl(210, 80%, 40%)';
          return (
            <g key={`l-${zone.pos}`}>
              <circle cx={zone.x} cy={zone.y} r="6" fill={fill} opacity="0.9" />
              <text x={zone.x} y={zone.y + 3.5} textAnchor="middle"
                fontSize="8" fill="hsl(0, 0%, 100%)" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">
                {playerNum}
              </text>
            </g>
          );
        })}

        {/* Player numbers - Right team (red, setter yellow) */}
        {rightPositions.map((zone) => {
          const playerNum = getPlayerAtPosition(rotationRight, zone.pos);
          if (!playerNum) return null;
          const isSetter = playerNum === setterRight;
          const fill = isSetter ? 'hsl(45, 90%, 50%)' : 'hsl(0, 70%, 50%)';
          const stroke = isSetter ? 'hsl(45, 90%, 40%)' : 'hsl(0, 70%, 40%)';
          return (
            <g key={`r-${zone.pos}`}>
              <circle cx={zone.x} cy={zone.y} r="6" fill={fill} opacity="0.9" />
              <text x={zone.x} y={zone.y + 3.5} textAnchor="middle"
                fontSize="8" fill="hsl(0, 0%, 100%)" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">
                {playerNum}
              </text>
            </g>
          );
        })}

        {/* Liberos - outside court at top */}
        {liberoLeft.length > 0 && liberoLeft.map((num, i) => (
          <g key={`ll-${i}`}>
            <circle cx={courtLeft - 8 + i * 14} cy={courtTop - 2} r="5" fill="hsl(var(--card))" stroke="hsl(var(--accent))" strokeWidth="0.8" />
            <text x={courtLeft - 8 + i * 14} y={courtTop - 0.5} textAnchor="middle" fontSize="5" fill="hsl(var(--accent))" fontWeight="bold" fontFamily="monospace">
              {num}
            </text>
          </g>
        ))}
        {liberoRight.length > 0 && liberoRight.map((num, i) => (
          <g key={`lr-${i}`}>
            <circle cx={courtRight + 8 - i * 14} cy={courtTop - 2} r="5" fill="hsl(var(--card))" stroke="hsl(var(--accent))" strokeWidth="0.8" />
            <text x={courtRight + 8 - i * 14} y={courtTop - 0.5} textAnchor="middle" fontSize="5" fill="hsl(var(--accent))" fontWeight="bold" fontFamily="monospace">
              {num}
            </text>
          </g>
        ))}

        {/* Click markers */}
        {clicks.map((c, i) => (
          <g key={`click-${i}`}>
            <circle cx={c.x} cy={c.y} r="3" fill="hsl(var(--accent))" opacity="0.9" />
            <circle cx={c.x} cy={c.y} r="5" fill="none" stroke="hsl(var(--accent))" strokeWidth="0.5" opacity="0.5" className="animate-pulse-glow" />
          </g>
        ))}

        {/* Trajectory line */}
        {clicks.length >= 2 && (
          <line
            x1={clicks[0].x} y1={clicks[0].y}
            x2={clicks[1].x} y2={clicks[1].y}
            stroke="hsl(var(--accent))" strokeWidth="1.2" strokeDasharray="3,1.5"
            markerEnd="url(#arrow)"
          />
        )}

        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--accent))" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default VolleyCourt;
