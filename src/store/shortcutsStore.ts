import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShortcutMap {
  serviceSmash: string;
  serviceFloat: string;
  qualityExcellent: string;
  qualityGood: string;
  qualityNeutral: string;
  qualityBad: string;
  qualityTerrible: string;
  setAvant: string;
  setArriere: string;
  setDecalee: string;
  setNone: string;
  attackKill: string;
  attackError: string;
  attackContinue: string;
  attackSecondeMain: string;
  startEndPoint: string;
  winnerLeft: string;
  winnerRight: string;
  faultA: string;
  faultB: string;
}

export const defaultShortcuts: ShortcutMap = {
  serviceSmash: 's',
  serviceFloat: 'f',
  qualityExcellent: '+',
  qualityGood: '=',
  qualityNeutral: '0',
  qualityBad: '-',
  qualityTerrible: '_',
  setAvant: 'a',
  setArriere: 'z',
  setDecalee: 'e',
  setNone: '0',
  attackKill: 'k',
  attackError: 'e',
  attackContinue: 'c',
  attackSecondeMain: 'm',
  startEndPoint: ' ',
  winnerLeft: 'ArrowLeft',
  winnerRight: 'ArrowRight',
};

interface ShortcutsStore {
  shortcuts: ShortcutMap;
  updateShortcut: (key: keyof ShortcutMap, value: string) => void;
  resetShortcuts: () => void;
}

export const useShortcutsStore = create<ShortcutsStore>()(
  persist(
    (set) => ({
      shortcuts: { ...defaultShortcuts },
      updateShortcut: (key, value) =>
        set((state) => ({ shortcuts: { ...state.shortcuts, [key]: value } })),
      resetShortcuts: () => set({ shortcuts: { ...defaultShortcuts } }),
    }),
    { name: 'purevolley-shortcuts' }
  )
);
