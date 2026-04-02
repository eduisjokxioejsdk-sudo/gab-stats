import React from 'react';
import { useMatchStore } from '@/store/matchStore';
import { loadDemoMatch } from '@/utils/demoMatch';

const HomeScreen: React.FC = () => {
  const { setView, match } = useMatchStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 no-select">
      <div className="w-full max-w-lg">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tighter text-foreground">
            pure<span className="text-primary">volley</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-mono">Statistiques en temps réel</p>
        </div>

        <div className="space-y-3">
          {match && (
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
      </div>
    </div>
  );
};

export default HomeScreen;
