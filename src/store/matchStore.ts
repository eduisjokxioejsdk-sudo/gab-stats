import { create } from 'zustand';
import { useShortcutsStore } from '@/store/shortcutsStore';
import type { Match, Team, SetData, Point, Action, InputState, InputPhase, Coordinate, Quality, ServiceType, SetCall, AttackResult, AttackPosition, Substitution, Player } from '@/types/volleyball';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function rotatePositions(positions: number[]): number[] {
  const newPositions = [...positions];
  const fromPos1 = newPositions[0];
  for (let i = 0; i < 5; i++) {
    newPositions[i] = newPositions[i + 1];
  }
  newPositions[5] = fromPos1;
  return newPositions;
}

function addActionToCurrentPoint(match: Match, currentSetIndex: number, currentSet: SetData, pointId: string, action: Action): Match {
  const pointIndex = currentSet.points.findIndex(p => p.id === pointId);
  if (pointIndex === -1) return match;
  const updatedPoint = { ...currentSet.points[pointIndex] };
  updatedPoint.actions = [...updatedPoint.actions, action];
  const updatedPoints = [...currentSet.points];
  updatedPoints[pointIndex] = updatedPoint;
  const updatedSet = { ...currentSet, points: updatedPoints };
  const updatedSets = [...match.sets];
  updatedSets[currentSetIndex] = updatedSet;
  return { ...match, sets: updatedSets };
}

const phaseOrder: InputPhase[] = [
  'service_coord', 'service_type', 'service_quality', 'ace_receiver',
  'reception', 'set_call', 'attack_position', 'attack_blockers', 'attack_coord', 'attack_result',
];

function getPreviousPhase(current: InputPhase): InputPhase | null {
  const idx = phaseOrder.indexOf(current);
  if (idx <= 0) return null;
  return phaseOrder[idx - 1];
}

export type ViewType = 'home' | 'setup' | 'live' | 'dashboard' | 'settings' | 'teams' | 'matches';

interface MatchStore {
  match: Match | null;
  matchHistory: Match[];
  inputState: InputState;
  view: ViewType;

  setView: (view: ViewType) => void;
  createMatch: (name: string, date: string, teamA: Team, teamB: Team, extras?: { location?: string; time?: string; statistician?: string }) => void;
  loadMatch: (match: Match) => void;
  saveMatchToHistory: () => void;
  startSet: (rotationA: number[], rotationB: number[], servingTeamId: string) => void;

  startPoint: () => void;
  endPoint: () => void;
  assignPointWinner: (teamId: string) => void;
  setInputPhase: (phase: InputPhase) => void;
  addCourtClick: (coord: Coordinate) => void;
  processKeyInput: (key: string) => void;
  addAction: (action: Action) => void;

  performSubstitution: (teamId: string, outNumber: number, inNumber: number) => void;
  updateSetter: (teamId: string, newSetterNumber: number) => void;

  selectPoint: (pointId: string) => void;
  getCurrentSet: () => SetData | null;
  getServingTeamId: () => string | null;
  getPlayerByNumber: (teamId: string, num: number) => Player | undefined;
  getCurrentPointActions: () => Action[];
  getSetterNumber: (teamId: string) => number | undefined;
  isSetterFront: (teamId: string) => boolean;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  match: null,
  matchHistory: JSON.parse(localStorage.getItem('purevolley-match-history') || '[]'),
  inputState: {
    phase: 'idle',
    pendingActions: [],
    courtClicks: [],
    buffer: '',
  },
  view: 'home',

  setView: (view) => set({ view }),

  createMatch: (name, date, teamA, teamB, extras) => {
    const match: Match = {
      id: generateId(),
      name,
      date,
      location: extras?.location,
      time: extras?.time,
      statistician: extras?.statistician,
      teamA,
      teamB,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      currentSetIndex: -1,
    };
    set({ match });
  },

  loadMatch: (match) => {
    set({ match, view: 'live', inputState: { phase: 'idle', pendingActions: [], courtClicks: [], buffer: '' } });
  },

  saveMatchToHistory: () => {
    const { match, matchHistory } = get();
    if (!match) return;
    const existing = matchHistory.findIndex(m => m.id === match.id);
    let updated: Match[];
    if (existing !== -1) {
      updated = [...matchHistory];
      updated[existing] = match;
    } else {
      updated = [...matchHistory, match];
    }
    localStorage.setItem('purevolley-match-history', JSON.stringify(updated));
    set({ matchHistory: updated });
  },

  startSet: (rotationA, rotationB, servingTeamId) => {
    const { match } = get();
    if (!match) return;
    const setNumber = match.sets.length + 1;
    const newSet: SetData = {
      id: generateId(),
      matchId: match.id,
      setNumber,
      rotationA,
      rotationB,
      currentRotationA: [...rotationA],
      currentRotationB: [...rotationB],
      points: [],
      scoreA: 0,
      scoreB: 0,
      servingTeamId,
      substitutions: [],
    };
    set({
      match: {
        ...match,
        sets: [...match.sets, newSet],
        currentSetIndex: match.sets.length,
      },
      inputState: {
        phase: 'idle',
        pendingActions: [],
        courtClicks: [],
        buffer: '',
      },
      view: 'live',
    });
  },

  getServingTeamId: () => {
    const { match } = get();
    if (!match) return null;
    const currentSet = get().getCurrentSet();
    if (!currentSet) return null;
    if (currentSet.points.length === 0) {
      return currentSet.servingTeamId || match.teamA.id;
    }
    const lastPoint = currentSet.points[currentSet.points.length - 1];
    if (!lastPoint.winnerTeamId) {
      return lastPoint.servingTeamId;
    }
    return lastPoint.winnerTeamId === lastPoint.servingTeamId
      ? lastPoint.servingTeamId
      : lastPoint.winnerTeamId;
  },

  startPoint: () => {
    const { match, inputState } = get();
    if (!match || inputState.phase !== 'idle') return;
    const currentSet = get().getCurrentSet();
    if (!currentSet) return;

    const servingTeamId = get().getServingTeamId() || match.teamA.id;

    const pointId = generateId();
    const newPoint: Point = {
      id: pointId,
      setId: currentSet.id,
      timecodeStart: Date.now(),
      actions: [],
      scoreA: currentSet.scoreA,
      scoreB: currentSet.scoreB,
      servingTeamId,
    };

    const updatedSet = { ...currentSet, points: [...currentSet.points, newPoint] };
    const updatedSets = [...match.sets];
    updatedSets[match.currentSetIndex] = updatedSet;

    set({
      match: { ...match, sets: updatedSets },
      inputState: {
        phase: 'service_coord',
        currentPointId: pointId,
        pendingActions: [],
        courtClicks: [],
        buffer: '',
      },
    });
  },

  endPoint: () => {
    const { match, inputState } = get();
    if (!match || !inputState.currentPointId) return;
    const currentSet = get().getCurrentSet();
    if (!currentSet) return;

    const pointIndex = currentSet.points.findIndex(p => p.id === inputState.currentPointId);
    if (pointIndex === -1) return;

    const updatedPoint = { ...currentSet.points[pointIndex], timecodeEnd: Date.now() };
    const updatedPoints = [...currentSet.points];
    updatedPoints[pointIndex] = updatedPoint;

    const updatedSet = { ...currentSet, points: updatedPoints };
    const updatedSets = [...match.sets];
    updatedSets[match.currentSetIndex] = updatedSet;

    set({
      match: { ...match, sets: updatedSets },
      inputState: { ...inputState, phase: 'point_winner' },
    });
  },

  assignPointWinner: (teamId) => {
    const { match, inputState } = get();
    if (!match || !inputState.currentPointId) return;
    const currentSet = get().getCurrentSet();
    if (!currentSet) return;

    const pointIndex = currentSet.points.findIndex(p => p.id === inputState.currentPointId);
    if (pointIndex === -1) return;

    const point = currentSet.points[pointIndex];
    let newScoreA = currentSet.scoreA;
    let newScoreB = currentSet.scoreB;

    if (teamId === match.teamA.id) newScoreA++;
    else newScoreB++;

    const servingTeamId = point.servingTeamId;
    let newRotationA = [...currentSet.currentRotationA];
    let newRotationB = [...currentSet.currentRotationB];

    if (teamId !== servingTeamId) {
      if (teamId === match.teamA.id) {
        newRotationA = rotatePositions(newRotationA);
      } else {
        newRotationB = rotatePositions(newRotationB);
      }
    }

    const updatedPoint: Point = {
      ...point,
      winnerTeamId: teamId,
      scoreA: newScoreA,
      scoreB: newScoreB,
      timecodeEnd: point.timecodeEnd || Date.now(),
    };

    const updatedPoints = [...currentSet.points];
    updatedPoints[pointIndex] = updatedPoint;

    const setNumber = currentSet.setNumber;
    const targetScore = setNumber === 5 ? 15 : 25;
    const maxScore = Math.max(newScoreA, newScoreB);
    const minScore = Math.min(newScoreA, newScoreB);
    let setWinner: string | undefined;
    if (maxScore >= targetScore && maxScore - minScore >= 2) {
      setWinner = newScoreA > newScoreB ? match.teamA.id : match.teamB.id;
    }

    const updatedSet: SetData = {
      ...currentSet,
      points: updatedPoints,
      scoreA: newScoreA,
      scoreB: newScoreB,
      currentRotationA: newRotationA,
      currentRotationB: newRotationB,
      winnerTeamId: setWinner,
    };

    const updatedSets = [...match.sets];
    updatedSets[match.currentSetIndex] = updatedSet;

    let setsWonA = match.setsWonA;
    let setsWonB = match.setsWonB;
    if (setWinner === match.teamA.id) setsWonA++;
    else if (setWinner === match.teamB.id) setsWonB++;

    set({
      match: {
        ...match,
        sets: updatedSets,
        setsWonA,
        setsWonB,
        winnerTeamId: setsWonA >= 3 ? match.teamA.id : setsWonB >= 3 ? match.teamB.id : undefined,
      },
      inputState: {
        phase: 'idle',
        currentPointId: undefined,
        pendingActions: [],
        courtClicks: [],
        buffer: '',
      },
    });
    // Auto-save to history
    get().saveMatchToHistory();
  },

  setInputPhase: (phase) => set(state => ({ inputState: { ...state.inputState, phase } })),

  addCourtClick: (coord) => {
    const { inputState, match } = get();
    if (!match) return;

    if (inputState.phase === 'idle') {
      get().startPoint();
      const newState = get().inputState;
      set({ inputState: { ...newState, courtClicks: [coord] } });
      return;
    }

    const clicks = [...inputState.courtClicks, coord];

    if (inputState.phase === 'service_coord' && clicks.length >= 2) {
      set({
        inputState: {
          ...inputState,
          courtClicks: [],
          phase: 'service_type',
          pendingActions: [{
            type: 'service',
            startCoord: clicks[0],
            endCoord: clicks[1],
            timestamp: Date.now(),
          }],
        },
      });
    } else if (inputState.phase === 'attack_coord' && clicks.length >= 2) {
      const pending = [...inputState.pendingActions];
      const attackAction = pending[pending.length - 1];
      if (attackAction) {
        attackAction.startCoord = clicks[0];
        attackAction.endCoord = clicks[1];
      }
      set({
        inputState: {
          ...inputState,
          courtClicks: [],
          phase: 'attack_result',
          pendingActions: pending,
        },
      });
    } else {
      set({ inputState: { ...inputState, courtClicks: clicks } });
    }
  },

  processKeyInput: (key) => {
    const state = get();
    const { inputState, match } = state;
    if (!match) return;

    const currentSet = state.getCurrentSet();
    if (!currentSet) return;
    const servingTeamId = state.getServingTeamId() || match.teamA.id;
    const receivingTeamId = servingTeamId === match.teamA.id ? match.teamB.id : match.teamA.id;
    // rallyTeamId tracks who is currently attacking during a rally (alternates after each non-terminal attack)
    const rallyTeamId = inputState.rallyTeamId || receivingTeamId;
    const sc = useShortcutsStore.getState().shortcuts;

    // Handle backspace
    if (key === 'backspace') {
      if (inputState.buffer.length > 0) {
        set({ inputState: { ...inputState, buffer: inputState.buffer.slice(0, -1) } });
      } else {
        const prevPhase = getPreviousPhase(inputState.phase);
        if (prevPhase) {
          const cs = state.getCurrentSet();
          if (cs && inputState.currentPointId) {
            const pi = cs.points.findIndex(p => p.id === inputState.currentPointId);
            if (pi !== -1) {
              const point = cs.points[pi];
              if (point.actions.length > 0) {
                const updatedActions = point.actions.slice(0, -1);
                const updatedPoint = { ...point, actions: updatedActions };
                const updatedPoints = [...cs.points];
                updatedPoints[pi] = updatedPoint;
                const updatedSet = { ...cs, points: updatedPoints };
                const updatedSets = [...match.sets];
                updatedSets[match.currentSetIndex] = updatedSet;
                set({
                  match: { ...match, sets: updatedSets },
                  inputState: { ...inputState, phase: prevPhase, buffer: '', pendingActions: [], courtClicks: [] },
                });
                return;
              }
            }
          }
          set({ inputState: { ...inputState, phase: prevPhase, buffer: '', pendingActions: [], courtClicks: [] } });
        }
      }
      return;
    }

    switch (inputState.phase) {
      case 'service_type': {
        const serviceType: ServiceType | null = key === sc.serviceSmash ? 'smash' : key === sc.serviceFloat ? 'float' : null;
        if (!serviceType) return;

        const pending = [...inputState.pendingActions];
        if (pending[0]) {
          pending[0].serviceType = serviceType;
          pending[0].teamId = servingTeamId;
          const rotation = servingTeamId === match.teamA.id ? currentSet.currentRotationA : currentSet.currentRotationB;
          pending[0].playerNumber = rotation[0];
          const player = state.getPlayerByNumber(servingTeamId, rotation[0]);
          if (player) pending[0].playerId = player.id;
        }

        const action: Action = {
          id: generateId(),
          type: 'service',
          ...pending[0],
        } as Action;

        if (inputState.currentPointId) {
          const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, currentSet, inputState.currentPointId, action);
          set({
            match: updatedMatch,
            inputState: {
              ...inputState,
              phase: 'service_quality',
              pendingActions: [],
              buffer: '',
            },
          });
        }
        break;
      }

      case 'service_quality': {
        const qualityMap: Record<string, Quality> = {
          [sc.qualityExcellent]: '++',
          [sc.qualityGood]: '+',
          [sc.qualityNeutral]: '0',
          [sc.qualityBad]: '-',
          [sc.qualityTerrible]: '--',
        };
        const quality = qualityMap[key];
        if (!quality) return;

        const updatedCurrentSet = state.getCurrentSet();
        if (!updatedCurrentSet || !inputState.currentPointId) return;
        const pointIndex = updatedCurrentSet.points.findIndex(p => p.id === inputState.currentPointId);
        if (pointIndex === -1) return;
        const point = updatedCurrentSet.points[pointIndex];
        const serviceAction = point.actions.find(a => a.type === 'service');
        if (serviceAction) {
          serviceAction.quality = quality;
          const updatedPoints = [...updatedCurrentSet.points];
          updatedPoints[pointIndex] = { ...point, actions: [...point.actions] };
          const updatedSet = { ...updatedCurrentSet, points: updatedPoints };
          const updatedSets = [...match.sets];
          updatedSets[match.currentSetIndex] = updatedSet;

          if (quality === '++') {
            // ACE — go to ace_receiver phase instead of auto-assigning
            set({ match: { ...match, sets: updatedSets } });
            // Set timecodeEnd
            const endState = get();
            const endSet = endState.getCurrentSet();
            if (endSet) {
              const pi = endSet.points.findIndex(p => p.id === inputState.currentPointId);
              if (pi !== -1) {
                const ep = { ...endSet.points[pi], timecodeEnd: Date.now() };
                const eps = [...endSet.points];
                eps[pi] = ep;
                const es = { ...endSet, points: eps };
                const ess = [...(endState.match?.sets || [])];
                ess[match.currentSetIndex] = es;
                set({
                  match: { ...endState.match!, sets: ess },
                  inputState: { ...inputState, phase: 'ace_receiver', buffer: '' },
                });
              }
            }
          } else {
            set({
              match: { ...match, sets: updatedSets },
              inputState: { ...inputState, phase: 'reception', buffer: '' },
            });
          }
        }
        break;
      }

      case 'ace_receiver': {
        // After ace (service ++), optionally enter receiver number for reception --
        if (key === 'enter') {
          if (inputState.buffer) {
            const playerNum = parseInt(inputState.buffer);
            if (!isNaN(playerNum)) {
              const action: Action = {
                id: generateId(), type: 'reception', teamId: receivingTeamId,
                playerNumber: playerNum, playerId: state.getPlayerByNumber(receivingTeamId, playerNum)?.id,
                quality: '--', timestamp: Date.now(),
              };
              if (inputState.currentPointId) {
                const cs2 = state.getCurrentSet();
                if (cs2) {
                  const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, cs2, inputState.currentPointId, action);
                  set({ match: updatedMatch });
                }
              }
            }
          }
          get().assignPointWinner(servingTeamId);
          return;
        }

        const buffer = inputState.buffer + key;
        const playerNum = parseInt(buffer);
        // Auto-validate on 2 digits
        if (buffer.length >= 2 && !isNaN(playerNum)) {
          const action: Action = {
            id: generateId(), type: 'reception', teamId: receivingTeamId,
            playerNumber: playerNum, playerId: state.getPlayerByNumber(receivingTeamId, playerNum)?.id,
            quality: '--', timestamp: Date.now(),
          };
          if (inputState.currentPointId) {
            const cs2 = state.getCurrentSet();
            if (cs2) {
              const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, cs2, inputState.currentPointId, action);
              set({ match: updatedMatch });
            }
          }
          get().assignPointWinner(servingTeamId);
          return;
        }
        set({ inputState: { ...inputState, buffer } });
        break;
      }

      case 'reception': {
        if (key === 'enter') {
          const parts = inputState.buffer.match(/^(\d+)(.?)$/);
          if (parts) {
            const playerNum = parseInt(parts[1]);
            const qualityChar = parts[2];
            const qualityMap: Record<string, Quality> = {
              [sc.qualityExcellent]: '++', [sc.qualityGood]: '+', [sc.qualityNeutral]: '0',
              [sc.qualityBad]: '-', [sc.qualityTerrible]: '--',
            };
            if (qualityChar && qualityMap[qualityChar]) {
              const action: Action = {
                id: generateId(), type: 'reception', teamId: receivingTeamId,
                playerNumber: playerNum, playerId: state.getPlayerByNumber(receivingTeamId, playerNum)?.id,
                quality: qualityMap[qualityChar], timestamp: Date.now(),
              };
              if (inputState.currentPointId) {
                const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, currentSet, inputState.currentPointId, action);
                set({ match: updatedMatch, inputState: { ...inputState, phase: 'set_call', pendingActions: [], buffer: '', rallyTeamId: receivingTeamId } });
              }
            }
          }
          return;
        }

        const buffer = inputState.buffer + key;
        const qualityMap: Record<string, Quality> = {
          [sc.qualityExcellent]: '++', [sc.qualityGood]: '+', [sc.qualityNeutral]: '0',
          [sc.qualityBad]: '-', [sc.qualityTerrible]: '--',
        };

        const lastChar = buffer[buffer.length - 1];
        if (qualityMap[lastChar] && buffer.length >= 3) {
          const playerNumStr = buffer.substring(0, buffer.length - 1);
          const playerNum = parseInt(playerNumStr);
          if (!isNaN(playerNum)) {
            const action: Action = {
              id: generateId(), type: 'reception', teamId: receivingTeamId,
              playerNumber: playerNum, playerId: state.getPlayerByNumber(receivingTeamId, playerNum)?.id,
              quality: qualityMap[lastChar], timestamp: Date.now(),
            };
              if (inputState.currentPointId) {
                const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, currentSet, inputState.currentPointId, action);
                set({ match: updatedMatch, inputState: { ...inputState, phase: 'set_call', pendingActions: [], buffer: '', rallyTeamId: receivingTeamId } });
            }
          }
        } else {
          set({ inputState: { ...inputState, buffer } });
        }
        break;
      }

      case 'set_call': {
        const callMap: Record<string, SetCall> = {
          [sc.setAvant]: 'avant',
          [sc.setArriere]: 'arriere',
          [sc.setDecalee]: 'decalee',
          [sc.setNone]: 'none',
        };
        const call = callMap[key];
        if (!call) return;

        const action: Action = {
          id: generateId(),
          type: 'set',
          teamId: rallyTeamId,
          timestamp: Date.now(),
          setCall: call,
        };

        if (inputState.currentPointId) {
          const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, currentSet, inputState.currentPointId, action);
          set({
            match: updatedMatch,
            inputState: {
              ...inputState,
              phase: call === 'none' ? 'recording' : 'attack_position',
              pendingActions: [],
              buffer: '',
            },
          });
        }
        break;
      }

      case 'attack_position': {
        // Where the setter played
        const team = rallyTeamId === match.teamA.id ? match.teamA : match.teamB;
        const rotation = rallyTeamId === match.teamA.id ? currentSet.currentRotationA : currentSet.currentRotationB;

        if (key === sc.attackSecondeMain) {
          // Seconde main: setter attacks
          const setterNum = team.setterNumber;
          if (setterNum) {
            const setter = state.getPlayerByNumber(rallyTeamId, setterNum);
            set({
              inputState: {
                ...inputState,
                phase: 'attack_blockers',
                buffer: '',
                pendingActions: [{
                  type: 'attack',
                  teamId: rallyTeamId,
                  playerNumber: setterNum,
                  playerId: setter?.id,
                  attackPosition: 'seconde_main',
                  timestamp: Date.now(),
                }],
              },
            });
          }
          return;
        }

        const posMap: Record<string, AttackPosition> = {
          '1': '1', '2': '2', '3': '3', '4': '4', '6': '6',
        };
        const pos = posMap[key];
        if (pos) {
          // Check if we're in P1 reception (setter at rotation position 1)
          const setterNum = team.setterNumber;
          const isSetterP1 = setterNum !== undefined && rotation[0] === setterNum;

          let targetRotIdx: number;
          if (isSetterP1 && (pos === '2' || pos === '4')) {
            // P1 exception: position 4 → pointu, position 2 → R4
            // Find the pointu and R4 players
            const findPlayerByRole = (role: string) => team.players.find(p => p.role === role);
            if (pos === '4') {
              const pointu = findPlayerByRole('pointu');
              if (pointu) {
                const player = state.getPlayerByNumber(rallyTeamId, pointu.number);
                set({
                  inputState: {
                    ...inputState,
                    phase: 'attack_blockers',
                    buffer: '',
                    pendingActions: [{
                      type: 'attack', teamId: rallyTeamId,
                      playerNumber: pointu.number, playerId: player?.id,
                      attackPosition: pos, timestamp: Date.now(),
                    }],
                  },
                });
                break;
              }
            } else {
              // pos === '2' → R4 who is in front row
              const r4Players = team.players.filter(p => p.role === 'r4');
              // Find the R4 that is in front row (rotation pos 2, 3, or 4)
              const frontR4 = r4Players.find(p => {
                const rIdx = rotation.indexOf(p.number);
                return rIdx >= 1 && rIdx <= 3; // positions 2,3,4 (indices 1,2,3)
              });
              if (frontR4) {
                const player = state.getPlayerByNumber(rallyTeamId, frontR4.number);
                set({
                  inputState: {
                    ...inputState,
                    phase: 'attack_blockers',
                    buffer: '',
                    pendingActions: [{
                      type: 'attack', teamId: rallyTeamId,
                      playerNumber: frontR4.number, playerId: player?.id,
                      attackPosition: pos, timestamp: Date.now(),
                    }],
                  },
                });
                break;
              }
            }
          }

          // Default: use rotation position directly
          const positionIndexMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
          targetRotIdx = positionIndexMap[pos];
          const playerNum = rotation[targetRotIdx];
          const player = state.getPlayerByNumber(rallyTeamId, playerNum);

          set({
            inputState: {
              ...inputState,
              phase: 'attack_blockers',
              buffer: '',
              pendingActions: [{
                type: 'attack',
                teamId: rallyTeamId,
                playerNumber: playerNum,
                playerId: player?.id,
                attackPosition: pos,
                timestamp: Date.now(),
              }],
            },
          });
        }
        break;
      }

      case 'attack_player': {
        const existingPending = inputState.pendingActions[0];
        const attackPosition = existingPending?.attackPosition;

        if (key === 'enter') {
          const playerNum = parseInt(inputState.buffer);
          if (!isNaN(playerNum) && playerNum > 0) {
            const player = state.getPlayerByNumber(rallyTeamId, playerNum);
            if (player) {
              set({
                inputState: {
                  ...inputState, phase: 'attack_blockers', buffer: '',
                  pendingActions: [{
                    type: 'attack', teamId: rallyTeamId,
                    playerNumber: playerNum, playerId: player.id,
                    attackPosition,
                    timestamp: Date.now(),
                  }],
                },
              });
            }
          }
          return;
        }
        const buffer = inputState.buffer + key;
        const playerNum = parseInt(buffer);
        if (buffer.length >= 2 && !isNaN(playerNum) && playerNum > 0) {
          const player = state.getPlayerByNumber(rallyTeamId, playerNum);
          if (player) {
            set({
              inputState: {
                ...inputState, phase: 'attack_blockers', buffer: '',
                pendingActions: [{
                  type: 'attack', teamId: rallyTeamId,
                  playerNumber: playerNum, playerId: player.id,
                  attackPosition,
                  timestamp: Date.now(),
                }],
              },
            });
            return;
          }
        }
        set({ inputState: { ...inputState, buffer } });
        break;
      }

      case 'attack_blockers': {
        const blockers = parseInt(key);
        if (isNaN(blockers) || blockers < 0 || blockers > 3) return;
        const pending = [...inputState.pendingActions];
        if (pending[0]) pending[0].blockersCount = blockers;
        set({
          inputState: { ...inputState, phase: 'attack_coord', pendingActions: pending, buffer: '' },
        });
        break;
      }

      case 'attack_result': {
        const resultMap: Record<string, AttackResult> = {
          [sc.attackKill]: 'kill',
          [sc.attackGood]: 'good',
          [sc.attackTouched]: 'touched',
          [sc.attackBad]: 'bad',
          [sc.attackBlocked]: 'blocked',
          [sc.attackError]: 'error',
        };

        const attackResult = resultMap[key];
        if (!attackResult) return;

        const autoWinAttacker = attackResult === 'kill';
        const autoWinOpponent = attackResult === 'blocked' || attackResult === 'error';

        const pending = inputState.pendingActions[0];
        const action: Action = {
          id: generateId(),
          type: 'attack',
          teamId: pending?.teamId || rallyTeamId,
          playerNumber: pending?.playerNumber,
          playerId: pending?.playerId,
          blockersCount: pending?.blockersCount,
          startCoord: pending?.startCoord,
          endCoord: pending?.endCoord,
          attackPosition: pending?.attackPosition,
          attackResult,
          timestamp: Date.now(),
        };

        if (inputState.currentPointId) {
          const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, currentSet, inputState.currentPointId, action);
          set({ match: updatedMatch });

          if (autoWinAttacker) {
            const attackTeamId = pending?.teamId || rallyTeamId;
            const s2 = get();
            const cs2 = s2.getCurrentSet();
            if (cs2) {
              const pi = cs2.points.findIndex(p => p.id === inputState.currentPointId);
              if (pi !== -1) {
                const ep = { ...cs2.points[pi], timecodeEnd: Date.now() };
                const eps = [...cs2.points];
                eps[pi] = ep;
                const es = { ...cs2, points: eps };
                const ess = [...(s2.match?.sets || [])];
                ess[match.currentSetIndex] = es;
                set({ match: { ...s2.match!, sets: ess } });
              }
            }
            get().assignPointWinner(attackTeamId);
          } else if (autoWinOpponent) {
            const attackTeamId = pending?.teamId || rallyTeamId;
            const opponentTeamId = attackTeamId === match.teamA.id ? match.teamB.id : match.teamA.id;
            const s2 = get();
            const cs2 = s2.getCurrentSet();
            if (cs2) {
              const pi = cs2.points.findIndex(p => p.id === inputState.currentPointId);
              if (pi !== -1) {
                const ep = { ...cs2.points[pi], timecodeEnd: Date.now() };
                const eps = [...cs2.points];
                eps[pi] = ep;
                const es = { ...cs2, points: eps };
                const ess = [...(s2.match?.sets || [])];
                ess[match.currentSetIndex] = es;
                set({ match: { ...s2.match!, sets: ess } });
              }
            }
            get().assignPointWinner(opponentTeamId);
          } else {
            // good, touched, bad → ball crosses net, other team attacks
            const attackTeamId = pending?.teamId || rallyTeamId;
            const otherTeamId = attackTeamId === match.teamA.id ? match.teamB.id : match.teamA.id;
            set({
              inputState: { ...inputState, phase: 'set_call', pendingActions: [], buffer: '', courtClicks: [], rallyTeamId: otherTeamId },
            });
          }
        }
        break;
      }

      default:
        break;
    }
  },

  addAction: (action) => {
    const { match, inputState } = get();
    if (!match || !inputState.currentPointId) return;
    const currentSet = get().getCurrentSet();
    if (!currentSet) return;
    const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, currentSet, inputState.currentPointId, action);
    set({ match: updatedMatch });
  },

  performSubstitution: (teamId, outNumber, inNumber) => {
    const { match } = get();
    if (!match) return;
    const currentSet = get().getCurrentSet();
    if (!currentSet) return;

    const isTeamA = teamId === match.teamA.id;
    const rotation = isTeamA ? [...currentSet.currentRotationA] : [...currentSet.currentRotationB];
    const idx = rotation.indexOf(outNumber);
    if (idx === -1) return;
    rotation[idx] = inNumber;

    const sub: Substitution = {
      id: generateId(),
      teamId,
      outNumber,
      inNumber,
      atPointIndex: currentSet.points.length,
      timestamp: Date.now(),
    };

    const updatedSet = {
      ...currentSet,
      ...(isTeamA ? { currentRotationA: rotation } : { currentRotationB: rotation }),
      substitutions: [...currentSet.substitutions, sub],
    };

    const updatedSets = [...match.sets];
    updatedSets[match.currentSetIndex] = updatedSet;
    set({ match: { ...match, sets: updatedSets } });
  },

  updateSetter: (teamId, newSetterNumber) => {
    const { match } = get();
    if (!match) return;
    const isTeamA = teamId === match.teamA.id;
    const updatedTeam = isTeamA
      ? { ...match.teamA, setterNumber: newSetterNumber }
      : { ...match.teamB, setterNumber: newSetterNumber };
    set({
      match: {
        ...match,
        ...(isTeamA ? { teamA: updatedTeam } : { teamB: updatedTeam }),
      },
    });
  },

  selectPoint: (_pointId) => {},

  getCurrentSet: () => {
    const { match } = get();
    if (!match || match.currentSetIndex < 0) return null;
    return match.sets[match.currentSetIndex] || null;
  },

  getPlayerByNumber: (teamId, num) => {
    const { match } = get();
    if (!match) return undefined;
    const team = teamId === match.teamA.id ? match.teamA : match.teamB;
    return team.players.find(p => p.number === num) || team.liberos.find(p => p.number === num);
  },

  getCurrentPointActions: () => {
    const { match, inputState } = get();
    if (!match || !inputState.currentPointId) return [];
    const currentSet = get().getCurrentSet();
    if (!currentSet) return [];
    const point = currentSet.points.find(p => p.id === inputState.currentPointId);
    return point?.actions || [];
  },

  getSetterNumber: (teamId) => {
    const { match } = get();
    if (!match) return undefined;
    const team = teamId === match.teamA.id ? match.teamA : match.teamB;
    return team.setterNumber;
  },

  isSetterFront: (teamId) => {
    const { match } = get();
    if (!match) return false;
    const currentSet = get().getCurrentSet();
    if (!currentSet) return false;
    const team = teamId === match.teamA.id ? match.teamA : match.teamB;
    const rotation = teamId === match.teamA.id ? currentSet.currentRotationA : currentSet.currentRotationB;
    if (!team.setterNumber) return false;
    const idx = rotation.indexOf(team.setterNumber);
    // Front row: P2(idx1), P3(idx2), P4(idx3)
    return idx === 1 || idx === 2 || idx === 3;
  },
}));
