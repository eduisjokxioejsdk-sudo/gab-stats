import React, { useState } from 'react';
import { useMatchStore } from '@/store/matchStore';
import { loadDemoMatch } from '@/utils/demoMatch';
import type { Team, Player } from '@/types/volleyball';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const MatchSetup: React.FC = () => {
  const { createMatch, startSet, match, setView } = useMatchStore();

  const [step, setStep] = useState<'match' | 'players' | 'rotation'>('match');
  const [matchName, setMatchName] = useState('');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState<{ number: string; name: string }[]>(
    Array.from({ length: 6 }, () => ({ number: '', name: '' }))
  );
  const [teamBPlayers, setTeamBPlayers] = useState<{ number: string; name: string }[]>(
    Array.from({ length: 6 }, () => ({ number: '', name: '' }))
  );
  const [rotationA, setRotationA] = useState<string[]>(Array(6).fill(''));
  const [rotationB, setRotationB] = useState<string[]>(Array(6).fill(''));
  const [servingTeam, setServingTeam] = useState<'A' | 'B'>('A');

  const handleCreateMatch = () => {
    if (!matchName || !teamAName || !teamBName) return;
    setStep('players');
  };

  const handlePlayersSubmit = () => {
    const teamAId = generateId();
    const teamBId = generateId();

    const teamA: Team = {
      id: teamAId,
      name: teamAName,
      players: teamAPlayers
        .filter(p => p.number)
        .map(p => ({
          id: generateId(),
          number: parseInt(p.number),
          name: p.name || `#${p.number}`,
          teamId: teamAId,
        })),
    };

    const teamB: Team = {
      id: teamBId,
      name: teamBName,
      players: teamBPlayers
        .filter(p => p.number)
        .map(p => ({
          id: generateId(),
          number: parseInt(p.number),
          name: p.name || `#${p.number}`,
          teamId: teamBId,
        })),
    };

    createMatch(matchName, new Date().toISOString(), teamA, teamB);

    // Auto-fill rotations with player numbers
    const aNumbers = teamA.players.map(p => p.number.toString());
    const bNumbers = teamB.players.map(p => p.number.toString());
    setRotationA(aNumbers.concat(Array(6 - aNumbers.length).fill('')));
    setRotationB(bNumbers.concat(Array(6 - bNumbers.length).fill('')));
    setStep('rotation');
  };

  const handleStartSet = () => {
    const rotA = rotationA.map(n => parseInt(n)).filter(n => !isNaN(n));
    const rotB = rotationB.map(n => parseInt(n)).filter(n => !isNaN(n));
    if (rotA.length !== 6 || rotB.length !== 6) return;

    const servTeamId = servingTeam === 'A' ? match!.teamA.id : match!.teamB.id;
    startSet(rotA, rotB, servTeamId);
  };

  const inputClass = "bg-secondary border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm w-full";
  const labelClass = "text-muted-foreground text-xs uppercase tracking-wider font-semibold";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 no-select">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            pure<span className="text-primary">volley</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Statistiques en temps réel</p>
        </div>

        {step === 'match' && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-slide-in">
            <h2 className="text-lg font-bold text-foreground">Nouveau match</h2>

            <div>
              <label className={labelClass}>Nom du match</label>
              <input
                className={inputClass}
                placeholder="Ex: Finale Coupe de France"
                value={matchName}
                onChange={e => setMatchName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Équipe A</label>
                <input
                  className={inputClass}
                  placeholder="Nom"
                  value={teamAName}
                  onChange={e => setTeamAName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Équipe B</label>
                <input
                  className={inputClass}
                  placeholder="Nom"
                  value={teamBName}
                  onChange={e => setTeamBName(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleCreateMatch}
              disabled={!matchName || !teamAName || !teamBName}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Continuer →
            </button>
          </div>
        )}

        {step === 'players' && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-slide-in">
            <h2 className="text-lg font-bold text-foreground">Joueurs</h2>

            <div className="grid grid-cols-2 gap-6">
              {[{ name: teamAName, players: teamAPlayers, setPlayers: setTeamAPlayers },
                { name: teamBName, players: teamBPlayers, setPlayers: setTeamBPlayers }].map((team, ti) => (
                <div key={ti}>
                  <h3 className="text-sm font-bold text-primary mb-3">{team.name}</h3>
                  <div className="space-y-2">
                    {team.players.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className={`${inputClass} !w-16 text-center`}
                          placeholder="#"
                          value={p.number}
                          onChange={e => {
                            const updated = [...team.players];
                            updated[i] = { ...updated[i], number: e.target.value };
                            team.setPlayers(updated);
                          }}
                        />
                        <input
                          className={inputClass}
                          placeholder={`Joueur ${i + 1}`}
                          value={p.name}
                          onChange={e => {
                            const updated = [...team.players];
                            updated[i] = { ...updated[i], name: e.target.value };
                            team.setPlayers(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handlePlayersSubmit}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:opacity-90 transition-opacity"
            >
              Définir rotations →
            </button>
          </div>
        )}

        {step === 'rotation' && match && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-slide-in">
            <h2 className="text-lg font-bold text-foreground">Rotations de départ — Set 1</h2>

            <div className="grid grid-cols-2 gap-6">
              {[{ name: match.teamA.name, rotation: rotationA, setRotation: setRotationA, players: match.teamA.players },
                { name: match.teamB.name, rotation: rotationB, setRotation: setRotationB, players: match.teamB.players }].map((team, ti) => (
                <div key={ti}>
                  <h3 className="text-sm font-bold text-primary mb-3">{team.name}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['P4', 'P3', 'P2', 'P5', 'P6', 'P1'].map((label, i) => {
                      // Map visual positions to array indices
                      // Visual layout: P4(idx3) P3(idx2) P2(idx1) / P5(idx4) P6(idx5) P1(idx0)
                      const posMap = [3, 2, 1, 4, 5, 0];
                      const posIdx = posMap[i];
                      return (
                        <div key={i} className="text-center">
                          <label className={`${labelClass} text-[10px]`}>{label}</label>
                          <input
                            className={`${inputClass} text-center ${posIdx === 0 ? 'ring-2 ring-accent' : ''}`}
                            value={team.rotation[posIdx]}
                            onChange={e => {
                              const updated = [...team.rotation];
                              updated[posIdx] = e.target.value;
                              team.setRotation(updated);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>Service initial</label>
              <div className="flex gap-2 mt-1">
                {(['A', 'B'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setServingTeam(t)}
                    className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${
                      servingTeam === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {t === 'A' ? match.teamA.name : match.teamB.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartSet}
              className="w-full bg-accent text-accent-foreground font-bold py-3 rounded-md hover:opacity-90 transition-opacity glow-accent"
            >
              🏐 Démarrer le set
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSetup;
