import React from 'react';
import type { InputPhase } from '@/types/volleyball';
import { useShortcutsStore } from '@/store/shortcutsStore';

interface InputGuideProps {
  phase: InputPhase;
  buffer: string;
  teamAName?: string;
  teamBName?: string;
  setterFront?: boolean;
  rallyTeamName?: string;
}

const formatKey = (key: string | undefined | null): string => {
  if (!key) return '?';
  if (key === ' ') return 'ESPACE';
  if (key === 'ArrowLeft') return '←';
  if (key === 'ArrowRight') return '→';
  return key.toUpperCase();
};

const InputGuide: React.FC<InputGuideProps> = ({ phase, buffer, teamAName = 'Équipe A', teamBName = 'Équipe B', setterFront, rallyTeamName }) => {
  const { shortcuts } = useShortcutsStore();

  const oppositePos = setterFront ? '1' : '2';

  const phaseConfig: Record<InputPhase, { label: string; hint: string; keys: string }> = {
    idle: {
      label: 'EN ATTENTE',
      hint: 'Cliquez sur le terrain pour démarrer un point (position du serveur)',
      keys: '[CLIC sur terrain]',
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
      hint: 'Qualité du service (# = ace)',
      keys: `[${formatKey(shortcuts.qualityExcellent)}] # Ace  [${formatKey(shortcuts.qualityGood)}] + Bon  [${formatKey(shortcuts.qualityNeutral)}] - Neutre  [${formatKey(shortcuts.qualityBad)}] ! Mauvais  [${formatKey(shortcuts.qualityOverpass)}] / Over  [${formatKey(shortcuts.qualityTerrible)}] = Erreur`,
    },
    ace_receiver: {
      label: 'ACE — Réceptionneur',
      hint: 'N° du réceptionneur pour lui créditer une réception -- (ENTRÉE pour passer)',
      keys: '[N° joueur] + [ENTRÉE]  ou  [ENTRÉE] pour passer',
    },
    reception: {
      label: 'RÉCEPTION',
      hint: 'N° joueur + qualité',
      keys: `[N°] + [${formatKey(shortcuts.qualityExcellent)}] # 3pass  [${formatKey(shortcuts.qualityGood)}] + 2pass  [${formatKey(shortcuts.qualityNeutral)}] - 1pass  [${formatKey(shortcuts.qualityBad)}] ! Free  [${formatKey(shortcuts.qualityOverpass)}] / Over  [${formatKey(shortcuts.qualityTerrible)}] = Err`,
    },
    set_call: {
      label: `PASSE${rallyTeamName ? ` — ${rallyTeamName}` : ''}`,
      hint: 'Appel du central',
      keys: `[${formatKey(shortcuts.setAvant)}] Avant  [${formatKey(shortcuts.setArriere)}] Arrière  [${formatKey(shortcuts.setDecalee)}] Décalée  [${formatKey(shortcuts.setNone)}] Pas d'appel`,
    },
    attack_position: {
      label: `PASSE — Direction${rallyTeamName ? ` (${rallyTeamName})` : ''}`,
      hint: 'Où le passeur a-t-il joué ?',
      keys: `[${formatKey(shortcuts.attackSecondeMain)}] 2nde main  [${formatKey(shortcuts.attackPos4)}] P4  [${formatKey(shortcuts.attackPos3)}] Centre  [${formatKey(shortcuts.attackPos6)}] Pipe  [${formatKey(shortcuts.attackPos2)}] P2  [${formatKey(shortcuts.attackPos1)}] P1`,
    },
    attack_player: {
      label: 'ATTAQUE — Joueur',
      hint: "N° attaquant — 2 chiffres : auto, 1 chiffre : ENTRÉE",
      keys: '[N° joueur] + [ENTRÉE si 1 chiffre]',
    },
    attack_blockers: {
      label: 'ATTAQUE — Bloqueurs',
      hint: 'Nombre de bloqueurs adverses',
      keys: `[${formatKey(shortcuts.blockers0)}] 0  [${formatKey(shortcuts.blockers1)}] 1  [${formatKey(shortcuts.blockers2)}] 2  [${formatKey(shortcuts.blockers3)}] 3`,
    },
    attack_coord: {
      label: 'ATTAQUE — Trajectoire',
      hint: 'Cliquez 2 points sur le terrain',
      keys: '[CLIC × 2]',
    },
    attack_result: {
      label: 'ATTAQUE — Résultat',
      hint: "Résultat de l'attaque",
      keys: `[${formatKey(shortcuts.attackKill)}] # Kill  [${formatKey(shortcuts.attackGood)}] + Bon  [${formatKey(shortcuts.attackTouched)}] - Bloc  [${formatKey(shortcuts.attackBad)}] ! Mauvais  [${formatKey(shortcuts.attackBlocked)}] / Contré  [${formatKey(shortcuts.attackError)}] = Erreur`,
    },
    point_winner: {
      label: 'QUI A GAGNÉ LE POINT ?',
      hint: '',
      keys: `[${formatKey(shortcuts.winnerLeft)}] ${teamAName}  [${formatKey(shortcuts.winnerRight)}] ${teamBName}`,
    },
    recording: {
      label: 'POINT EN COURS',
      hint: `Appuyez sur ${formatKey(shortcuts.startEndPoint)} pour terminer le point`,
      keys: `[${formatKey(shortcuts.startEndPoint)}] Fin  [${formatKey(shortcuts.faultA)}] Faute ${teamAName}  [${formatKey(shortcuts.faultB)}] Faute ${teamBName}`,
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
          <span className="font-mono text-accent text-xl font-black bg-secondary px-4 py-1 rounded-md tracking-widest border border-accent/30">
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
