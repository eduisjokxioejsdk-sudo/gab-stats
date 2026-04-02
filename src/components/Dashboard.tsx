import React, { useMemo } from 'react';
import { useMatchStore } from '@/store/matchStore';
import type { Action, Point, SetData } from '@/types/volleyball';

const Dashboard: React.FC = () => {
  const { match, setView } = useMatchStore();

  const stats = useMemo(() => {
    if (!match) return null;

    const allPoints: Point[] = match.sets.flatMap(s => s.points);
    const allActions: Action[] = allPoints.flatMap(p => p.actions);

    // Reception stats per team
    const receptionStats = (teamId: string) => {
      const receptions = allActions.filter(a => a.type === 'reception' && a.teamId === teamId);
      const total = receptions.length;
      if (total === 0) return { total: 0, excellent: 0, good: 0, neutral: 0, bad: 0, terrible: 0, efficiency: 0 };
      const excellent = receptions.filter(a => a.quality === '++').length;
      const good = receptions.filter(a => a.quality === '+').length;
      const neutral = receptions.filter(a => a.quality === '0').length;
      const bad = receptions.filter(a => a.quality === '-').length;
      const terrible = receptions.filter(a => a.quality === '--').length;
      const efficiency = ((excellent + good) / total) * 100;
      return { total, excellent, good, neutral, bad, terrible, efficiency };
    };

    // Attack stats per team and per player
    const attackStats = (teamId: string) => {
      const attacks = allActions.filter(a => a.type === 'attack' && a.teamId === teamId);
      const total = attacks.length;
      if (total === 0) return { total: 0, kills: 0, errors: 0, continues: 0, efficiency: 0, byPlayer: {} as Record<number, { kills: number; errors: number; total: number; eff: number }> };
      const kills = attacks.filter(a => a.attackResult === 'kill').length;
      const errors = attacks.filter(a => a.attackResult === 'error').length;
      const continues = attacks.filter(a => a.attackResult === 'continue').length;
      const efficiency = ((kills - errors) / total) * 100;

      const byPlayer: Record<number, { kills: number; errors: number; total: number; eff: number }> = {};
      attacks.forEach(a => {
        if (a.playerNumber == null) return;
        if (!byPlayer[a.playerNumber]) byPlayer[a.playerNumber] = { kills: 0, errors: 0, total: 0, eff: 0 };
        byPlayer[a.playerNumber].total++;
        if (a.attackResult === 'kill') byPlayer[a.playerNumber].kills++;
        if (a.attackResult === 'error') byPlayer[a.playerNumber].errors++;
      });
      Object.values(byPlayer).forEach(p => {
        p.eff = p.total > 0 ? ((p.kills - p.errors) / p.total) * 100 : 0;
      });

      return { total, kills, errors, continues, efficiency, byPlayer };
    };

    // Distribution stats (set calls by reception quality)
    const distributionStats = (teamId: string) => {
      // Group points by reception quality, then see which attacker got the ball
      const attacks = allActions.filter(a => a.type === 'attack' && a.teamId === teamId);
      const byPlayer: Record<number, number> = {};
      attacks.forEach(a => {
        if (a.playerNumber != null) {
          byPlayer[a.playerNumber] = (byPlayer[a.playerNumber] || 0) + 1;
        }
      });
      const total = attacks.length;
      const distribution: Record<number, number> = {};
      Object.entries(byPlayer).forEach(([num, count]) => {
        distribution[parseInt(num)] = total > 0 ? (count / total) * 100 : 0;
      });
      return { distribution, total };
    };

    return {
      teamA: {
        reception: receptionStats(match.teamA.id),
        attack: attackStats(match.teamA.id),
        distribution: distributionStats(match.teamA.id),
      },
      teamB: {
        reception: receptionStats(match.teamB.id),
        attack: attackStats(match.teamB.id),
        distribution: distributionStats(match.teamB.id),
      },
    };
  }, [match]);

  if (!match || !stats) return null;

  const StatCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );

  const QualityBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-muted-foreground font-mono">{label}</span>
      <div className="flex-1 bg-secondary rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }} />
      </div>
      <span className="font-mono w-8 text-right text-foreground">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen no-select">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black tracking-tighter text-foreground">
            pure<span className="text-primary">volley</span>
          </h1>
          <span className="text-xs text-muted-foreground">📊 Dashboard</span>
        </div>
        <button
          onClick={() => setView('live')}
          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-semibold hover:opacity-90 transition-opacity"
        >
          ← Retour au live
        </button>
      </div>

      {/* Score summary */}
      <div className="px-4 py-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4">
            <span className="text-xl font-bold text-foreground">{match.teamA.name}</span>
            <span className="font-mono text-3xl font-black text-primary">{match.setsWonA} - {match.setsWonB}</span>
            <span className="text-xl font-bold text-foreground">{match.teamB.name}</span>
          </div>
          <div className="flex justify-center gap-2 mt-2">
            {match.sets.map((s, i) => (
              <span key={i} className="font-mono text-sm text-muted-foreground">
                ({s.scoreA}-{s.scoreB})
              </span>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {[{ team: match.teamA, stats: stats.teamA }, { team: match.teamB, stats: stats.teamB }].map((side, si) => (
            <div key={si} className="space-y-4">
              <h2 className="text-sm font-bold text-primary">{side.team.name}</h2>

              {/* Reception */}
              <StatCard title="Réception">
                <div className="text-2xl font-mono font-black text-foreground mb-2">
                  {side.stats.reception.efficiency.toFixed(0)}%
                  <span className="text-xs text-muted-foreground font-normal ml-1">efficacité</span>
                </div>
                <div className="space-y-1">
                  <QualityBar label="R++" value={side.stats.reception.excellent} total={side.stats.reception.total} color="bg-quality-excellent" />
                  <QualityBar label="R+" value={side.stats.reception.good} total={side.stats.reception.total} color="bg-quality-good" />
                  <QualityBar label="R0" value={side.stats.reception.neutral} total={side.stats.reception.total} color="bg-quality-neutral" />
                  <QualityBar label="R-" value={side.stats.reception.bad} total={side.stats.reception.total} color="bg-quality-bad" />
                  <QualityBar label="R--" value={side.stats.reception.terrible} total={side.stats.reception.total} color="bg-quality-terrible" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">Total: {side.stats.reception.total}</p>
              </StatCard>

              {/* Attack */}
              <StatCard title="Attaque">
                <div className="text-2xl font-mono font-black text-foreground mb-2">
                  {side.stats.attack.efficiency.toFixed(0)}%
                  <span className="text-xs text-muted-foreground font-normal ml-1">efficacité</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-lg font-mono font-bold text-score-win">{side.stats.attack.kills}</span>
                    <p className="text-[10px] text-muted-foreground">Kills</p>
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold text-score-lose">{side.stats.attack.errors}</span>
                    <p className="text-[10px] text-muted-foreground">Erreurs</p>
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold text-foreground">{side.stats.attack.continues}</span>
                    <p className="text-[10px] text-muted-foreground">Continu</p>
                  </div>
                </div>

                {/* Per player */}
                {Object.keys(side.stats.attack.byPlayer).length > 0 && (
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="text-[10px] text-muted-foreground mb-1">Par joueur</p>
                    {Object.entries(side.stats.attack.byPlayer).map(([num, p]) => (
                      <div key={num} className="flex items-center justify-between text-xs font-mono py-0.5">
                        <span className="text-foreground">#{num}</span>
                        <span className="text-score-win">{p.kills}K</span>
                        <span className="text-score-lose">{p.errors}E</span>
                        <span className="text-muted-foreground">{p.total}T</span>
                        <span className={`font-bold ${p.eff >= 0 ? 'text-score-win' : 'text-score-lose'}`}>
                          {p.eff.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </StatCard>

              {/* Distribution */}
              <StatCard title="Distribution">
                {side.stats.distribution.total === 0 ? (
                  <p className="text-muted-foreground text-xs italic">Pas de données</p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(side.stats.distribution.distribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([num, pct]) => (
                        <div key={num} className="flex items-center gap-2 text-xs">
                          <span className="font-mono w-8 text-foreground">#{num}</span>
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div className="h-2 rounded-full bg-action-active" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono w-10 text-right text-foreground">{pct.toFixed(0)}%</span>
                        </div>
                      ))}
                  </div>
                )}
              </StatCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
