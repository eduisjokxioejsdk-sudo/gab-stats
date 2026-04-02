import React, { useState, useRef, useEffect } from 'react';
import type { Action, Point, Quality, AttackResult, SetCall } from '@/types/volleyball';
import { useMatchStore } from '@/store/matchStore';

const positionLabel = (pos?: string) => {
  if (!pos) return '';
  switch (pos) {
    case 'seconde_main': return '2nde';
    case '4': return 'P4';
    case '3': return 'C';
    case '6': return 'Pi';
    case '2': return 'P2';
    case '1': return 'P1';
    default: return pos;
  }
};

const formatAction = (action: Action): string => {
  const p = action.playerNumber ? `${action.playerNumber}` : '';
  switch (action.type) {
    case 'service': {
      const t = action.serviceType === 'smash' ? 'S' : 'F';
      return `SRV ${p} ${t} ${action.quality || ''}`.trim();
    }
    case 'reception':
      return `REC ${p} ${action.quality || ''}`.trim();
    case 'set': {
      const c = action.setCall === 'avant' ? 'Av' : action.setCall === 'arriere' ? 'Ar' : action.setCall === 'decalee' ? 'Déc' : '∅';
      return `PASSE ${c}`;
    }
    case 'attack': {
      const r: Record<string, string> = { kill: '#', good: '+', touched: '-', bad: '!', blocked: '/', error: '=' };
      return `ATT ${positionLabel(action.attackPosition)} ${p} ${action.blockersCount ?? ''}B ${action.attackResult ? r[action.attackResult] || '' : ''}`.trim();
    }
    default:
      return action.type.toUpperCase();
  }
};

const getActionColor = (action: Action): string => {
  if (action.quality === '++' || action.attackResult === 'kill') return 'text-score-win';
  if (action.quality === '--' || action.attackResult === 'error' || action.attackResult === 'blocked') return 'text-destructive';
  if (action.attackResult === 'good' || action.quality === '+') return 'text-primary';
  if (action.attackResult === 'touched' || action.attackResult === 'bad' || action.quality === '-' || action.quality === '0') return 'text-orange-400';
  if (action.quality === '/') return 'text-destructive';
  return 'text-foreground';
};

interface EditingState {
  setIndex: number;
  pointIndex: number;
  actionId: string;
  action: Action;
}

const qualityOptions: { value: Quality; label: string }[] = [
  { value: '++', label: '#' }, { value: '+', label: '+' }, { value: '0', label: '-' },
  { value: '-', label: '!' }, { value: '/', label: '/' }, { value: '--', label: '=' },
];

const attackResultOptions: { value: AttackResult; label: string }[] = [
  { value: 'kill', label: '#' }, { value: 'good', label: '+' }, { value: 'touched', label: '-' },
  { value: 'bad', label: '!' }, { value: 'blocked', label: '/' }, { value: 'error', label: '=' },
];

const setCallOptions: { value: SetCall; label: string }[] = [
  { value: 'avant', label: 'Av' }, { value: 'arriere', label: 'Ar' },
  { value: 'decalee', label: 'Déc' }, { value: 'none', label: '∅' },
];

const ActionLog: React.FC = () => {
  const { match, updateAction, getAllMatchActions } = useMatchStore();
  const [editing, setEditing] = useState<EditingState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allActions = getAllMatchActions();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allActions.length]);

  if (!match) return null;

  const handleSave = (updates: Partial<Action>) => {
    if (!editing) return;
    updateAction(editing.setIndex, editing.pointIndex, editing.actionId, updates);
    setEditing(null);
  };

  // Group by points to insert separators
  let lastPointId = '';

  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        Actions du match
      </h3>
      <div className="flex-1 overflow-y-auto">
        {allActions.length === 0 && (
          <p className="text-muted-foreground text-[10px] italic">Aucune action</p>
        )}
        {allActions.map((entry, i) => {
          const showPointStart = entry.point.id !== lastPointId;
          const prevPointId = lastPointId;
          lastPointId = entry.point.id;

          // Check if previous point ended (has winner)
          const showPointEnd = showPointStart && i > 0;

          return (
            <React.Fragment key={`${entry.action.id}-${i}`}>
              {showPointEnd && (
                <div className="flex items-center gap-1 my-0.5">
                  <div className="flex-1 h-px bg-accent/60" />
                  <span className="text-[8px] font-mono text-accent">FIN</span>
                  <div className="flex-1 h-px bg-accent/60" />
                </div>
              )}
              {showPointStart && (
                <div className="flex items-center gap-1 my-0.5">
                  <div className="flex-1 h-px bg-accent/60" />
                  <span className="text-[8px] font-mono text-accent">
                    S{entry.setNumber} — {entry.point.scoreA}-{entry.point.scoreB}
                  </span>
                  <div className="flex-1 h-px bg-accent/60" />
                </div>
              )}
              <div
                onClick={() => setEditing({
                  setIndex: entry.setIndex,
                  pointIndex: entry.pointIndex,
                  actionId: entry.action.id,
                  action: entry.action,
                })}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer hover:bg-secondary/60 transition-colors ${
                  editing?.actionId === entry.action.id ? 'bg-primary/20 ring-1 ring-primary/40' : ''
                }`}
              >
                <span className={`flex-1 ${getActionColor(entry.action)}`}>
                  {formatAction(entry.action)}
                </span>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="border-t border-border pt-2 mt-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-primary uppercase">Modifier</span>
            <button onClick={() => setEditing(null)} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">{formatAction(editing.action)}</p>

          {/* Quality editor for service/reception */}
          {(editing.action.type === 'service' || editing.action.type === 'reception') && (
            <div className="flex gap-1 flex-wrap">
              {qualityOptions
                .filter(q => editing.action.type !== 'service' || (q.value !== '-' && q.value !== '/'))
                .map(q => (
                  <button
                    key={q.value}
                    onClick={() => handleSave({ quality: q.value })}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                      editing.action.quality === q.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
            </div>
          )}

          {/* Set call editor */}
          {editing.action.type === 'set' && (
            <div className="flex gap-1 flex-wrap">
              {setCallOptions.map(c => (
                <button
                  key={c.value}
                  onClick={() => handleSave({ setCall: c.value })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    editing.action.setCall === c.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Attack result editor */}
          {editing.action.type === 'attack' && (
            <div className="flex gap-1 flex-wrap">
              {attackResultOptions.map(r => (
                <button
                  key={r.value}
                  onClick={() => handleSave({ attackResult: r.value })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    editing.action.attackResult === r.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Player number editor */}
          {editing.action.playerNumber !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">N°</span>
              <input
                type="number"
                defaultValue={editing.action.playerNumber}
                className="w-14 bg-secondary text-foreground text-[10px] font-mono px-1.5 py-0.5 rounded border border-border"
                onBlur={(e) => {
                  const num = parseInt(e.target.value);
                  if (!isNaN(num) && num > 0) handleSave({ playerNumber: num });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const num = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(num) && num > 0) handleSave({ playerNumber: num });
                  }
                  e.stopPropagation();
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionLog;
