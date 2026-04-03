import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrackingConfig {
  serviceZone: boolean;
  serviceType: boolean;
  receiverNumber: boolean;
  receptionQuality: boolean;
  centralCall: boolean;
  passDistribution: boolean;
  attackTrajectory: boolean;
  blockersCount: boolean;
  attackQuality: boolean;
}

export const defaultTracking: TrackingConfig = {
  serviceZone: true,
  serviceType: true,
  receiverNumber: true,
  receptionQuality: true,
  centralCall: true,
  passDistribution: true,
  attackTrajectory: true,
  blockersCount: true,
  attackQuality: true,
};

export const trackingLabels: Record<keyof TrackingConfig, { label: string; description: string }> = {
  serviceZone: { label: 'Zone de service', description: 'Coordonnées de départ et arrivée du service' },
  serviceType: { label: 'Type de service', description: 'Smashé ou flottant' },
  receiverNumber: { label: 'Numéro du réceptionneur', description: 'Joueur qui réceptionne' },
  receptionQuality: { label: 'Qualité de réception', description: 'Notation # + - ! / =' },
  centralCall: { label: 'Appel du central', description: 'Fixe avant, arrière, décalée ou pas d\'appel' },
  passDistribution: { label: 'Distribution de passe', description: 'Destination de la passe (poste 4, 3, 2, 6…)' },
  attackTrajectory: { label: 'Trajectoire d\'attaque', description: 'Coordonnées de l\'attaque sur le terrain' },
  blockersCount: { label: 'Nombre de bloqueurs', description: '0, 1, 2 ou 3 bloqueurs' },
  attackQuality: { label: 'Qualité d\'attaque', description: 'Notation de la qualité de l\'attaque' },
};

interface TrackingStore {
  config: TrackingConfig;
  toggleField: (field: keyof TrackingConfig) => void;
  resetConfig: () => void;
}

export const useTrackingStore = create<TrackingStore>()(
  persist(
    (set) => ({
      config: { ...defaultTracking },
      toggleField: (field) =>
        set((state) => ({
          config: { ...state.config, [field]: !state.config[field] },
        })),
      resetConfig: () => set({ config: { ...defaultTracking } }),
    }),
    { name: 'purevolley-tracking-config' }
  )
);
