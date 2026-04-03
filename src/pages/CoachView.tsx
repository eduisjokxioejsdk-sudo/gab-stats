import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTrackingStore } from '@/store/trackingStore';
import type { Match, Action, Point } from '@/types/volleyball';
import ServiceTab from '@/components/stats/ServiceTab';
import ReceptionTab from '@/components/stats/ReceptionTab';
import AttackTab from '@/components/stats/AttackTab';
import DistributionTab from '@/components/stats/DistributionTab';

type StatsTab = 'scoreboard' | 'service' | 'reception' | 'attack' | 'distribution';

const CoachView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase() || '';
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatsTab>('scoreboard');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  // Use tracking config from the synced match data (statistician's config), fallback to local
  const config = match?.trackingConfig ?? useTrackingStore.getState().config;

  // Initial fetch
  useEffect(() => {
    if (!code) {
      setError('Aucun code de partage fourni.');
      return;
    }

    const fetchMatch = async () => {
      const { data, error: err } = await supabase
        .from('live_matches')
        .select('match_data')
        .eq('share_code', code)
        .eq('is_active', true)
        .single();

      if (err || !data?.match_data) {
        setError('Match introuvable. Vérifiez le code.');
        return;
      }
      setMatch(data.match_data as unknown as Match);
    };

    fetchMatch();
  }, [code]);

  // Realtime subscription
  useEffect(() => {
    if (!code) return;

    const channel = supabase
      .channel(`coach-${code}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_matches',
          filter: `share_code=eq.${code}`,
        },
        (payload) => {
          const newData = payload.new as { match_data: unknown };
          if (newData?.match_data) {
            setMatch(newData.match_data as Match);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  const { allPoints, allActions } = useMemo(() => {
    if (!match) return { allPoints: [] as Point[], allActions: [] as Action[] };
    const pts = match.sets.flatMap(s => s.points);
    return { allPoints: pts, allActions: pts.flatMap(p => p.actions) };
  }, [match]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <p className="text-4xl">📡</p>
          <p className="text-lg font-bold">{error}</p>
          <p className="text-sm text-muted-foreground">Assurez-vous que le match est en cours.</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-3">
          <div className="animate-pulse text-4xl">📡</div>
          <p className="text-sm text-muted-foreground">Connexion au match en cours…</p>
        </div>
      </div>
    );
  }

  const currentSet = match.sets[match.sets.length - 1];
  const selectedTeam = selectedTeamId === match.teamA.id ? match.teamA
    : selectedTeamId === match.teamB.id ? match.teamB : null;

  const showService = config.serviceZone || config.serviceType;
  const showReception = config.receiverNumber || config.receptionQuality;
  const showAttack = config.attackTrajectory || config.attackQuality || config.blockersCount;
  const showDistribution = config.passDistribution;

  const tabs: { id: StatsTab; label: string }[] = [
    { id: 'scoreboard', label: '📊 Score' },
    ...(showService ? [{ id: 'service' as StatsTab, label: '🏐 Service' }] : []),
    ...(showReception ? [{ id: 'reception' as StatsTab, label: '🤲 Réception' }] : []),
    ...(showAttack ? [{ id: 'attack' as StatsTab, label: '💥 Attaque' }] : []),
    ...(showDistribution ? [{ id: 'distribution' as StatsTab, label: '📊 Distribution' }] : []),
  ];

  const validTab = tabs.find(t => t.id === activeTab) ? activeTab : 'scoreboard';

  return (
    <div className="min-h-screen no-select flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black tracking-tighter">
            gab<span className="text-primary">stats</span>
          </h1>
          <span className="text-xs text-muted-foreground">📡 Vue Coach — EN DIRECT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center flex-1">
              <p className="text-lg font-bold">{match.teamA.name}</p>
              <p className="text-4xl font-mono font-black text-primary">{currentSet?.scoreA ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Set {match.sets.length}</p>
              <p className="text-2xl font-mono font-black">{match.setsWonA} - {match.setsWonB}</p>
              <p className="text-[10px] text-muted-foreground mt-1">SETS</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-lg font-bold">{match.teamB.name}</p>
              <p className="text-4xl font-mono font-black text-primary">{currentSet?.scoreB ?? 0}</p>
            </div>
          </div>
          {/* Set scores */}
          {match.sets.length > 1 && (
            <div className="flex justify-center gap-3 mt-3 pt-3 border-t border-border">
              {match.sets.map((s, i) => (
                <div key={s.id} className="text-center">
                  <p className="text-[10px] text-muted-foreground">Set {i + 1}</p>
                  <p className="text-xs font-mono font-bold">{s.scoreA}-{s.scoreB}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team selector + tabs */}
      {!selectedTeam ? (
        <div className="px-4 py-3">
          <div className="flex border-b border-border mb-3">
            {tabs.filter(t => t.id === 'scoreboard').map(tab => (
              <button key={tab.id} className="px-4 py-2 text-xs font-semibold border-b-2 border-primary text-primary -mb-px">
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mb-4">Sélectionnez une équipe pour voir les stats détaillées</p>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {[match.teamA, match.teamB].map(t => (
              <button key={t.id} onClick={() => { setSelectedTeamId(t.id); setActiveTab('service'); }} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:bg-primary/5 transition-all text-center">
                <p className="text-base font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Voir les stats</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 pb-2 flex items-center gap-3 shrink-0">
            <button onClick={() => { setSelectedTeamId(null); setActiveTab('scoreboard'); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Score</button>
            <span className="text-sm font-bold text-primary">{selectedTeam.name}</span>
            <button
              onClick={() => setSelectedTeamId(selectedTeamId === match.teamA.id ? match.teamB.id : match.teamA.id)}
              className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-mono hover:bg-secondary/80 transition-colors"
            >
              ↔ {selectedTeamId === match.teamA.id ? match.teamB.name : match.teamA.name}
            </button>
          </div>

          <div className="px-4 shrink-0">
            <div className="flex border-b border-border">
              {tabs.filter(t => t.id !== 'scoreboard').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                    validTab === tab.id ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {validTab === 'service' && <ServiceTab actions={allActions} allPoints={allPoints} teamId={selectedTeamId!} team={selectedTeam} />}
            {validTab === 'reception' && <ReceptionTab actions={allActions} allPoints={allPoints} teamId={selectedTeamId!} team={selectedTeam} />}
            {validTab === 'attack' && <AttackTab actions={allActions} allPoints={allPoints} teamId={selectedTeamId!} team={selectedTeam} />}
            {validTab === 'distribution' && <DistributionTab actions={allActions} allPoints={allPoints} teamId={selectedTeamId!} team={selectedTeam} match={match} />}
          </div>
        </>
      )}
    </div>
  );
};

export default CoachView;
