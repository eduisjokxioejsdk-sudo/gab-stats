import React, { useState } from 'react';
import { useTeamsStore, type SavedTeam } from '@/store/teamsStore';
import { useMatchStore } from '@/store/matchStore';
import type { PlayerRole } from '@/types/volleyball';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const TeamManager: React.FC = () => {
  const { teams, addTeam, updateTeam, deleteTeam } = useTeamsStore();
  const { setView } = useMatchStore();
  const [editing, setEditing] = useState<SavedTeam | null>(null);
  const [isNew, setIsNew] = useState(false);

  const emptyTeam: SavedTeam = {
    id: '',
    name: '',
    players: Array.from({ length: 6 }, () => ({ number: 0, name: '' })),
    liberos: [{ number: 0, name: '' }, { number: 0, name: '' }],
    setterNumber: undefined,
  };

  const startNew = () => {
    setEditing({ ...emptyTeam, id: generateId() });
    setIsNew(true);
  };

  const fastStart = () => {
    // Generate 10 unique random jersey numbers (1-20)
    const allNums: number[] = [];
    while (allNums.length < 11) {
      const n = Math.floor(Math.random() * 20) + 1;
      if (!allNums.includes(n)) allNums.push(n);
    }
    const playerNums = allNums.slice(0, 10);
    const liberoNum = allNums[10];
    const setterNum = playerNums[Math.floor(Math.random() * playerNums.length)];

    const team: SavedTeam = {
      id: generateId(),
      name: `Équipe ${teams.length + 1}`,
      players: playerNums.map(n => ({ number: n, name: `Joueur ${n}` })),
      liberos: [{ number: liberoNum, name: `Libéro ${liberoNum}` }],
      setterNumber: setterNum,
    };
    setEditing(team);
    setIsNew(true);
  };

  const startEdit = (team: SavedTeam) => {
    setEditing({ ...team, players: [...team.players], liberos: [...team.liberos] });
    setIsNew(false);
  };

  const save = () => {
    if (!editing || !editing.name) return;
    const cleaned: SavedTeam = {
      ...editing,
      players: editing.players.filter(p => p.number > 0),
      liberos: editing.liberos.filter(p => p.number > 0),
    };
    if (isNew) addTeam(cleaned);
    else updateTeam(cleaned.id, cleaned);
    setEditing(null);
  };

  const inputClass = "bg-secondary border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm w-full";

  if (editing) {
    return (
      <div className="min-h-screen no-select p-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">{isNew ? 'Nouvelle équipe' : `Modifier ${editing.name}`}</h2>
            <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground hover:text-foreground">← Retour</button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Nom de l'équipe</label>
              <input className={inputClass} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </div>

            <div>
              <label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Joueurs</label>
              <div className="space-y-2 mt-1">
                {editing.players.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className={`${inputClass} !w-16 text-center`}
                      placeholder="#"
                      type="number"
                      value={p.number || ''}
                      onChange={e => {
                        const updated = [...editing.players];
                        updated[i] = { ...updated[i], number: parseInt(e.target.value) || 0 };
                        setEditing({ ...editing, players: updated });
                      }}
                    />
                    <input
                      className={inputClass}
                      placeholder={`Joueur ${i + 1}`}
                      value={p.name}
                      onChange={e => {
                        const updated = [...editing.players];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setEditing({ ...editing, players: updated });
                      }}
                    />
                    <select
                      className={`${inputClass} !w-28`}
                      value={p.role || ''}
                      onChange={e => {
                        const updated = [...editing.players];
                        const role = e.target.value as PlayerRole | '';
                        updated[i] = { ...updated[i], role: role || undefined };
                        // If setting as passeur, also set setterNumber
                        if (role === 'passeur') {
                          setEditing({ ...editing, players: updated, setterNumber: updated[i].number });
                        } else {
                          setEditing({ ...editing, players: updated });
                        }
                      }}
                    >
                      <option value="">Rôle...</option>
                      <option value="pointu">Pointu</option>
                      <option value="recepteur">Récepteur</option>
                      <option value="central">Central</option>
                      <option value="passeur">Passeur</option>
                    </select>
                  </div>
                ))}
                {editing.players.length < 14 && (
                  <button
                    onClick={() => setEditing({ ...editing, players: [...editing.players, { number: 0, name: '', role: undefined }] })}
                    className="text-xs text-primary hover:underline"
                  >
                    + Ajouter un joueur
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-accent text-xs uppercase tracking-wider font-semibold">Libéros (max 2)</label>
              <div className="space-y-2 mt-1">
                {editing.liberos.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className={`${inputClass} !w-16 text-center border-accent/30`}
                      placeholder="#"
                      type="number"
                      value={p.number || ''}
                      onChange={e => {
                        const updated = [...editing.liberos];
                        updated[i] = { ...updated[i], number: parseInt(e.target.value) || 0 };
                        setEditing({ ...editing, liberos: updated });
                      }}
                    />
                    <input
                      className={`${inputClass} border-accent/30`}
                      placeholder={`Libéro ${i + 1}`}
                      value={p.name}
                      onChange={e => {
                        const updated = [...editing.liberos];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setEditing({ ...editing, liberos: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={save} disabled={!editing.name} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity">
              💾 Sauvegarder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen no-select p-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black tracking-tighter text-foreground">
              pure<span className="text-primary">volley</span>
            </h1>
            <span className="text-xs text-muted-foreground">👥 Équipes</span>
          </div>
          <button onClick={() => setView('home')} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-semibold hover:opacity-90 transition-opacity">
            ← Retour
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <button onClick={startNew} className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
            + Nouvelle équipe
          </button>
          <button onClick={fastStart} className="flex-1 bg-accent text-accent-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
            ⚡ Fast Start
          </button>
        </div>

        {teams.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">Aucune équipe sauvegardée</p>
        )}

        <div className="space-y-3">
          {teams.map(team => (
            <div key={team.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-foreground">{team.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(team)} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80">✏️ Modifier</button>
                  <button onClick={() => deleteTeam(team.id)} className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded hover:bg-destructive/20">🗑️</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {team.players.map((p, i) => (
                  <span key={i} className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    team.setterNumber === p.number ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {p.number}{team.setterNumber === p.number ? '★' : ''}
                  </span>
                ))}
                {team.liberos.map((p, i) => (
                  <span key={`l-${i}`} className="text-xs font-mono bg-accent/20 text-accent px-1.5 py-0.5 rounded">L{p.number}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamManager;
