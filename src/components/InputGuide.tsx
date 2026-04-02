import React from 'react';
import type { InputPhase } from '@/types/volleyball';

interface InputGuideProps {
  phase: InputPhase;
  buffer: string;
}

const phaseConfig: Record<InputPhase, { label: string; hint: string; keys: string }> = {
  idle: {
    label: 'EN ATTENTE',
    hint: 'Appuyez sur Espace pour démarrer un point',
    keys: '[ESPACE]',
  },
  service_coord: {
    label: 'SERVICE — Trajectoire',
    hint: 'Cliquez 2 points sur le terrain : départ → arrivée',
    keys: '[CLIC × 2]',
  },
  service_type: {
    label: 'SERVICE — Type',
    hint: 'Type de service',
    keys: '[S] Smashé  [F] Flottant',
  },
  reception: {
    label: 'RÉCEPTION',
    hint: 'Numéro du joueur + qualité',
    keys: '[N°] + [+] R++  [=] R+  [0] R0  [-] R-  [_] R--',
  },
  set_call: {
    label: 'APPEL DU CENTRAL',
    hint: 'Type de passe',
    keys: '[A] Fixe Avant  [Z] Arrière  [E] Décalée  [0] Pas d\'appel',
  },
  attack_player: {
    label: 'ATTAQUE — Joueur',
    hint: 'Numéro de l\'attaquant',
    keys: '[N° joueur]',
  },
  attack_blockers: {
    label: 'ATTAQUE — Bloqueurs',
    hint: 'Nombre de bloqueurs adverses',
    keys: '[0] [1] [2] [3]',
  },
  attack_coord: {
    label: 'ATTAQUE — Trajectoire',
    hint: 'Cliquez 2 points sur le terrain',
    keys: '[CLIC × 2]',
  },
  attack_result: {
    label: 'ATTAQUE — Résultat',
    hint: 'Résultat de l\'attaque',
    keys: '[K] Kill  [E] Erreur  [C] Continu',
  },
  point_winner: {
    label: 'QUI A GAGNÉ LE POINT ?',
    hint: '',
    keys: '[←] Équipe A  [→] Équipe B',
  },
  recording: {
    label: 'POINT EN COURS',
    hint: 'Appuyez sur Espace pour terminer le point',
    keys: '[ESPACE]',
  },
};

const InputGuide: React.FC<InputGuideProps> = ({ phase, buffer }) => {
  const config = phaseConfig[phase];
  const isActive = phase !== 'idle';

  return (
    <div className={`rounded-lg border p-3 transition-all ${
      isActive
        ? 'bg-card border-primary/30 glow-primary'
        : 'bg-card border-border'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold uppercase tracking-wider ${
          isActive ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {config.label}
        </span>
        {buffer && (
          <span className="font-mono text-accent text-sm font-bold bg-secondary px-2 py-0.5 rounded">
            {buffer}
          </span>
        )}
      </div>
      {config.hint && (
        <p className="text-muted-foreground text-xs mb-1">{config.hint}</p>
      )}
      <p className="font-mono text-xs text-foreground/70">{config.keys}</p>
    </div>
  );
};

export default InputGuide;
