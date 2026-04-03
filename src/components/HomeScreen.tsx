import React, { useState } from 'react';
import { useMatchStore } from '@/store/matchStore';
import { loadDemoMatch } from '@/utils/demoMatch';
import type { Match } from '@/types/volleyball';

const HomeScreen: React.FC = () => {
  const { setView, match, matchHistory, loadMatch } = useMatchStore();
  const [tab, setTab] = useState<'home' | 'matches'>('home');
  const [showBench, setShowBench] = useState(false);
  const [benchCode, setBenchCode] = useState('');

  const isMatchInProgress = match && !match.winnerTeamId && match.currentSetIndex >= 0;

  const sortedHistory = [...matchHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getMatchStatus = (m: Match) => {
    if (m.winnerTeamId) return 'Terminé';
    if (m.currentSetIndex >= 0) return 'En cours';
    return 'Non commencé';
  };

  const getMatchScore = (m: Match) => {
    return `${m.setsWonA} - ${m.setsWonB}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 no-select">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black tracking-tighter text-foreground">
            gab<span className="text-primary">stats</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">Statistiques en temps réel</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1">
          <button
            onClick={() => setTab('home')}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
              tab === 'home' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🏠 Accueil
          </button>
          <button
            onClick={() => setTab('matches')}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
              tab === 'matches' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📋 Matchs ({matchHistory.length})
          </button>
        </div>

        {tab === 'home' && (
          <div className="space-y-3 animate-slide-in">
            {isMatchInProgress && (
              <button
                onClick={() => setView('live')}
                className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-lg text-lg hover:opacity-90 transition-opacity"
              >
                ▶ Reprendre le match
              </button>
            )}

            <button
              onClick={() => setView('setup')}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-lg text-lg hover:opacity-90 transition-opacity"
            >
              🏐 Nouveau match
            </button>

            <button
              onClick={() => setView('teams')}
              className="w-full bg-card border border-border text-foreground font-bold py-4 rounded-lg hover:border-primary/50 transition-colors"
            >
              👥 Gérer les équipes
            </button>

            <button
              onClick={() => setShowBench(true)}
              className="w-full bg-card border border-border text-foreground font-bold py-4 rounded-lg hover:border-primary/50 transition-colors"
            >
              📺 Mode Banc
            </button>

            <div className="flex gap-3">
              <button
                onClick={loadDemoMatch}
                className="flex-1 bg-secondary text-secondary-foreground font-bold py-3 rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                🎮 Mode démo
              </button>
              <button
                onClick={() => setView('settings')}
                className="flex-1 bg-secondary text-secondary-foreground font-bold py-3 rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                ⚙️ Paramètres
              </button>
            </div>
          </div>
        )}

        {tab === 'matches' && (
          <div className="space-y-2 animate-slide-in">
            {sortedHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-1">Aucun match enregistré</p>
                <p className="text-xs font-mono">Les matchs joués apparaîtront ici</p>
              </div>
            ) : (
              sortedHistory.map(m => {
                const status = getMatchStatus(m);
                const isInProgress = !m.winnerTeamId && m.currentSetIndex >= 0;
                return (
                  <div
                    key={m.id}
                    className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => {
                      if (isInProgress) {
                        loadMatch(m);
                      } else {
                        loadMatch(m);
                        setView('dashboard');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground text-sm">{m.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isInProgress ? 'bg-accent/20 text-accent' : m.winnerTeamId ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground font-mono">
                        {m.teamA.name} vs {m.teamB.name}
                      </div>
                      <div className="text-sm font-bold text-foreground font-mono">
                        {getMatchScore(m)}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground font-mono">
                      {m.date && <span>{new Date(m.date).toLocaleDateString('fr-FR')}</span>}
                      {m.location && <span>📍 {m.location}</span>}
                      {m.time && <span>🕐 {m.time}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bench mode modal */}
      {showBench && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 animate-slide-in">
            <h2 className="text-lg font-bold text-foreground text-center mb-4">📺 Mode Banc</h2>
            <p className="text-muted-foreground text-xs text-center mb-4 font-mono">
              Entrez le code affiché sur le PC du statisticien
            </p>
            <input
              type="text"
              maxLength={6}
              value={benchCode}
              onChange={(e) => setBenchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="ABC123"
              className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] bg-secondary border border-border rounded-lg py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowBench(false); setBenchCode(''); }}
                className="flex-1 bg-secondary text-secondary-foreground font-bold py-3 rounded-lg text-sm hover:bg-secondary/80 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (benchCode.length === 6) {
                    window.location.href = `/coach?code=${benchCode}`;
                  }
                }}
                disabled={benchCode.length !== 6}
                className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Rejoindre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
