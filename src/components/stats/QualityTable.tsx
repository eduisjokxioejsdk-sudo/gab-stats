import React from 'react';
import type { Quality } from '@/types/volleyball';

interface PlayerQualityRow {
  playerNumber: number;
  total: number;
  excellent: number;
  good: number;
  neutral: number;
  bad: number;
  overpass: number;
  terrible: number;
  efficiency: number;
}

interface QualityTableProps {
  title: string;
  rows: PlayerQualityRow[];
}

const qualityCols: { key: keyof PlayerQualityRow; label: string; colorClass: string }[] = [
  { key: 'excellent', label: '#', colorClass: 'text-score-win' },
  { key: 'good', label: '+', colorClass: 'text-primary' },
  { key: 'neutral', label: '-', colorClass: 'text-orange-400' },
  { key: 'bad', label: '!', colorClass: 'text-orange-600' },
  { key: 'overpass', label: '/', colorClass: 'text-destructive' },
  { key: 'terrible', label: '=', colorClass: 'text-destructive' },
];

const QualityTable: React.FC<QualityTableProps> = ({ title, rows }) => {
  if (rows.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        <p className="text-xs text-muted-foreground italic">Pas de données</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left py-1 pr-2">N°</th>
            {qualityCols.map(c => (
              <th key={c.key} className="text-center py-1 px-1">{c.label}</th>
            ))}
            <th className="text-center py-1 px-1">Tot</th>
            <th className="text-right py-1 pl-2">Eff%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.playerNumber} className="border-b border-border/50 hover:bg-secondary/30">
              <td className="py-1 pr-2 font-bold text-foreground">#{row.playerNumber}</td>
              {qualityCols.map(c => (
                <td key={c.key} className={`text-center py-1 px-1 ${c.colorClass}`}>
                  {row[c.key] as number || '-'}
                </td>
              ))}
              <td className="text-center py-1 px-1 text-foreground">{row.total}</td>
              <td className={`text-right py-1 pl-2 font-bold ${row.efficiency >= 50 ? 'text-score-win' : row.efficiency >= 25 ? 'text-orange-400' : 'text-destructive'}`}>
                {row.efficiency.toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QualityTable;

export function buildQualityRows(
  actions: { playerNumber?: number; quality?: Quality }[]
): PlayerQualityRow[] {
  const byPlayer: Record<number, PlayerQualityRow> = {};

  actions.forEach(a => {
    if (a.playerNumber == null) return;
    if (!byPlayer[a.playerNumber]) {
      byPlayer[a.playerNumber] = {
        playerNumber: a.playerNumber,
        total: 0, excellent: 0, good: 0, neutral: 0, bad: 0, overpass: 0, terrible: 0, efficiency: 0,
      };
    }
    const row = byPlayer[a.playerNumber];
    row.total++;
    if (a.quality === '++') row.excellent++;
    else if (a.quality === '+') row.good++;
    else if (a.quality === '0') row.neutral++;  // - (1 pass) stored as '0' internally
    else if (a.quality === '-') row.bad++;       // ! (freeball) stored as '-'
    else if (a.quality === '/') row.overpass++;
    else if (a.quality === '--') row.terrible++;
  });

  return Object.values(byPlayer).map(r => ({
    ...r,
    efficiency: r.total > 0 ? ((r.excellent + r.good) / r.total) * 100 : 0,
  })).sort((a, b) => a.playerNumber - b.playerNumber);
}
