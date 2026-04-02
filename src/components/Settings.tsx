import React, { useState, useCallback } from 'react';
import { useShortcutsStore, defaultShortcuts, type ShortcutMap } from '@/store/shortcutsStore';
import { useMatchStore } from '@/store/matchStore';

const shortcutLabels: Record<keyof ShortcutMap, { label: string; group: string }> = {
  serviceSmash: { label: 'Service smashé', group: 'Service' },
  serviceFloat: { label: 'Service flottant', group: 'Service' },
  qualityExcellent: { label: 'R++ (Excellent)', group: 'Réception' },
  qualityGood: { label: 'R+ (Bon)', group: 'Réception' },
  qualityNeutral: { label: 'R0 (Neutre)', group: 'Réception' },
  qualityBad: { label: 'R- (Mauvais)', group: 'Réception' },
  qualityTerrible: { label: 'R-- (Terrible)', group: 'Réception' },
  setAvant: { label: 'Fixe avant', group: 'Passe' },
  setArriere: { label: 'Arrière', group: 'Passe' },
  setDecalee: { label: 'Décalée', group: 'Passe' },
  setNone: { label: 'Pas d\'appel', group: 'Passe' },
  attackKill: { label: 'Kill / Point', group: 'Attaque' },
  attackError: { label: 'Erreur', group: 'Attaque' },
  attackContinue: { label: 'Continu / Défendu', group: 'Attaque' },
  attackSecondeMain: { label: 'Seconde main', group: 'Attaque' },
  startEndPoint: { label: 'Fin de point', group: 'Point' },
  winnerLeft: { label: 'Gagnant Équipe A', group: 'Point' },
  winnerRight: { label: 'Gagnant Équipe B', group: 'Point' },
};

const displayKey = (key: string) => {
  if (key === ' ') return 'ESPACE';
  if (key === 'ArrowLeft') return '← Flèche gauche';
  if (key === 'ArrowRight') return '→ Flèche droite';
  if (key === 'ArrowUp') return '↑ Flèche haut';
  if (key === 'ArrowDown') return '↓ Flèche bas';
  return key.toUpperCase();
};

const Settings: React.FC = () => {
  const { shortcuts, updateShortcut, resetShortcuts } = useShortcutsStore();
  const { setView, match } = useMatchStore();
  const [editingKey, setEditingKey] = useState<keyof ShortcutMap | null>(null);

  const handleKeyCapture = useCallback((e: React.KeyboardEvent) => {
    if (!editingKey) return;
    e.preventDefault();
    e.stopPropagation();
    const key = e.key;
    updateShortcut(editingKey, key);
    setEditingKey(null);
  }, [editingKey, updateShortcut]);

  const groups: Record<string, (keyof ShortcutMap)[]> = {};
  (Object.keys(shortcutLabels) as (keyof ShortcutMap)[]).forEach((k) => {
    const g = shortcutLabels[k].group;
    if (!groups[g]) groups[g] = [];
    groups[g].push(k);
  });

  return (
    <div className="min-h-screen no-select">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black tracking-tighter text-foreground">
            pure<span className="text-primary">volley</span>
          </h1>
          <span className="text-xs text-muted-foreground">⚙️ Paramètres</span>
        </div>
        <button
          onClick={() => setView(match ? 'live' : 'home')}
          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-semibold hover:opacity-90 transition-opacity"
        >
          ← Retour
        </button>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6" onKeyDown={handleKeyCapture} tabIndex={0}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Raccourcis clavier</h2>
          <button
            onClick={resetShortcuts}
            className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md font-semibold hover:bg-secondary/80 transition-colors"
          >
            Réinitialiser
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Cliquez sur une touche pour la modifier, puis appuyez sur la nouvelle touche souhaitée.
        </p>

        {Object.entries(groups).map(([groupName, keys]) => (
          <div key={groupName} className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">{groupName}</h3>
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{shortcutLabels[k].label}</span>
                  <button
                    onClick={() => setEditingKey(k)}
                    className={`font-mono text-sm px-3 py-1 rounded-md border transition-all min-w-[100px] text-center ${
                      editingKey === k
                        ? 'bg-primary/20 border-primary text-primary animate-pulse-glow'
                        : 'bg-secondary border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {editingKey === k ? '...' : displayKey(shortcuts[k])}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
