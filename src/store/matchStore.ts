import { create } from 'zustand';
import { useShortcutsStore } from '@/store/shortcutsStore';
import type { Match, Team, SetData, Point, Action, InputState, InputPhase, Coordinate, Quality, ServiceType, SetCall, AttackResult } from '@/types/volleyball';

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

// Phase order for undo navigation
const phaseOrder: InputPhase[] = [
  'service_coord', 'service_type', 'service_quality',
  'reception', 'set_call', 'attack_player', 'attack_blockers', 'attack_coord', 'attack_result',
];

function getPreviousPhase(current: InputPhase): InputPhase | null {
  const idx = phaseOrder.indexOf(current);
  if (idx <= 0) return null;
  return phaseOrder[idx - 1];
}

interface MatchStore {
  match: Match | null;
  inputState: InputState;
  view: 'setup' | 'live' | 'dashboard' | 'settings';

  setView: (view: 'setup' | 'live' | 'dashboard' | 'settings') => void;
  createMatch: (name: string, date: string, teamA: Team, teamB: Team) => void;
  startSet: (rotationA: number[], rotationB: number[], servingTeamId: string) => void;

  startPoint: () => void;
  endPoint: () => void;
  assignPointWinner: (teamId: string) => void;
  setInputPhase: (phase: InputPhase) => void;
  addCourtClick: (coord: Coordinate) => void;
  processKeyInput: (key: string) => void;
  addAction: (action: Action) => void;

  selectPoint: (pointId: string) => void;

  getCurrentSet: () => SetData | null;
  getServingTeamId: () => string | null;
  getPlayerByNumber: (teamId: string, num: number) => { id: string; number: number; name: string } | undefined;
  getCurrentPointActions: () => Action[];
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  match: null,
  inputState: {
    phase: 'idle',
    pendingActions: [],
    courtClicks: [],
    buffer: '',
  },
  view: 'setup',

  setView: (view) => set({ view }),

  createMatch: (name, date, teamA, teamB) => {
    const match: Match = {
      id: generateId(),
      name,
      date,
      teamA,
      teamB,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      currentSetIndex: -1,
    };
    set({ match });
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

  // Start point is now triggered by first court click (idle → service_coord)
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

    // Rotation: if receiving team wins (side-out), the winning team rotates and takes service
    const servingTeamId = point.servingTeamId;
    let newRotationA = [...currentSet.currentRotationA];
    let newRotationB = [...currentSet.currentRotationB];

    if (teamId !== servingTeamId) {
      // Side-out: receiving team wins → they rotate and will serve next
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

    // Check if set is won
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
  },

  setInputPhase: (phase) => set(state => ({ inputState: { ...state.inputState, phase } })),

  addCourtClick: (coord) => {
    const { inputState, match } = get();
    if (!match) return;

    // If idle, first click starts point AND is first service coord
    if (inputState.phase === 'idle') {
      get().startPoint();
      // After startPoint, phase is 'service_coord' with empty clicks
      // Add this click as the first service coord
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
    const sc = useShortcutsStore.getState().shortcuts;

    // Handle backspace: erase buffer char, or undo previous step
    if (key === 'backspace') {
      if (inputState.buffer.length > 0) {
        set({ inputState: { ...inputState, buffer: inputState.buffer.slice(0, -1) } });
      } else {
        // Undo: go back to previous phase
        const prevPhase = getPreviousPhase(inputState.phase);
        if (prevPhase) {
          // Remove last action from current point if we're undoing a committed step
          const cs = state.getCurrentSet();
          if (cs && inputState.currentPointId) {
            const pi = cs.points.findIndex(p => p.id === inputState.currentPointId);
            if (pi !== -1) {
              const point = cs.points[pi];
              // If going back removes the last committed action, do it
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

        // Update service action quality
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
            // ACE! Auto-validate point for serving team
            set({ match: { ...match, sets: updatedSets } });
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
                set({ match: { ...endState.match!, sets: ess } });
              }
            }
            get().assignPointWinner(servingTeamId);
          } else {
            set({
              match: { ...match, sets: updatedSets },
              inputState: { ...inputState, phase: 'reception', buffer: '' },
            });
          }
        }
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
                set({ match: updatedMatch, inputState: { ...inputState, phase: 'set_call', pendingActions: [], buffer: '' } });
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
              set({ match: updatedMatch, inputState: { ...inputState, phase: 'set_call', pendingActions: [], buffer: '' } });
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
          teamId: receivingTeamId,
          timestamp: Date.now(),
          setCall: call,
        };

        if (inputState.currentPointId) {
          const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, currentSet, inputState.currentPointId, action);
          set({
            match: updatedMatch,
            inputState: {
              ...inputState,
              phase: call === 'none' ? 'recording' : 'attack_player',
              pendingActions: [],
              buffer: '',
            },
          });
        }
        break;
      }

      case 'attack_player': {
        if (key === 'enter') {
          const playerNum = parseInt(inputState.buffer);
          if (!isNaN(playerNum) && playerNum > 0) {
            const player = state.getPlayerByNumber(receivingTeamId, playerNum);
            if (player) {
              set({
                inputState: {
                  ...inputState, phase: 'attack_blockers', buffer: '',
                  pendingActions: [{ type: 'attack', teamId: receivingTeamId, playerNumber: playerNum, playerId: player.id, timestamp: Date.now() }],
                },
              });
            }
          }
          return;
        }
        const buffer = inputState.buffer + key;
        const playerNum = parseInt(buffer);
        if (buffer.length >= 2 && !isNaN(playerNum) && playerNum > 0) {
          const player = state.getPlayerByNumber(receivingTeamId, playerNum);
          if (player) {
            set({
              inputState: {
                ...inputState, phase: 'attack_blockers', buffer: '',
                pendingActions: [{ type: 'attack', teamId: receivingTeamId, playerNumber: playerNum, playerId: player.id, timestamp: Date.now() }],
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
        const qualityMap: Record<string, Quality> = {
          [sc.qualityExcellent]: '++',
        };
        const resultMap: Record<string, AttackResult> = {
          [sc.attackError]: 'error',
          [sc.attackContinue]: 'continue',
        };

        let attackResult: AttackResult | null = null;
        let autoWin = false;

        if (qualityMap[key] === '++') {
          attackResult = 'kill';
          autoWin = true;
        } else {
          attackResult = resultMap[key] || null;
        }
        if (!attackResult) return;

        const pending = inputState.pendingActions[0];
        const action: Action = {
          id: generateId(),
          type: 'attack',
          teamId: pending?.teamId || receivingTeamId,
          playerNumber: pending?.playerNumber,
          playerId: pending?.playerId,
          blockersCount: pending?.blockersCount,
          startCoord: pending?.startCoord,
          endCoord: pending?.endCoord,
          attackResult,
          timestamp: Date.now(),
        };

        if (inputState.currentPointId) {
          const updatedMatch = addActionToCurrentPoint(match, match.currentSetIndex, currentSet, inputState.currentPointId, action);
          set({ match: updatedMatch });

          if (autoWin) {
            // Attack ++ = point for attacking team (receiving team)
            const attackTeamId = pending?.teamId || receivingTeamId;
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
            // assignPointWinner handles rotation: receiving team wins → they rotate and serve
            get().assignPointWinner(attackTeamId);
          } else if (attackResult === 'continue') {
            set({
              inputState: { ...inputState, phase: 'reception', pendingActions: [], buffer: '', courtClicks: [] },
            });
          } else {
            set({
              inputState: { ...inputState, phase: 'recording', pendingActions: [], buffer: '', courtClicks: [] },
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

  selectPoint: (_pointId) => {
    // For future: open point for editing
  },

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
}));
