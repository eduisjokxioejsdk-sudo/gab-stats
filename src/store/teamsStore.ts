import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PlayerRole } from '@/types/volleyball';

export interface SavedTeam {
  id: string;
  name: string;
  players: { number: number; name: string; role?: PlayerRole }[];
  liberos: { number: number; name: string }[];
  setterNumber?: number;
}

interface TeamsStore {
  teams: SavedTeam[];
  addTeam: (team: SavedTeam) => void;
  updateTeam: (id: string, team: Partial<SavedTeam>) => void;
  deleteTeam: (id: string) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export const useTeamsStore = create<TeamsStore>()(
  persist(
    (set) => ({
      teams: [],
      addTeam: (team) => set(s => ({ teams: [...s.teams, { ...team, id: team.id || generateId() }] })),
      updateTeam: (id, updates) => set(s => ({
        teams: s.teams.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      deleteTeam: (id) => set(s => ({ teams: s.teams.filter(t => t.id !== id) })),
    }),
    { name: 'gabstats-teams' }
  )
);
