import React, { useMemo } from 'react';
import type { Action, Point } from '@/types/volleyball';
import QualityTable, { buildQualityRows } from './QualityTable';

interface ReceptionTabProps {
  actions: Action[];
  allPoints: Point[];
  teamId: string;
}

const ReceptionTab: React.FC<ReceptionTabProps> = ({ actions, allPoints, teamId }) => {
  // Get receptions for this team, split by service type from the same point
  const receptionData = useMemo(() => {
    const receptions: (Action & { serviceType?: string })[] = [];

    allPoints.forEach(point => {
      const serviceAction = point.actions.find(a => a.type === 'service');
      const recActions = point.actions.filter(a => a.type === 'reception' && a.teamId === teamId);
      recActions.forEach(r => {
        receptions.push({ ...r, serviceType: serviceAction?.serviceType });
      });
    });

    return receptions;
  }, [allPoints, teamId]);

  const onFloat = useMemo(() => receptionData.filter(r => r.serviceType === 'float'), [receptionData]);
  const onSmash = useMemo(() => receptionData.filter(r => r.serviceType === 'smash'), [receptionData]);

  const floatRows = useMemo(() => buildQualityRows(onFloat), [onFloat]);
  const smashRows = useMemo(() => buildQualityRows(onSmash), [onSmash]);
  const allRows = useMemo(() => buildQualityRows(receptionData), [receptionData]);

  // Global stats
  const globalEff = useMemo(() => {
    const total = receptionData.length;
    if (total === 0) return 0;
    const good = receptionData.filter(r => r.quality === '++' || r.quality === '+').length;
    return (good / total) * 100;
  }, [receptionData]);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 text-center">
        <p className="text-3xl font-mono font-black text-foreground">
          {globalEff.toFixed(0)}%
        </p>
        <p className="text-xs text-muted-foreground">
          Efficacité globale réception ({receptionData.length} réceptions)
        </p>
      </div>

      <QualityTable title={`Réception sur flottant (${onFloat.length})`} rows={floatRows} />
      <QualityTable title={`Réception sur smashé (${onSmash.length})`} rows={smashRows} />

      {floatRows.length === 0 && smashRows.length === 0 && (
        <QualityTable title="Réception (toutes)" rows={allRows} />
      )}
    </div>
  );
};

export default ReceptionTab;
