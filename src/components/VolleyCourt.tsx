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
}) => {
  // Court dimensions: real volleyball court is 18m x 9m = 2:1 ratio
  // viewBox: we use 220 x 100 to add service zones on each side
  // Court area: x=20..110 (left half), x=110..200 (right half), y=5..95 (9m = 90 units)
  // Service zones: x=0..20 (left service), x=200..220 (right service)
  const courtLeft = 20;
  const courtRight = 200;
  const courtTop = 5;
  const courtBottom = 95;
  const courtMidX = 110; // net
  const courtW = 90; // each half width
  const courtH = 90; // court height
  const attackLineOffset = 30; // 3m line = 1/3 of 9m

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const svgX = inv.a * e.clientX + inv.c * e.clientY + inv.e;
    const svgY = inv.b * e.clientX + inv.d * e.clientY + inv.f;
    onCourtClick({ x: svgX, y: svgY });
  };

  // Zone positions for players (center of each zone)
  // Volleyball positions viewed from above, looking at the court:
  // Front row (near net): P4(left), P3(center), P2(right)
  // Back row: P5(left), P6(center), P1(right - server)
  
  // Left team positions (court x=20..110, y=5..95)
  const zoneW = courtW / 3;
  const zoneH = courtH / 2;
  
  const leftZones = [
    // P4 front-left, P3 front-center, P2 front-right (near net)
    { pos: 4, x: courtLeft + zoneW * 0.5, y: courtTop + zoneH * 0.5 },
    { pos: 3, x: courtLeft + zoneW * 1.5, y: courtTop + zoneH * 0.5 },
    { pos: 2, x: courtLeft + zoneW * 2.5, y: courtTop + zoneH * 0.5 },
    // P5 back-left, P6 back-center, P1 back-right
    { pos: 5, x: courtLeft + zoneW * 0.5, y: courtTop + zoneH * 1.5 },
    { pos: 6, x: courtLeft + zoneW * 1.5, y: courtTop + zoneH * 1.5 },
    { pos: 1, x: courtLeft + zoneW * 2.5, y: courtTop + zoneH * 1.5 },
  ];

  // Right team positions (court x=110..200, y=5..95) - mirrored
  const rightZones = [
    { pos: 2, x: courtMidX + zoneW * 0.5, y: courtTop + zoneH * 0.5 },
    { pos: 3, x: courtMidX + zoneW * 1.5, y: courtTop + zoneH * 0.5 },
    { pos: 4, x: courtMidX + zoneW * 2.5, y: courtTop + zoneH * 0.5 },
    { pos: 1, x: courtMidX + zoneW * 0.5, y: courtTop + zoneH * 1.5 },
    { pos: 6, x: courtMidX + zoneW * 1.5, y: courtTop + zoneH * 1.5 },
    { pos: 5, x: courtMidX + zoneW * 2.5, y: courtTop + zoneH * 1.5 },
  ];

  // Map rotation array (index 0=P1, 1=P2, ..., 5=P6) to zones
  const getPlayerAtPosition = (rotation: number[], pos: number) => {
    return rotation[pos - 1]; // pos 1 -> index 0, etc.
  };

  const renderZoneGrid = (startX: number, startY: number, w: number, h: number) => {
    const lines = [];
    // Vertical lines dividing 3 columns
    for (let i = 1; i < 3; i++) {
      lines.push(
        <line key={`v${i}`} x1={startX + zoneW * i} y1={startY} x2={startX + zoneW * i} y2={startY + h}
          stroke="hsl(var(--court-line))" strokeWidth="0.3" strokeDasharray="2,2" opacity="0.4" />
      );
    }
    // Horizontal line dividing 2 rows
    lines.push(
      <line key="h" x1={startX} y1={startY + zoneH} x2={startX + w} y2={startY + zoneH}
        stroke="hsl(var(--court-line))" strokeWidth="0.3" strokeDasharray="2,2" opacity="0.4" />
    );
    return lines;
  };

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
        
        {/* Service zone labels */}
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

        {/* Attack lines (3m from net) */}
        <line x1={courtMidX - attackLineOffset} y1={courtTop} x2={courtMidX - attackLineOffset} y2={courtBottom}
          stroke="hsl(var(--court-line))" strokeWidth="0.5" strokeDasharray="3,1.5" opacity="0.6" />
        <line x1={courtMidX + attackLineOffset} y1={courtTop} x2={courtMidX + attackLineOffset} y2={courtBottom}
          stroke="hsl(var(--court-line))" strokeWidth="0.5" strokeDasharray="3,1.5" opacity="0.6" />

        {/* Zone grids */}
        {renderZoneGrid(courtLeft, courtTop, courtW, courtH)}
        {renderZoneGrid(courtMidX, courtTop, courtW, courtH)}

        {/* Player numbers - Left team */}
        {leftZones.map((zone) => {
          const playerNum = getPlayerAtPosition(rotationLeft, zone.pos);
          if (!playerNum) return null;
          return (
            <text key={`l-${zone.pos}`} x={zone.x} y={zone.y + 3} textAnchor="middle"
              fontSize="12" fill="hsl(var(--foreground))" fontWeight="bold" fontFamily="'Inter', sans-serif" opacity="0.85">
              {playerNum}
            </text>
          );
        })}

        {/* Player numbers - Right team */}
        {rightZones.map((zone) => {
          const playerNum = getPlayerAtPosition(rotationRight, zone.pos);
          if (!playerNum) return null;
          return (
            <text key={`r-${zone.pos}`} x={zone.x} y={zone.y + 3} textAnchor="middle"
              fontSize="12" fill="hsl(var(--foreground))" fontWeight="bold" fontFamily="'Inter', sans-serif" opacity="0.85">
              {playerNum}
            </text>
          );
        })}

        {/* Liberos - displayed outside the court at the top */}
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
