import React, { useMemo } from 'react';
import type { Action, Point, Team } from '@/types/volleyball';
import TrajectoryCourtMini from './TrajectoryCourtMini';
import QualityTable, { buildQualityRows } from './QualityTable';

interface ServiceTabProps {
  actions: Action[];
  allPoints: Point[];
  teamId: string;
  team?: Team;
}

const ServiceTab: React.FC<ServiceTabProps> = ({ actions, allPoints, teamId, team }) => {
  const liberoNumbers = useMemo(() => team?.liberos.map(l => l.number) || [], [team]);

  const services = useMemo(() =>
    actions.filter(a => a.type === 'service' && a.teamId === teamId && !liberoNumbers.includes(a.playerNumber || 0)),
    [actions, teamId, liberoNumbers]
  );

  const floatServices = useMemo(() => services.filter(s => s.serviceType === 'float'), [services]);
  const smashServices = useMemo(() => services.filter(s => s.serviceType === 'smash'), [services]);

  const trajectories = useMemo(() => {
    return services
      .filter(s => s.startCoord && s.endCoord)
      .map(s => ({
        start: s.startCoord!,
        end: s.endCoord!,
        color: s.serviceType === 'smash' ? 'hsl(0, 80%, 55%)' : 'hsl(210, 80%, 55%)',
        opacity: 0.6,
      }));
  }, [services]);

  const floatRows = useMemo(() => buildQualityRows(floatServices), [floatServices]);
  const smashRows = useMemo(() => buildQualityRows(smashServices), [smashServices]);

  const playerNumbers = useMemo(() => {
    const nums = new Set<number>();
    services.forEach(s => { if (s.playerNumber != null) nums.add(s.playerNumber); });
    return Array.from(nums).sort((a, b) => a - b);
  }, [services]);

  return (
    <div className="space-y-4">
      {/* Stats tables */}
      <div className="space-y-3">
        {floatRows.length > 0 && <QualityTable title={`Service flottant (${floatServices.length})`} rows={floatRows} />}
        {smashRows.length > 0 && <QualityTable title={`Service smashé (${smashServices.length})`} rows={smashRows} />}
        {floatRows.length === 0 && smashRows.length === 0 && (
          <QualityTable title="Service (tous)" rows={buildQualityRows(services)} />
        )}
      </div>

      {/* Per-player courts */}
      <div className="grid grid-cols-2 gap-3">
        {playerNumbers.map(num => {
          const playerServices = services.filter(s => s.playerNumber === num);
          const playerTrajs = playerServices
            .filter(s => s.startCoord && s.endCoord)
            .map(s => ({
              start: s.startCoord!,
              end: s.endCoord!,
              color: s.serviceType === 'smash' ? 'hsl(0, 80%, 55%)' : 'hsl(210, 80%, 55%)',
              opacity: 0.7,
            }));
          return (
            <TrajectoryCourtMini key={num} trajectories={playerTrajs} title={`N°${num} (${playerServices.length})`} />
          );
        })}
      </div>
    </div>
  );
};

export default ServiceTab;
