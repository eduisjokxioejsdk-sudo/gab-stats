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
  const centralNumbers = useMemo(() => {
    if (!team) return [];
    return team.players.filter(p => p.role === 'central').map(p => p.number);
  }, [team]);

  const centralAttacks = useMemo(() =>
    actions.filter(a => a.type === 'attack' && a.teamId === teamId && centralNumbers.includes(a.playerNumber || 0)),
    [actions, teamId, centralNumbers]
  );

  const centralStats = useMemo(() => {
    return centralNumbers.map(num => {
      const playerAttacks = centralAttacks.filter(a => a.playerNumber === num);
      const player = team?.players.find(p => p.number === num);

      // Count ALL set calls when this central was in front row (available to attack)
      // AND count how many balls they actually got per call
      const byCall: Record<string, { called: number; attacked: number; kills: number; errors: number }> = {};
      const calls = ['avant', 'arriere', 'decalee'];
      calls.forEach(c => { byCall[c] = { called: 0, attacked: 0, kills: 0, errors: 0 }; });

      allPoints.forEach(point => {
        const pointActions = point.actions;
        for (let i = 0; i < pointActions.length; i++) {
          const a = pointActions[i];

          // Count set calls — central was "called" (available) whenever there's a set action
          // and the central is in front row. We approximate by checking if the central
          // attacked in this point or if the set call matches a central position.
          if (a.type === 'set' && a.teamId === teamId && a.setCall) {
            const call = a.setCall;
            if (call === 'none') continue;
            if (!byCall[call]) byCall[call] = { called: 0, attacked: 0, kills: 0, errors: 0 };

            // Check if there's an attack by this central following this set
            let centralAttacked = false;
            for (let j = i + 1; j < pointActions.length; j++) {
              if (pointActions[j].type === 'attack' && pointActions[j].playerNumber === num && pointActions[j].teamId === teamId) {
                centralAttacked = true;
                byCall[call].attacked++;
                if (pointActions[j].attackResult === 'kill') byCall[call].kills++;
                if (pointActions[j].attackResult === 'error' || pointActions[j].attackResult === 'blocked') byCall[call].errors++;
                break;
              }
              if (pointActions[j].type === 'attack') break; // another player attacked
            }

            // Count the call as "seen" by the central (he was called/available)
            // Only if the set call is a central-type call (avant, arriere, decalee)
            byCall[call].called++;
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

              {/* By call type — shows called vs attacked */}
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Distribution par appel</h4>
              <div className="grid grid-cols-3 gap-2">
                {['avant', 'arriere', 'decalee'].map(call => {
                  const data = cs.byCall[call] || { called: 0, attacked: 0, kills: 0, errors: 0 };
                  const callLabel = call === 'avant' ? 'Fixe Avant' : call === 'arriere' ? 'Fixe Arrière' : 'Décalée';
                  const callEff = data.attacked > 0 ? ((data.kills - data.errors) / data.attacked * 100).toFixed(0) : '-';
                  return (
                    <div key={call} className="bg-secondary/50 rounded-md p-2 text-center">
                      <p className="text-[10px] text-muted-foreground font-semibold">{callLabel}</p>
                      <p className="text-lg font-mono font-black text-foreground">{data.attacked}<span className="text-xs text-muted-foreground">/{data.called}</span></p>
                      <p className="text-[10px] text-muted-foreground">
                        {data.attacked > 0 ? `${data.kills}# / ${data.errors}E — ${callEff}%` : 'Pas de ballon'}
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
