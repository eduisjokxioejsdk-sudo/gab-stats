import React, { useState } from 'react';
import { useMatchStore } from '@/store/matchStore';

interface SubstitutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubstitutionDialog: React.FC<SubstitutionDialogProps> = ({ isOpen, onClose }) => {
  const { match, performSubstitution, updateSetter, getCurrentSet } = useMatchStore();
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null);
  const [outNumber, setOutNumber] = useState('');
  const [inNumber, setInNumber] = useState('');
  const [needSetterSelect, setNeedSetterSelect] = useState(false);
  const [newSetterNumber, setNewSetterNumber] = useState('');

  if (!isOpen || !match) return null;
  const currentSet = getCurrentSet();
  if (!currentSet) return null;

  const handleConfirm = () => {
    if (!selectedTeam || !outNumber || !inNumber) return;
    const teamId = selectedTeam === 'A' ? match.teamA.id : match.teamB.id;
    const team = selectedTeam === 'A' ? match.teamA : match.teamB;
    const outNum = parseInt(outNumber);
    const inNum = parseInt(inNumber);

    // Check if setter is going out
    if (team.setterNumber === outNum) {
      if (!needSetterSelect) {
        setNeedSetterSelect(true);
        return;
      }
      // Apply sub then update setter
      performSubstitution(teamId, outNum, inNum);
      const newSetter = parseInt(newSetterNumber);
      if (!isNaN(newSetter)) {
        updateSetter(teamId, newSetter);
      }
    } else {
      performSubstitution(teamId, outNum, inNum);
    }

    // Reset and close
    setSelectedTeam(null);
    setOutNumber('');
    setInNumber('');
    setNeedSetterSelect(false);
    setNewSetterNumber('');
    onClose();
  };

  const rotation = selectedTeam === 'A' ? currentSet.currentRotationA : selectedTeam === 'B' ? currentSet.currentRotationB : [];

  const inputClass = "bg-secondary border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm w-full";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">🔄 Changement</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        {!selectedTeam ? (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setSelectedTeam('A')} className="bg-primary text-primary-foreground py-4 rounded-lg font-bold hover:opacity-90">
              {match.teamA.name}
            </button>
            <button onClick={() => setSelectedTeam('B')} className="bg-primary text-primary-foreground py-4 rounded-lg font-bold hover:opacity-90">
              {match.teamB.name}
            </button>
          </div>
        ) : needSetterSelect ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground">Le passeur sort. Qui est le nouveau passeur ?</p>
            <div className="flex flex-wrap gap-2">
              {rotation.filter(n => n !== parseInt(outNumber)).map(num => (
                <button
                  key={num}
                  onClick={() => setNewSetterNumber(num.toString())}
                  className={`font-mono text-sm px-3 py-2 rounded-md border ${
                    newSetterNumber === num.toString() ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border hover:border-primary/50'
                  }`}
                >
                  N°{num}
                </button>
              ))}
              {/* Also the incoming player */}
              <button
                onClick={() => setNewSetterNumber(inNumber)}
                className={`font-mono text-sm px-3 py-2 rounded-md border ${
                  newSetterNumber === inNumber ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border hover:border-primary/50'
                }`}
              >
                N°{inNumber} (entrant)
              </button>
            </div>
            <button onClick={handleConfirm} disabled={!newSetterNumber} className="w-full bg-accent text-accent-foreground font-bold py-2 rounded-md disabled:opacity-40">
              Confirmer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Rotation actuelle : {rotation.join(' - ')}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {rotation.map(num => (
                <button
                  key={num}
                  onClick={() => setOutNumber(num.toString())}
                  className={`font-mono text-sm py-2 rounded-md border ${
                    outNumber === num.toString() ? 'bg-destructive/20 border-destructive text-destructive' : 'bg-secondary border-border hover:border-primary/50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {outNumber && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Remplaçant pour N°{outNumber}
                </label>
                <input
                  className={inputClass}
                  placeholder="N° du remplaçant"
                  value={inNumber}
                  onChange={e => setInNumber(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!outNumber || !inNumber}
              className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Valider le changement
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubstitutionDialog;
