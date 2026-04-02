import React from 'react';
import type { InputPhase } from '@/types/volleyball';
import { useShortcutsStore } from '@/store/shortcutsStore';

interface InputGuideProps {
  phase: InputPhase;
  buffer: string;
  teamAName?: string;
  teamBName?: string;
}

const formatKey = (key: string): string => {
  if (key === ' ') return 'ESPACE';
  if (key === 'ArrowLeft') return '←';
  if (key === 'ArrowRight') return '→';
  return key.toUpperCase();
};

const InputGuide: React.FC<InputGuideProps> = ({ phase, buffer, teamAName = 'Équipe A', teamBName = 'Équipe B' }) => {
  const { shortcuts } = useShortcutsStore();

  const phaseConfig: Record<InputPhase, { label: string; hint: string; keys: string }> = {
    idle: {
      label: 'EN ATTENTE',
      hint: `Appuyez sur ${formatKey(shortcuts.startEndPoint)} pour démarrer un point`,
      keys: `[${formatKey(shortcuts.startEndPoint)}]`,
    },
    service_coord: {
      label: 'SERVICE — Trajectoire',
      hint: 'Cliquez 2 points sur le terrain : départ → arrivée',
      keys: '[CLIC × 2]',
    },
    service_type: {
      label: 'SERVICE — Type',
      hint: 'Type de service',
      keys: `[${formatKey(shortcuts.serviceSmash)}] Smashé  [${formatKey(shortcuts.serviceFloat)}] Flottant`,
    },
    service_quality: {
      label: 'SERVICE — Qualité',
      hint: 'Qualité du service (++ = ace, point direct)',
      keys: `[${formatKey(shortcuts.qualityExcellent)}] ++  [${formatKey(shortcuts.qualityGood)}] +  [${formatKey(shortcuts.qualityNeutral)}] 0  [${formatKey(shortcuts.qualityBad)}] -  [${formatKey(shortcuts.qualityTerrible)}] --`,
    },
    reception: {
      label: 'RÉCEPTION',
      hint: 'Numéro du joueur + qualité (facultatif si ace)',
      keys: `[N°] + [${formatKey(shortcuts.qualityExcellent)}] ++  [${formatKey(shortcuts.qualityGood)}] +  [${formatKey(shortcuts.qualityNeutral)}] 0  [${formatKey(shortcuts.qualityBad)}] -  [${formatKey(shortcuts.qualityTerrible)}] --`,
    },
    set_call: {
      label: 'APPEL DU CENTRAL',
      hint: 'Type de passe',
      keys: `[${formatKey(shortcuts.setAvant)}] Avant  [${formatKey(shortcuts.setArriere)}] Arrière  [${formatKey(shortcuts.setDecalee)}] Décalée  [${formatKey(shortcuts.setNone)}] Pas d'appel`,
    },
    attack_player: {
      label: 'ATTAQUE — Joueur',
      hint: "Numéro de l'attaquant",
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
      hint: "Résultat de l'attaque (++ = kill, point direct)",
      keys: `[${formatKey(shortcuts.qualityExcellent)}] Kill/++  [${formatKey(shortcuts.attackError)}] Erreur  [${formatKey(shortcuts.attackContinue)}] Continu`,
    },
    point_winner: {
      label: 'QUI A GAGNÉ LE POINT ?',
      hint: '',
      keys: `[${formatKey(shortcuts.winnerLeft)}] ${teamAName}  [${formatKey(shortcuts.winnerRight)}] ${teamBName}`,
    },
    recording: {
      label: 'POINT EN COURS',
      hint: `Appuyez sur ${formatKey(shortcuts.startEndPoint)} pour terminer le point`,
      keys: `[${formatKey(shortcuts.startEndPoint)}]`,
    },
  };

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
