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
      <TrajectoryCourtMini trajectories={trajectories} title={`Toutes les trajectoires (${services.length} services)`} />

      <div className="flex gap-2 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Flottant ({floatServices.length})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-500 inline-block rounded" /> Smashé ({smashServices.length})
        </span>
      </div>

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

      {floatRows.length > 0 && <QualityTable title="Service flottant" rows={floatRows} />}
      {smashRows.length > 0 && <QualityTable title="Service smashé" rows={smashRows} />}
      {floatRows.length === 0 && smashRows.length === 0 && (
        <QualityTable title="Service (tous)" rows={buildQualityRows(services)} />
      )}
    </div>
  );
};

export default ServiceTab;
