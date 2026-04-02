import React, { useMemo, useState } from 'react';
import { useMatchStore } from '@/store/matchStore';
import type { Action, Point } from '@/types/volleyball';
import ServiceTab from './stats/ServiceTab';
import ReceptionTab from './stats/ReceptionTab';
import AttackTab from './stats/AttackTab';
import CentrauxTab from './stats/CentrauxTab';

type StatsTab = 'service' | 'reception' | 'attack' | 'centraux' | 'distribution';

const Dashboard: React.FC = () => {
  const { match, setView } = useMatchStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatsTab>('service');

  const { allPoints, allActions } = useMemo(() => {
    if (!match) return { allPoints: [] as Point[], allActions: [] as Action[] };
    const pts = match.sets.flatMap(s => s.points);
    return { allPoints: pts, allActions: pts.flatMap(p => p.actions) };
  }, [match]);

  if (!match) return null;

  const selectedTeam = selectedTeamId === match.teamA.id ? match.teamA
    : selectedTeamId === match.teamB.id ? match.teamB : null;

  const tabs: { id: StatsTab; label: string; enabled: boolean }[] = [
    { id: 'service', label: '🏐 Service', enabled: true },
    { id: 'reception', label: '🤲 Réception', enabled: true },
    { id: 'attack', label: '💥 Attaque', enabled: true },
    { id: 'centraux', label: '🔶 Centraux', enabled: true },
    { id: 'distribution', label: '📊 Distribution', enabled: false },
  ];

  return (
    <div className="min-h-screen no-select flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black tracking-tighter text-foreground">
            pure<span className="text-primary">volley</span>
          </h1>
          <span className="text-xs text-muted-foreground">📊 Statistiques</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('live')} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-semibold hover:opacity-90 transition-opacity">
            ← Retour au live
          </button>
          <button onClick={() => setView('home')} className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md font-semibold hover:bg-secondary/80 transition-colors">
            🏠 Accueil
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <span className="text-lg font-bold text-foreground">{match.teamA.name}</span>
            <span className="font-mono text-2xl font-black text-primary">
              {match.sets.length > 0 ? match.sets[match.sets.length - 1].scoreA : 0} - {match.sets.length > 0 ? match.sets[match.sets.length - 1].scoreB : 0}
            </span>
            <span className="text-lg font-bold text-foreground">{match.teamB.name}</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">Sets : {match.setsWonA} - {match.setsWonB}</p>
        </div>
      </div>

      {!selectedTeam ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="grid grid-cols-2 gap-4 max-w-md w-full">
            {[match.teamA, match.teamB].map(t => (
              <button key={t.id} onClick={() => setSelectedTeamId(t.id)} className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all text-center">
                <p className="text-xl font-bold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Voir les statistiques</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 pb-2 flex items-center gap-3 shrink-0">
            <button onClick={() => setSelectedTeamId(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Équipes</button>
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
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => tab.enabled && setActiveTab(tab.id)}
                  disabled={!tab.enabled}
                  className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id ? 'border-primary text-primary'
                      : tab.enabled ? 'border-transparent text-muted-foreground hover:text-foreground'
                      : 'border-transparent text-muted-foreground/40 cursor-not-allowed'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {activeTab === 'service' && <ServiceTab actions={allActions} allPoints={allPoints} teamId={selectedTeamId!} team={selectedTeam} />}
            {activeTab === 'reception' && <ReceptionTab actions={allActions} allPoints={allPoints} teamId={selectedTeamId!} team={selectedTeam} />}
            {activeTab === 'attack' && <AttackTab actions={allActions} allPoints={allPoints} teamId={selectedTeamId!} team={selectedTeam} />}
            {activeTab === 'centraux' && <CentrauxTab actions={allActions} allPoints={allPoints} teamId={selectedTeamId!} team={selectedTeam} match={match} />}
            {activeTab === 'distribution' && <div className="text-center text-muted-foreground text-sm py-12">À venir...</div>}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
