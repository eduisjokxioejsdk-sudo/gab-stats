import React from 'react';
import type { Coordinate, PlayerRole } from '@/types/volleyball';

interface PlayerRoleMap {
  [playerNumber: number]: PlayerRole | undefined;
}

export interface PreviousService {
  startCoord: Coordinate;
  endCoord: Coordinate;
  serviceType?: 'smash' | 'float';
}

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
  rolesLeft?: PlayerRoleMap;
  rolesRight?: PlayerRoleMap;
  inputPhase?: string;
  previousServices?: PreviousService[];
}

const roleShape = (
  x: number, y: number, r: number, role: PlayerRole | undefined,
  teamColor: string, setterColor: string, isSetter: boolean
) => {
  const fill = isSetter ? setterColor : teamColor;

  switch (role) {
    case 'central':
      return (
        <polygon
          points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`}
          fill={fill} opacity="0.9"
        />
      );
    case 'pointu':
      return (
        <polygon
          points={`${x},${y - r} ${x + r},${y + r * 0.7} ${x - r},${y + r * 0.7}`}
          fill={fill} opacity="0.9"
        />
      );
    case 'r4':
      return (
        <rect
          x={x - r * 0.8} y={y - r * 0.8} width={r * 1.6} height={r * 1.6}
          fill={fill} opacity="0.9" rx="1"
        />
      );
    case 'passeur':
      return (
        <>
          <circle cx={x} cy={y} r={r} fill={setterColor} opacity="0.9" />
          <circle cx={x} cy={y} r={r + 1} fill="none" stroke="hsl(0, 0%, 100%)" strokeWidth="0.6" opacity="0.5" />
        </>
      );
    default:
      return <circle cx={x} cy={y} r={r} fill={fill} opacity="0.9" />;
  }
};

// Front row = rotation positions 2,3,4 ; Back row = 1,5,6
const isFrontRow = (rotPos: number) => rotPos >= 2 && rotPos <= 4;

// Map a role to its physical court zone for the serving team
// Front: passeur/pointu→2, central→3, r4→4
// Back: passeur/pointu→1, central→5, r4→6
function getRolePhysicalZone(role: PlayerRole | undefined, front: boolean): number {
  if (front) {
    switch (role) {
      case 'passeur': case 'pointu': return 2;
      case 'central': return 3;
      case 'r4': return 4;
      default: return 3; // fallback center
    }
  } else {
    switch (role) {
      case 'passeur': case 'pointu': return 1;
      case 'central': return 5;
      case 'r4': return 6;
      default: return 6; // fallback center
    }
  }
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
  rolesLeft = {},
  rolesRight = {},
  inputPhase,
  previousServices = [],
}) => {
  const courtLeft = 20;
  const courtRight = 200;
  const courtTop = 5;
  const courtBottom = 95;
  const courtMidX = 110;
  const courtW = 90;
  const courtH = 90;
  const attackLineOffset = 30;
  const thirdH = courtH / 3;

  // Physical zone coordinates for left team
  const leftZoneCoords: Record<number, { x: number; y: number }> = {
    4: { x: courtMidX - 15, y: courtTop + thirdH * 0.5 },
    3: { x: courtMidX - 15, y: courtTop + thirdH * 1.5 },
    2: { x: courtMidX - 15, y: courtTop + thirdH * 2.5 },
    5: { x: courtLeft + 15,  y: courtTop + thirdH * 0.5 },
    6: { x: courtLeft + 15,  y: courtTop + thirdH * 1.5 },
    1: { x: courtLeft + 15,  y: courtTop + thirdH * 2.5 },
  };
  const leftServiceZone = { x: 10, y: courtTop + thirdH * 2.5 };

  // Physical zone coordinates for right team
  const rightZoneCoords: Record<number, { x: number; y: number }> = {
    2: { x: courtMidX + 15, y: courtTop + thirdH * 0.5 },
    3: { x: courtMidX + 15, y: courtTop + thirdH * 1.5 },
    4: { x: courtMidX + 15, y: courtTop + thirdH * 2.5 },
    1: { x: courtRight - 15, y: courtTop + thirdH * 0.5 },
    6: { x: courtRight - 15, y: courtTop + thirdH * 1.5 },
    5: { x: courtRight - 15, y: courtTop + thirdH * 2.5 },
  };
  const rightServiceZone = { x: 210, y: courtTop + thirdH * 2.5 };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const svgX = inv.a * e.clientX + inv.c * e.clientY + inv.e;
    const svgY = inv.b * e.clientX + inv.d * e.clientY + inv.f;
    onCourtClick({ x: svgX, y: svgY });
  };

  const isServicePhase = inputPhase === 'idle' || inputPhase === 'service_coord' || inputPhase === 'service_type' || inputPhase === 'service_quality';
  const isLeftServing = servingSide === 'left';
  const isRightServing = servingSide === 'right';

  // Compute player positions for a team
  const computePlayerPositions = (
    rotation: number[],
    roles: PlayerRoleMap,
    zoneCoords: Record<number, { x: number; y: number }>,
    serviceZone: { x: number; y: number },
    isServing: boolean,
  ) => {
    const positions: { playerNum: number; x: number; y: number; rotPos: number }[] = [];

    if (!rotation.length) return positions;

    for (let rotPos = 1; rotPos <= 6; rotPos++) {
      const playerNum = rotation[rotPos - 1];
      if (!playerNum) continue;

      const front = isFrontRow(rotPos);
      const isServer = rotPos === 1;
      const role = roles[playerNum];

      if (isServing && isServicePhase) {
        // Server goes to service zone (or previous service start)
        if (isServer) {
          if (previousServices.length > 0) {
            // Position at last service start coord
            const lastService = previousServices[previousServices.length - 1];
            positions.push({ playerNum, x: lastService.startCoord.x, y: lastService.startCoord.y, rotPos });
          } else {
            positions.push({ playerNum, x: serviceZone.x, y: serviceZone.y, rotPos });
          }
        } else {
          // Non-server: place by role
          const physZone = getRolePhysicalZone(role, front);
          const coords = zoneCoords[physZone];
          positions.push({ playerNum, x: coords.x, y: coords.y, rotPos });
        }
      } else {
        // Not serving or not service phase: standard rotation position
        const coords = zoneCoords[rotPos];
        positions.push({ playerNum, x: coords.x, y: coords.y, rotPos });
      }
    }

    return positions;
  };

  const leftPlayers = computePlayerPositions(rotationLeft, rolesLeft, leftZoneCoords, leftServiceZone, isLeftServing);
  const rightPlayers = computePlayerPositions(rotationRight, rolesRight, rightZoneCoords, rightServiceZone, isRightServing);

  const blueTeam = 'hsl(210, 80%, 55%)';
  const redTeam = 'hsl(0, 70%, 50%)';
  const setterYellow = 'hsl(45, 90%, 50%)';

  return (
    <div className="relative w-full">
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
        <rect x="0" y="0" width="220" height="100" fill="hsl(var(--background))" rx="2" />
        <rect x="0" y={courtTop} width="20" height={courtH} fill="hsl(var(--court))" opacity={servingSide === 'left' ? 0.5 : 0.15} rx="1" />
        <rect x="200" y={courtTop} width="20" height={courtH} fill="hsl(var(--court))" opacity={servingSide === 'right' ? 0.5 : 0.15} rx="1" />
        
        {servingSide === 'left' && (
          <text x="10" y="55" textAnchor="middle" fontSize="5" fill="hsl(var(--accent))" fontWeight="bold" writingMode="tb" letterSpacing="2">SERVICE</text>
        )}
        {servingSide === 'right' && (
          <text x="210" y="55" textAnchor="middle" fontSize="5" fill="hsl(var(--accent))" fontWeight="bold" writingMode="tb" letterSpacing="2">SERVICE</text>
        )}

        <rect x={courtLeft} y={courtTop} width={courtW * 2} height={courtH} fill="hsl(var(--court))" />
        <rect x={courtLeft} y={courtTop} width={courtW * 2} height={courtH} fill="none" stroke="hsl(var(--court-line))" strokeWidth="0.8" />
        <line x1={courtMidX} y1={courtTop - 1} x2={courtMidX} y2={courtBottom + 1} stroke="hsl(var(--court-line))" strokeWidth="2" />
        <line x1={courtMidX - attackLineOffset} y1={courtTop} x2={courtMidX - attackLineOffset} y2={courtBottom}
          stroke="hsl(var(--court-line))" strokeWidth="0.5" strokeDasharray="3,1.5" opacity="0.6" />
        <line x1={courtMidX + attackLineOffset} y1={courtTop} x2={courtMidX + attackLineOffset} y2={courtBottom}
          stroke="hsl(var(--court-line))" strokeWidth="0.5" strokeDasharray="3,1.5" opacity="0.6" />

        {/* Previous service trajectories (ghost) */}
        {isServicePhase && previousServices.map((svc, i) => {
          const svcColor = svc.serviceType === 'smash' ? 'hsl(0, 80%, 55%)' : 'hsl(210, 80%, 55%)';
          return (
          <g key={`prev-svc-${i}`} opacity="0.3">
            <line
              x1={svc.startCoord.x} y1={svc.startCoord.y}
              x2={svc.endCoord.x} y2={svc.endCoord.y}
              stroke={svcColor} strokeWidth="1" strokeDasharray="2,2"
              markerEnd={svc.serviceType === 'smash' ? 'url(#arrow-ghost-smash)' : 'url(#arrow-ghost-float)'}
            />
            <circle cx={svc.startCoord.x} cy={svc.startCoord.y} r="2" fill={svcColor} />
            <circle cx={svc.endCoord.x} cy={svc.endCoord.y} r="2" fill={svcColor} />
          </g>
          );
        })}

        {/* Left team players */}
        {leftPlayers.map(({ playerNum, x, y, rotPos }) => {
          const isSetter = playerNum === setterLeft;
          const role = rolesLeft[playerNum];
          return (
            <g key={`l-${rotPos}`}>
              {roleShape(x, y, 6, role, blueTeam, setterYellow, isSetter)}
              <text x={x} y={y + 3.5} textAnchor="middle"
                fontSize="8" fill="hsl(0, 0%, 100%)" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">
                {playerNum}
              </text>
            </g>
          );
        })}

        {/* Right team players */}
        {rightPlayers.map(({ playerNum, x, y, rotPos }) => {
          const isSetter = playerNum === setterRight;
          const role = rolesRight[playerNum];
          return (
            <g key={`r-${rotPos}`}>
              {roleShape(x, y, 6, role, redTeam, setterYellow, isSetter)}
              <text x={x} y={y + 3.5} textAnchor="middle"
                fontSize="8" fill="hsl(0, 0%, 100%)" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">
                {playerNum}
              </text>
            </g>
          );
        })}

        {/* Liberos */}
        {liberoLeft.map((num, i) => (
          <g key={`ll-${i}`}>
            <circle cx={courtLeft - 8 + i * 14} cy={courtTop - 2} r="5" fill="hsl(var(--card))" stroke="hsl(var(--accent))" strokeWidth="0.8" />
            <text x={courtLeft - 8 + i * 14} y={courtTop - 0.5} textAnchor="middle" fontSize="5" fill="hsl(var(--accent))" fontWeight="bold" fontFamily="monospace">
              {num}
            </text>
          </g>
        ))}
        {liberoRight.map((num, i) => (
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
          <marker id="arrow-ghost" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="hsl(var(--accent))" opacity="0.4" />
          </marker>
        </defs>
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-1 text-[9px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill={setterYellow} /></svg> Passeur
        </span>
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><polygon points="5,1 9,5 5,9 1,5" fill={blueTeam} /></svg> Central
        </span>
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><polygon points="5,1 9,8 1,8" fill={blueTeam} /></svg> Pointu
        </span>
        <span className="flex items-center gap-1">
          <svg width="10" height="10"><rect x="1" y="1" width="8" height="8" rx="1" fill={blueTeam} /></svg> R4
        </span>
      </div>
    </div>
  );
};

export default VolleyCourt;
