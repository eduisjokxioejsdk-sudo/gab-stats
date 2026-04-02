import React, { useMemo } from 'react';
import type { Action, Point, Team, AttackResult } from '@/types/volleyball';
import TrajectoryCourtMini from './TrajectoryCourtMini';
import QualityTable, { buildQualityRows } from './QualityTable';

interface AttackTabProps {
  actions: Action[];
  allPoints: Point[];
  teamId: string;
  team?: Team;
}

const resultLabel: Record<AttackResult, string> = {
  kill: '#', good: '+', touched: '-', bad: '!', blocked: '/', error: '=',
};

const resultColor = (r: AttackResult): string => {
  switch (r) {
    case 'kill': return 'hsl(145, 70%, 45%)';
    case 'good': return 'hsl(210, 80%, 55%)';
    case 'touched': return 'hsl(30, 80%, 55%)';
    case 'bad': return 'hsl(30, 60%, 45%)';
    case 'blocked': return 'hsl(0, 80%, 55%)';
    case 'error': return 'hsl(0, 60%, 45%)';
    default: return 'hsl(45, 80%, 55%)';
  }
};

const AttackTab: React.FC<AttackTabProps> = ({ actions, allPoints, teamId, team }) => {
  const liberoNumbers = useMemo(() => team?.liberos.map(l => l.number) || [], [team]);
  const setterNumber = team?.setterNumber;

  // Exclude liberos and setter
  const attacks = useMemo(() =>
    actions.filter(a => a.type === 'attack' && a.teamId === teamId
      && !liberoNumbers.includes(a.playerNumber || 0)
      && a.playerNumber !== setterNumber),
    [actions, teamId, liberoNumbers, setterNumber]
  );

  const trajectories = useMemo(() => {
    return attacks
      .filter(a => a.startCoord && a.endCoord)
      .map(a => ({
        start: a.startCoord!,
        end: a.endCoord!,
        color: resultColor(a.attackResult || 'good'),
        opacity: 0.65,
      }));
  }, [attacks]);

  const kills = attacks.filter(a => a.attackResult === 'kill').length;
  const errors = attacks.filter(a => a.attackResult === 'error' || a.attackResult === 'blocked').length;
  const total = attacks.length;
  const eff = total > 0 ? ((kills - errors) / total) * 100 : 0;

  const playerNumbers = useMemo(() => {
    const nums = new Set<number>();
    attacks.forEach(a => { if (a.playerNumber != null) nums.add(a.playerNumber); });
    return Array.from(nums).sort((a, b) => a - b);
  }, [attacks]);

  const attackQualityRows = useMemo(() => {
    const mapped = attacks.map(a => ({
      playerNumber: a.playerNumber,
      quality: a.attackResult === 'kill' ? '++' as const
        : (a.attackResult === 'error' || a.attackResult === 'blocked') ? '--' as const
        : a.attackResult === 'good' ? '+' as const
        : a.attackResult === 'bad' ? '-' as const
        : '0' as const,
    }));
    return buildQualityRows(mapped);
  }, [attacks]);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-mono font-black text-foreground">{eff.toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">Efficacité</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-black text-score-win">{kills}</p>
            <p className="text-[10px] text-muted-foreground"># Kills</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-black text-destructive">{errors}</p>
            <p className="text-[10px] text-muted-foreground">=/  Err+Blk</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-black text-foreground">{total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-muted-foreground">
        {(['kill', 'good', 'touched', 'bad', 'blocked', 'error'] as AttackResult[]).map(r => (
          <span key={r} className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: resultColor(r) }} />
            {resultLabel[r]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {playerNumbers.map(num => {
          const playerAttacks = attacks.filter(a => a.playerNumber === num);
          const playerTrajs = playerAttacks
            .filter(a => a.startCoord && a.endCoord)
            .map(a => ({
              start: a.startCoord!,
              end: a.endCoord!,
              color: resultColor(a.attackResult || 'good'),
              opacity: 0.7,
            }));
          const pKills = playerAttacks.filter(a => a.attackResult === 'kill').length;
          const pErrors = playerAttacks.filter(a => a.attackResult === 'error' || a.attackResult === 'blocked').length;
          const pEff = playerAttacks.length > 0 ? ((pKills - pErrors) / playerAttacks.length * 100).toFixed(0) : '0';
          return (
            <TrajectoryCourtMini
              key={num}
              trajectories={playerTrajs}
              title={`N°${num} — ${pKills}#/${pErrors}E/${playerAttacks.length}T (${pEff}%)`}
            />
          );
        })}
      </div>

      <QualityTable title="Attaque par joueur" rows={attackQualityRows} />
    </div>
  );
};

export default AttackTab;
