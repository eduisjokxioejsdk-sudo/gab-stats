import React from 'react';
import type { Action } from '@/types/volleyball';

interface ActionLogProps {
  actions: Action[];
  teamAName: string;
  teamBName: string;
  teamAId: string;
}

const qualityLabel = (q?: string) => {
  if (!q) return '';
  return q;
};

const positionLabel = (pos?: string) => {
  if (!pos) return '';
  switch (pos) {
    case 'seconde_main': return '2nde main';
    case '4': return 'P4';
    case '3': return 'Centre';
    case '6': return 'Pipe';
    case '2': return 'P2';
    case '1': return 'P1';
    default: return pos;
  }
};

const formatAction = (action: Action, teamAName: string, teamBName: string, teamAId: string): string => {
  const playerStr = action.playerNumber ? `N°${action.playerNumber}` : '';

  switch (action.type) {
    case 'service': {
      const typeStr = action.serviceType === 'smash' ? 'Smashé' : action.serviceType === 'float' ? 'Flottant' : '';
      return `SERVICE ${playerStr} ${typeStr} ${qualityLabel(action.quality)}`.trim();
    }
    case 'reception':
      return `RÉCEPTION ${playerStr} ${qualityLabel(action.quality)}`.trim();
    case 'set': {
      const callStr = action.setCall === 'avant' ? 'Avant' : action.setCall === 'arriere' ? 'Arrière' : action.setCall === 'decalee' ? 'Décalée' : 'Pas d\'appel';
      return `APPEL ${callStr}`;
    }
    case 'attack': {
      const resultLabels: Record<string, string> = {
        kill: '#', good: '+', touched: '-', bad: '!', blocked: '/', error: '=',
      };
      const resultStr = action.attackResult ? (resultLabels[action.attackResult] || '') : '';
      const blockStr = action.blockersCount !== undefined ? `${action.blockersCount}B` : '';
      const posStr = positionLabel(action.attackPosition);
      return `ATTAQUE ${posStr ? `[${posStr}] ` : ''}${playerStr} ${blockStr} ${resultStr}`.trim();
    }
    case 'defense':
      return `DÉFENSE ${playerStr} ${qualityLabel(action.quality)}`.trim();
    default:
      return (action.type as string).toUpperCase();
  }
};

const getActionColor = (action: Action): string => {
  if (action.quality === '++' || action.attackResult === 'kill') return 'text-score-win';
  if (action.quality === '--' || action.attackResult === 'error' || action.attackResult === 'blocked') return 'text-destructive';
  if (action.attackResult === 'good') return 'text-primary';
  if (action.attackResult === 'touched' || action.attackResult === 'bad') return 'text-orange-400';
  if (action.quality === '+') return 'text-primary';
  if (action.quality === '-') return 'text-orange-400';
  return 'text-foreground';
};

const getActionIcon = (type: string): string => {
  switch (type) {
    case 'service': return '🏐';
    case 'reception': return '🤲';
    case 'set': return '👆';
    case 'attack': return '💥';
    case 'defense': return '🛡️';
    default: return '•';
  }
};

const ActionLog: React.FC<ActionLogProps> = ({ actions, teamAName, teamBName, teamAId }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-3 h-full flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Actions du point
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {actions.length === 0 && (
          <p className="text-muted-foreground text-xs italic">Aucune action</p>
        )}
        {actions.map((action, i) => (
          <div key={action.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-secondary/30 text-sm font-mono">
            <span className="text-muted-foreground w-5 text-[10px]">{i + 1}</span>
            <span className="text-xs">{getActionIcon(action.type)}</span>
            <span className={`flex-1 text-xs ${getActionColor(action)}`}>
              {formatAction(action, teamAName, teamBName, teamAId)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionLog;
