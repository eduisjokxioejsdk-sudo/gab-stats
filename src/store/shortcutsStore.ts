import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShortcutMap {
  serviceSmash: string;
  serviceFloat: string;
  qualityExcellent: string;  // # Perfect pass (3 pass) / Kill / Ace
  qualityGood: string;      // + Good pass (2 pass) / Good attack
  qualityNeutral: string;   // - Bad pass (1 pass) / Touched by block
  qualityBad: string;       // ! Freeball / Bad attack
  qualityOverpass: string;  // / Over pass / Blocked
  qualityTerrible: string;  // = Error (0 pass) / Attack error
  setAvant: string;
  setArriere: string;
  setDecalee: string;
  setNone: string;
  setTransition: string;
  attackSecondeMain: string;
  attackPos4: string;
  attackPos3: string;
  attackPos2or1: string;
  attackPos6: string;
  blockers0: string;
  blockers1: string;
  blockers2: string;
  blockers3: string;
  startEndPoint: string;
  winnerLeft: string;
  winnerRight: string;
  faultA: string;
  faultB: string;
  openSubstitution: string;
  openStats: string;
}

export const defaultShortcuts: ShortcutMap = {
  serviceSmash: 's',
  serviceFloat: 'f',
  qualityExcellent: '#',
  qualityGood: '+',
  qualityNeutral: '-',
  qualityBad: '!',
  qualityOverpass: '/',
  qualityTerrible: '=',
  setAvant: 'a',
  setArriere: 'z',
  setDecalee: 'e',
  setNone: '0',
  setTransition: 't',
  attackSecondeMain: 'm',
  attackPos4: '4',
  attackPos3: '3',
  attackPos2or1: '2',
  attackPos6: '6',
  blockers0: '0',
  blockers1: '1',
  blockers2: '2',
  blockers3: '3',
  startEndPoint: ' ',
  winnerLeft: 'ArrowLeft',
  winnerRight: 'ArrowRight',
  faultA: 'q',
  faultB: 'w',
  openSubstitution: 'c',
  openStats: 'd',
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
