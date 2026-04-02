import React, { useMemo } from 'react';
import type { Action, Point, Team } from '@/types/volleyball';
import TrajectoryCourtMini from './TrajectoryCourtMini';
import QualityTable, { buildQualityRows } from './QualityTable';

interface AttackTabProps {
  actions: Action[];
  allPoints: Point[];
  teamId: string;
  team?: Team;
}

const AttackTab: React.FC<AttackTabProps> = ({ actions, allPoints, teamId, team }) => {
  const liberoNumbers = useMemo(() => team?.liberos.map(l => l.number) || [], [team]);

  // Include all attacks except liberos
  const attacks = useMemo(() =>
    actions.filter(a => a.type === 'attack' && a.teamId === teamId && !liberoNumbers.includes(a.playerNumber || 0)),
    [actions, teamId, liberoNumbers]
  );

  const trajectories = useMemo(() => {
    return attacks
      .filter(a => a.startCoord && a.endCoord)
      .map(a => ({
        start: a.startCoord!,
        end: a.endCoord!,
        color: a.attackResult === 'kill'
          ? 'hsl(145, 70%, 45%)'
          : a.attackResult === 'error'
            ? 'hsl(0, 80%, 55%)'
            : 'hsl(45, 80%, 55%)',
        opacity: 0.65,
      }));
  }, [attacks]);

  const kills = attacks.filter(a => a.attackResult === 'kill').length;
  const errors = attacks.filter(a => a.attackResult === 'error').length;
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
        : a.attackResult === 'error' ? '--' as const
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
            <p className="text-[10px] text-muted-foreground">Kills</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-black text-destructive">{errors}</p>
            <p className="text-[10px] text-muted-foreground">Erreurs</p>
          </div>
          <div>
            <p className="text-2xl font-mono font-black text-foreground">{total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      <TrajectoryCourtMini trajectories={trajectories} title={`Toutes les trajectoires (${attacks.length} attaques)`} />
      <div className="flex gap-2 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-score-win inline-block rounded" /> Kill
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-destructive inline-block rounded" /> Erreur
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-yellow-500 inline-block rounded" /> Continu
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {playerNumbers.map(num => {
          const playerAttacks = attacks.filter(a => a.playerNumber === num);
          const playerTrajs = playerAttacks
            .filter(a => a.startCoord && a.endCoord)
            .map(a => ({
              start: a.startCoord!,
              end: a.endCoord!,
              color: a.attackResult === 'kill'
                ? 'hsl(145, 70%, 45%)'
                : a.attackResult === 'error'
                  ? 'hsl(0, 80%, 55%)'
                  : 'hsl(45, 80%, 55%)',
              opacity: 0.7,
            }));
          const pKills = playerAttacks.filter(a => a.attackResult === 'kill').length;
          const pErrors = playerAttacks.filter(a => a.attackResult === 'error').length;
          const pEff = playerAttacks.length > 0 ? ((pKills - pErrors) / playerAttacks.length * 100).toFixed(0) : '0';
          const isSecondeMain = playerAttacks.some(a => a.attackPosition === 'seconde_main');
          return (
            <TrajectoryCourtMini
              key={num}
              trajectories={playerTrajs}
              title={`N°${num}${isSecondeMain ? ' (2nde main)' : ''} — ${pKills}K/${pErrors}E/${playerAttacks.length}T (${pEff}%)`}
            />
          );
        })}
      </div>

      <QualityTable title="Attaque par joueur" rows={attackQualityRows} />
    </div>
  );
};

export default AttackTab;
