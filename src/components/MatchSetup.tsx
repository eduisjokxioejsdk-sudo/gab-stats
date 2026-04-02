import React, { useState } from 'react';
import { useMatchStore } from '@/store/matchStore';
import { useTeamsStore, type SavedTeam } from '@/store/teamsStore';
import type { Team } from '@/types/volleyball';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const MatchSetup: React.FC = () => {
  const { createMatch, startSet, match, setView } = useMatchStore();
  const { teams: savedTeams } = useTeamsStore();

  const [step, setStep] = useState<'match' | 'rotation'>('match');
  const [matchName, setMatchName] = useState('');
  const [selectedTeamAId, setSelectedTeamAId] = useState<string | null>(null);
  const [selectedTeamBId, setSelectedTeamBId] = useState<string | null>(null);

  // Optional fields
  const [location, setLocation] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [statistician, setStatistician] = useState('');

  const [rotationA, setRotationA] = useState<string[]>(Array(6).fill(''));
  const [rotationB, setRotationB] = useState<string[]>(Array(6).fill(''));
  const [servingTeam, setServingTeam] = useState<'A' | 'B'>('A');

  const selectedTeamA = savedTeams.find(t => t.id === selectedTeamAId);
  const selectedTeamB = savedTeams.find(t => t.id === selectedTeamBId);

  const buildTeamFromSaved = (saved: SavedTeam): Team => {
    const teamId = generateId();
    return {
      id: teamId,
      name: saved.name,
      players: saved.players.map(p => ({
        id: generateId(),
        number: p.number,
        name: p.name || `#${p.number}`,
        teamId,
        role: p.role,
      })),
      liberos: saved.liberos.map(p => ({
        id: generateId(),
        number: p.number,
        name: p.name || `L#${p.number}`,
        teamId,
        role: 'libero' as const,
      })),
      setterNumber: saved.setterNumber,
    };
  };

  const handleCreateMatch = () => {
    if (!matchName || !selectedTeamA || !selectedTeamB) return;

    const teamA = buildTeamFromSaved(selectedTeamA);
    const teamB = buildTeamFromSaved(selectedTeamB);

    createMatch(matchName, new Date().toISOString(), teamA, teamB, {
      location: location || undefined,
      time: matchTime || undefined,
      statistician: statistician || undefined,
    });

    const aNumbers = teamA.players.slice(0, 6).map(p => p.number.toString());
    const bNumbers = teamB.players.slice(0, 6).map(p => p.number.toString());
    setRotationA(aNumbers.concat(Array(Math.max(0, 6 - aNumbers.length)).fill('')));
    setRotationB(bNumbers.concat(Array(Math.max(0, 6 - bNumbers.length)).fill('')));
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            pure<span className="text-primary">volley</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Nouveau match</p>
          <button
            onClick={() => setView('home')}
            className="text-xs text-muted-foreground hover:text-foreground mt-2"
          >
            ← Retour à l'accueil
          </button>
        </div>

        {step === 'match' && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-slide-in">
            <h2 className="text-lg font-bold text-foreground">Configuration du match</h2>

            <div>
              <label className={labelClass}>Nom du match *</label>
              <input className={inputClass} placeholder="Ex: Finale Coupe de France" value={matchName} onChange={e => setMatchName(e.target.value)} />
            </div>

            {/* Team selection */}
            <div className="grid grid-cols-2 gap-4">
              {(['A', 'B'] as const).map(side => {
                const selectedId = side === 'A' ? selectedTeamAId : selectedTeamBId;
                const setSelected = side === 'A' ? setSelectedTeamAId : setSelectedTeamBId;
                const otherSelectedId = side === 'A' ? selectedTeamBId : selectedTeamAId;
                return (
                  <div key={side}>
                    <label className={labelClass}>Équipe {side} *</label>
                    {savedTeams.length === 0 ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>Aucune équipe créée.</p>
                        <button
                          onClick={() => setView('teams')}
                          className="text-primary hover:underline mt-1"
                        >
                          Créer une équipe →
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {savedTeams
                          .filter(t => t.id !== otherSelectedId)
                          .map(t => (
                            <button
                              key={t.id}
                              onClick={() => setSelected(t.id)}
                              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                                selectedId === t.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {t.name}
                              <span className="text-[10px] ml-1 opacity-60">({t.players.length}j)</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Optional info */}
            <div className="border-t border-border pt-4 mt-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Informations facultatives</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Lieu</label>
                  <input className={inputClass} placeholder="Ex: Palais des Sports" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Heure</label>
                  <input className={inputClass} type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Statisticien</label>
                  <input className={inputClass} placeholder="Votre nom" value={statistician} onChange={e => setStatistician(e.target.value)} />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateMatch}
              disabled={!matchName || !selectedTeamAId || !selectedTeamBId}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Définir les rotations →
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
