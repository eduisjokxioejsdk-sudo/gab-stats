import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShortcutMap {
  // Service type
  serviceSmash: string;
  serviceFloat: string;
  // Reception quality
  qualityExcellent: string; // R++
  qualityGood: string;      // R+
  qualityNeutral: string;   // R0
  qualityBad: string;       // R-
  qualityTerrible: string;  // R--
  // Set call
  setAvant: string;
  setArriere: string;
  setDecalee: string;
  setNone: string;
  // Attack result
  attackKill: string;
  attackError: string;
  attackContinue: string;
  // Point
  startEndPoint: string;
  winnerLeft: string;
  winnerRight: string;
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
