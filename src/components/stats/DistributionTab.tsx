import React, { useMemo } from 'react';
import type { Action, Point, Team, Match } from '@/types/volleyball';

interface DistributionTabProps {
  actions: Action[];
  allPoints: Point[];
  teamId: string;
  team?: Team;
  match?: Match;
}

// Rotation index: position of setter in the rotation array (0=P1, 1=P2, ..., 5=P6)
// Front row: P2(idx1), P3(idx2), P4(idx3)
// Back row: P1(idx0), P6(idx5), P5(idx4)

type ZoneId = '1' | '2' | '3-avant' | '3-arriere' | '3-deca' | '4' | '5' | '6';

interface ZoneStats {
  count: number;
  pct: number;
}

type RotationStats = Record<ZoneId, ZoneStats>;

function getSetterRotationIndex(rotation: number[], setterNumber: number): number {
  return rotation.indexOf(setterNumber);
}

function isSetterFrontRow(setterIdx: number): boolean {
  return setterIdx === 1 || setterIdx === 2 || setterIdx === 3;
}

const DistributionTab: React.FC<DistributionTabProps> = ({ actions, allPoints, teamId, team, match }) => {
  const setterNumber = team?.setterNumber;

  // Compute distribution per rotation
  const rotationData = useMemo(() => {
    if (!match || !setterNumber) return [];

    // Group points by the rotation at the time of the point
    // We need to reconstruct rotations per point
    const results: { rotIdx: number; setterFront: boolean; zones: RotationStats }[] = [];

    // For each rotation (setter at P1 through P6), gather set actions
    // rotIdx = index of setter in rotation array
    for (let rotIdx = 0; rotIdx < 6; rotIdx++) {
      const setterFront = isSetterFrontRow(rotIdx);
      const zones: RotationStats = {
        '1': { count: 0, pct: 0 },
        '2': { count: 0, pct: 0 },
        '3-avant': { count: 0, pct: 0 },
        '3-arriere': { count: 0, pct: 0 },
        '3-deca': { count: 0, pct: 0 },
        '4': { count: 0, pct: 0 },
        '5': { count: 0, pct: 0 },
        '6': { count: 0, pct: 0 },
      };
      results.push({ rotIdx, setterFront, zones });
    }

    // Walk through each set and each point, tracking rotation
    match.sets.forEach(setData => {
      const isTeamA = teamId === match.teamA.id;
      let rotation = [...(isTeamA ? setData.rotationA : setData.rotationB)];
      let servingTeamId = setData.servingTeamId;

      setData.points.forEach((point, ptIdx) => {
        // Apply substitutions for this point
        const subs = setData.substitutions.filter(s => s.teamId === teamId && s.atPointIndex === ptIdx);
        subs.forEach(sub => {
          const outIdx = rotation.indexOf(sub.outNumber);
          if (outIdx !== -1) rotation[outIdx] = sub.inNumber;
        });

        const setterIdx = getSetterRotationIndex(rotation, setterNumber);
        if (setterIdx === -1) return;

        const rotEntry = results[setterIdx];

        // Find set actions in this point for our team
        point.actions.forEach((action, aIdx) => {
          if (action.type === 'set' && action.teamId === teamId) {
            const call = action.setCall;
            // Find what attack position followed
            let attackPos: string | undefined;
            for (let j = aIdx + 1; j < point.actions.length; j++) {
              if (point.actions[j].type === 'attack' && point.actions[j].teamId === teamId) {
                attackPos = point.actions[j].attackPosition;
                break;
              }
            }

            // Map to zone
            let zone: ZoneId | null = null;
            if (attackPos === '4') zone = '4';
            else if (attackPos === '2') zone = '2'; // setter back
            else if (attackPos === '1') zone = '1'; // setter front
            else if (attackPos === '6') zone = '6'; // pipe
            else if (attackPos === '3') {
              // Central — use set call to differentiate
              if (call === 'avant') zone = '3-avant';
              else if (call === 'arriere') zone = '3-arriere';
              else if (call === 'decalee') zone = '3-deca';
              else zone = '3-avant'; // default
            } else if (attackPos === 'seconde_main') {
              zone = '5';
            }

            if (zone) {
              rotEntry.zones[zone].count++;
            }
          }
        });

        // Rotate after point if serving team scores and it's not our team,
        // or if we win the rally and we weren't serving (we rotate on sideout)
        if (point.winnerTeamId === teamId && servingTeamId !== teamId) {
          rotation = rotateArray(rotation);
        }
        servingTeamId = point.winnerTeamId || servingTeamId;
      });
    });

    // Calculate percentages per rotation
    results.forEach(r => {
      const total = Object.values(r.zones).reduce((s, z) => s + z.count, 0);
      Object.values(r.zones).forEach(z => {
        z.pct = total > 0 ? Math.round((z.count / total) * 100) : 0;
      });
    });

    return results;
  }, [match, setterNumber, teamId, allPoints]);

  if (!setterNumber) {
    return (
      <div className="text-center text-muted-foreground text-sm py-12">
        Aucun passeur défini. Assignez un passeur dans la gestion des équipes.
      </div>
    );
  }

  const rotationLabels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Distribution du passeur N°{setterNumber} par rotation
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {rotationData.map(rot => {
          const total = Object.values(rot.zones).reduce((s, z) => s + z.count, 0);
          return (
            <div key={rot.rotIdx} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary">
                  Passeur en {rotationLabels[rot.rotIdx]}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {rot.setterFront ? 'Avant' : 'Arrière'} — {total} ballons
                </span>
              </div>
              <HalfCourt
                zones={rot.zones}
                setterFront={rot.setterFront}
                setterRotIdx={rot.rotIdx}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

function rotateArray(arr: number[]): number[] {
  const n = [...arr];
  const first = n[0];
  for (let i = 0; i < 5; i++) n[i] = n[i + 1];
  n[5] = first;
  return n;
}

// Half court SVG component
interface HalfCourtProps {
  zones: RotationStats;
  setterFront: boolean;
  setterRotIdx: number;
}

const HalfCourt: React.FC<HalfCourtProps> = ({ zones, setterFront, setterRotIdx }) => {
  // Court dimensions in SVG viewBox
  const w = 300;
  const h = 200;
  const pad = 4;
  const courtW = w - pad * 2;
  const courtH = h - pad * 2;

  // Zones layout (looking at the court from behind, net at top):
  // Net side (top): Zone 4 (left) | Zone 3 (center, larger) | Zone 2 (right)
  // Back (bottom):  Zone 5 (left) | Zone 6 (center)         | Zone 1 (right)
  // If setter front → setter is in zone 2 area → zone 2 is empty, zone 1 shows stats
  // If setter back → setter is in zone 1 area → zone 1 is empty, zone 2 shows stats

  const netY = pad;
  const midY = pad + courtH * 0.5;
  const botY = pad + courtH;

  // Zone 3 (center) is wider
  const z4Left = pad;
  const z4Right = pad + courtW * 0.25;
  const z3Left = z4Right;
  const z3Right = pad + courtW * 0.75;
  const z2Left = z3Right;
  const z2Right = pad + courtW;

  // Back row same x divisions
  const z5Left = pad;
  const z5Right = pad + courtW * 0.25;
  const z6Left = z5Right;
  const z6Right = pad + courtW * 0.75;
  const z1Left = z6Right;
  const z1Right = pad + courtW;

  // Zone 3 subdivisions: K7 (déca) left, K1 (fixe avant) center, K2 (fixe arrière) right
  const k7Left = z3Left;
  const k7Right = z3Left + (z3Right - z3Left) / 3;
  const k1Left = k7Right;
  const k1Right = z3Left + (z3Right - z3Left) * 2 / 3;
  const k2Left = k1Right;
  const k2Right = z3Right;

  // Determine which back zone is the setter's (empty)
  const setterZoneLabel = setterFront ? '2' : '1';

  const renderZoneBox = (
    x: number, y: number, w: number, h: number,
    label: string, data: ZoneStats | null, isSetterZone: boolean,
    sublabel?: string
  ) => (
    <g key={`${label}-${sublabel || ''}`}>
      <rect
        x={x} y={y} width={w} height={h}
        fill={isSetterZone ? 'hsl(var(--muted))' : data && data.count > 0 ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.3)'}
        stroke="hsl(var(--border))"
        strokeWidth="1"
        rx="2"
      />
      {isSetterZone ? (
        <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central"
          fill="hsl(var(--muted-foreground))" fontSize="10" fontWeight="600">
          P
        </text>
      ) : data ? (
        <>
          <text x={x + w / 2} y={y + h * 0.25} textAnchor="middle" dominantBaseline="central"
            fill="hsl(var(--muted-foreground))" fontSize="8" fontWeight="500">
            {sublabel || label}
          </text>
          <text x={x + w / 2} y={y + h * 0.55} textAnchor="middle" dominantBaseline="central"
            fill="hsl(var(--foreground))" fontSize="16" fontWeight="800" fontFamily="JetBrains Mono, monospace">
            {data.count}
          </text>
          <text x={x + w / 2} y={y + h * 0.8} textAnchor="middle" dominantBaseline="central"
            fill="hsl(var(--primary))" fontSize="10" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            {data.pct}%
          </text>
        </>
      ) : null}
    </g>
  );

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded border border-border bg-background">
      {/* Court background */}
      <rect x={pad} y={pad} width={courtW} height={courtH} fill="hsl(var(--court))" rx="2" />

      {/* Net line */}
      <line x1={pad} y1={netY + 2} x2={pad + courtW} y2={netY + 2} stroke="hsl(var(--court-line))" strokeWidth="2" />

      {/* Attack line */}
      <line x1={pad} y1={midY} x2={pad + courtW} y2={midY} stroke="hsl(var(--court-line))" strokeWidth="0.5" strokeDasharray="4,2" opacity="0.5" />

      {/* Front row zones */}
      {renderZoneBox(z4Left, netY, z4Right - z4Left, midY - netY, 'Z4', zones['4'], false, 'Z4')}

      {/* Zone 3 subdivided: K7 (déca) | K1 (fixe) | K2 (fixe arrière) */}
      {renderZoneBox(k7Left, netY, k7Right - k7Left, midY - netY, 'K7', zones['3-deca'], false, 'K7')}
      {renderZoneBox(k1Left, netY, k1Right - k1Left, midY - netY, 'K1', zones['3-avant'], false, 'K1')}
      {renderZoneBox(k2Left, netY, k2Right - k2Left, midY - netY, 'K2', zones['3-arriere'], false, 'K2')}

      {/* Zone 2 — only if setter is back */}
      {renderZoneBox(z2Left, netY, z2Right - z2Left, midY - netY, 'Z2', setterFront ? null : zones['2'], setterFront, setterFront ? 'P' : 'Z2')}

      {/* Back row */}
      {/* Zone 5 — always empty */}
      {renderZoneBox(z5Left, midY, z5Right - z5Left, botY - midY, 'Z5', null, false)}
      <text x={(z5Left + z5Right) / 2} y={(midY + botY) / 2} textAnchor="middle" dominantBaseline="central"
        fill="hsl(var(--muted-foreground))" fontSize="8" opacity="0.4">Z5</text>

      {/* Zone 6 — pipe */}
      {renderZoneBox(z6Left, midY, z6Right - z6Left, botY - midY, 'Z6', zones['6'], false, 'Pipe')}

      {/* Zone 1 — only if setter is front */}
      {renderZoneBox(z1Left, midY, z1Right - z1Left, botY - midY, 'Z1', !setterFront ? null : zones['1'], !setterFront, !setterFront ? 'P' : 'Z1')}
    </svg>
  );
};

export default DistributionTab;
