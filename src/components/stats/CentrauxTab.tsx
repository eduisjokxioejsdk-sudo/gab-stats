import React, { useMemo } from 'react';
import type { Action, Point, Team, Match } from '@/types/volleyball';
import TrajectoryCourtMini from './TrajectoryCourtMini';

interface CentrauxTabProps {
  actions: Action[];
  allPoints: Point[];
  teamId: string;
  team?: Team;
  match?: Match;
}

const resultColor = (r?: string): string => {
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

const CentrauxTab: React.FC<CentrauxTabProps> = ({ actions, allPoints, teamId, team, match }) => {
  // Find central players by role
  const centralNumbers = useMemo(() => {
    if (!team) return [];
    return team.players.filter(p => p.role === 'central').map(p => p.number);
  }, [team]);

  // All set actions (calls) for this team
  const setCalls = useMemo(() =>
    actions.filter(a => a.type === 'set' && a.teamId === teamId),
    [actions, teamId]
  );

  // All attacks by centrals (position 3 means center was attacked)
  const centralAttacks = useMemo(() =>
    actions.filter(a => a.type === 'attack' && a.teamId === teamId && centralNumbers.includes(a.playerNumber || 0)),
    [actions, teamId, centralNumbers]
  );

  // Group by central player
  const centralStats = useMemo(() => {
    return centralNumbers.map(num => {
      const playerAttacks = centralAttacks.filter(a => a.playerNumber === num);
      const player = team?.players.find(p => p.number === num);

      // Count calls: how many times was this central's position attacked
      const byCall: Record<string, { total: number; kills: number; errors: number }> = {};
      const calls = ['avant', 'arriere', 'decalee'];
      calls.forEach(c => { byCall[c] = { total: 0, kills: 0, errors: 0 }; });

      // Look at set actions preceding this central's attacks
      allPoints.forEach(point => {
        const pointActions = point.actions;
        for (let i = 0; i < pointActions.length; i++) {
          const a = pointActions[i];
          if (a.type === 'attack' && a.playerNumber === num && a.teamId === teamId) {
            // Find the preceding set call
            for (let j = i - 1; j >= 0; j--) {
              if (pointActions[j].type === 'set' && pointActions[j].setCall) {
                const call = pointActions[j].setCall!;
                if (!byCall[call]) byCall[call] = { total: 0, kills: 0, errors: 0 };
                byCall[call].total++;
                if (a.attackResult === 'kill') byCall[call].kills++;
                if (a.attackResult === 'error' || a.attackResult === 'blocked') byCall[call].errors++;
                break;
              }
            }
          }
        }
      });

      const trajs = playerAttacks
        .filter(a => a.startCoord && a.endCoord)
        .map(a => ({
          start: a.startCoord!,
          end: a.endCoord!,
          color: resultColor(a.attackResult),
          opacity: 0.7,
        }));

      const kills = playerAttacks.filter(a => a.attackResult === 'kill').length;
      const errors = playerAttacks.filter(a => a.attackResult === 'error' || a.attackResult === 'blocked').length;

      return { num, name: player?.name || `N°${num}`, attacks: playerAttacks, trajs, kills, errors, byCall };
    });
  }, [centralNumbers, centralAttacks, allPoints, teamId, team]);

  if (centralNumbers.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-12">
        Aucun central défini. Assignez le rôle "Central" aux joueurs dans la gestion des équipes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {centralStats.map(cs => {
        const total = cs.attacks.length;
        const eff = total > 0 ? ((cs.kills - cs.errors) / total * 100).toFixed(0) : '0';

        return (
          <div key={cs.num} className="space-y-3">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-bold text-primary mb-3">
                N°{cs.num} — {cs.name}
              </h3>
              <div className="grid grid-cols-4 gap-3 text-center mb-4">
                <div>
                  <p className="text-xl font-mono font-black text-foreground">{eff}%</p>
                  <p className="text-[10px] text-muted-foreground">Efficacité</p>
                </div>
                <div>
                  <p className="text-xl font-mono font-black text-score-win">{cs.kills}</p>
                  <p className="text-[10px] text-muted-foreground"># Kills</p>
                </div>
                <div>
                  <p className="text-xl font-mono font-black text-destructive">{cs.errors}</p>
                  <p className="text-[10px] text-muted-foreground">Err+Blk</p>
                </div>
                <div>
                  <p className="text-xl font-mono font-black text-foreground">{total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
              </div>

              {/* By call type */}
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Distribution par appel</h4>
              <div className="grid grid-cols-3 gap-2">
                {['avant', 'arriere', 'decalee'].map(call => {
                  const data = cs.byCall[call] || { total: 0, kills: 0, errors: 0 };
                  const callLabel = call === 'avant' ? 'Avant' : call === 'arriere' ? 'Arrière' : 'Décalée';
                  const callEff = data.total > 0 ? ((data.kills - data.errors) / data.total * 100).toFixed(0) : '-';
                  return (
                    <div key={call} className="bg-secondary/50 rounded-md p-2 text-center">
                      <p className="text-[10px] text-muted-foreground font-semibold">{callLabel}</p>
                      <p className="text-lg font-mono font-black text-foreground">{data.total}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {data.kills}# / {data.errors}E — {callEff}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <TrajectoryCourtMini
              trajectories={cs.trajs}
              title={`N°${cs.num} — Trajectoires (${total})`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CentrauxTab;
