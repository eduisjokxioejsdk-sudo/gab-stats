import React, { useState, useCallback } from 'react';
import { useShortcutsStore, defaultShortcuts, type ShortcutMap } from '@/store/shortcutsStore';
import { useMatchStore } from '@/store/matchStore';

const shortcutLabels: Record<keyof ShortcutMap, { label: string; group: string }> = {
  serviceSmash: { label: 'Service smashé', group: 'Service' },
  serviceFloat: { label: 'Service flottant', group: 'Service' },
  qualityExcellent: { label: '# Parfaite (3 pass)', group: 'Réception' },
  qualityGood: { label: '+ Bonne (2 pass)', group: 'Réception' },
  qualityNeutral: { label: '- Mauvaise (1 pass)', group: 'Réception' },
  qualityBad: { label: '! Freeball', group: 'Réception' },
  qualityOverpass: { label: '/ Over pass', group: 'Réception' },
  qualityTerrible: { label: '= Erreur (0 pass)', group: 'Réception' },
  setAvant: { label: 'Fixe avant', group: 'Passe' },
  setArriere: { label: 'Arrière', group: 'Passe' },
  setDecalee: { label: 'Décalée', group: 'Passe' },
  setNone: { label: 'Pas d\'appel', group: 'Passe' },
  attackSecondeMain: { label: 'Seconde main', group: 'Attaque' },
  attackPos4: { label: 'Poste 4', group: 'Attaque' },
  attackPos3: { label: 'Centre (3)', group: 'Attaque' },
  attackPos2or1: { label: 'Poste 2 / 1 (opposé)', group: 'Attaque' },
  attackPos6: { label: 'Pipe (6)', group: 'Attaque' },
  blockers0: { label: '0 bloqueur', group: 'Bloqueurs' },
  blockers1: { label: '1 bloqueur', group: 'Bloqueurs' },
  blockers2: { label: '2 bloqueurs', group: 'Bloqueurs' },
  blockers3: { label: '3 bloqueurs', group: 'Bloqueurs' },
  startEndPoint: { label: 'Fin de point', group: 'Point' },
  winnerLeft: { label: 'Gagnant Équipe A', group: 'Point' },
  winnerRight: { label: 'Gagnant Équipe B', group: 'Point' },
  faultA: { label: 'Faute Équipe A', group: 'Point' },
  faultB: { label: 'Faute Équipe B', group: 'Point' },
};

const displayKey = (key: string | undefined | null) => {
  if (!key) return '?';
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
