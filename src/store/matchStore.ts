import { create } from 'zustand';
import { useShortcutsStore } from '@/store/shortcutsStore';
import type { Match, Team, SetData, Point, Action, InputState, InputPhase, Coordinate, Quality, ServiceType, SetCall, AttackResult } from '@/types/volleyball';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function rotatePositions(positions: number[]): number[] {
  // Clockwise rotation: 1->6, 2->1, 3->2, 4->3, 5->4, 6->5
  // positions array: index 0 = pos1, index 1 = pos2, etc.
  const newPositions = [...positions];
  const fromPos1 = newPositions[0];
  for (let i = 0; i < 5; i++) {
    newPositions[i] = newPositions[i + 1];
  }
  newPositions[5] = fromPos1;
  return newPositions;
}

interface MatchStore {
  match: Match | null;
  inputState: InputState;
  view: 'setup' | 'live' | 'dashboard' | 'settings';

  // Setup
  setView: (view: 'setup' | 'live' | 'dashboard' | 'settings') => void;
  createMatch: (name: string, date: string, teamA: Team, teamB: Team) => void;
  startSet: (rotationA: number[], rotationB: number[], servingTeamId: string) => void;

  // Input workflow
  startPoint: () => void;
  endPoint: () => void;
  assignPointWinner: (teamId: string) => void;
  setInputPhase: (phase: InputPhase) => void;
  addCourtClick: (coord: Coordinate) => void;
  processKeyInput: (key: string) => void;
  addAction: (action: Action) => void;

  // Edit
  selectPoint: (pointId: string) => void;

  // Helpers
  getCurrentSet: () => SetData | null;
  getServingTeam: () => Team | null;
  getReceivingTeam: () => Team | null;
  getPlayerByNumber: (teamId: string, num: number) => { id: string; number: number; name: string } | undefined;
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

  startPoint: () => {
    const { match, inputState } = get();
    if (!match || inputState.phase !== 'idle') return;
    const currentSet = get().getCurrentSet();
    if (!currentSet) return;

    // Determine serving team
    const lastPoint = currentSet.points[currentSet.points.length - 1];
    const servingTeamId = lastPoint ? lastPoint.servingTeamId : (currentSet.points.length === 0 ?
      // First point: team whose position 1 serves - determined at set start
      // We'll use a convention: first serving team is stored
      match.teamA.id : lastPoint.servingTeamId);

    const pointId = generateId();
    const newPoint: Point = {
      id: pointId,
      setId: currentSet.id,
      timecodeStart: Date.now(),
      actions: [],
      scoreA: currentSet.scoreA,
      scoreB: currentSet.scoreB,
      servingTeamId: lastPoint?.servingTeamId || match.teamA.id,
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

    // Check rotation: if receiving team wins, they rotate
    const servingTeamId = point.servingTeamId;
    let newRotationA = [...currentSet.currentRotationA];
    let newRotationB = [...currentSet.currentRotationB];
    let newServingTeamId = servingTeamId;

    if (teamId !== servingTeamId) {
      // Service changes - receiving team won, they rotate
      newServingTeamId = teamId;
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
      servingTeamId: point.servingTeamId,
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

    // Next point's serving team
    const nextPoint: Partial<Point> = { servingTeamId: newServingTeamId };

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

    // Store serving team for next point by updating last point
    // Actually we handle this in startPoint by looking at previous point winner
  },

  setInputPhase: (phase) => set(state => ({ inputState: { ...state.inputState, phase } })),

  addCourtClick: (coord) => {
    const { inputState, match } = get();
    const clicks = [...inputState.courtClicks, coord];

    if (inputState.phase === 'service_coord' && clicks.length >= 2) {
      // Two clicks done for service trajectory
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
      // Two clicks for attack trajectory - complete the pending attack action
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
    const servingTeamId = currentSet.points[currentSet.points.length - 1]?.servingTeamId || match.teamA.id;
    const receivingTeamId = servingTeamId === match.teamA.id ? match.teamB.id : match.teamA.id;

    switch (inputState.phase) {
      case 'service_type': {
        const sc = useShortcutsStore.getState().shortcuts;
        const serviceType: ServiceType | null = key === sc.serviceSmash ? 'smash' : key === sc.serviceFloat ? 'float' : null;
        if (!serviceType) return;

        const pending = [...inputState.pendingActions];
        if (pending[0]) {
          pending[0].serviceType = serviceType;
          pending[0].teamId = servingTeamId;
          // Find server: player in position 1
          const rotation = servingTeamId === match.teamA.id ? currentSet.currentRotationA : currentSet.currentRotationB;
          pending[0].playerNumber = rotation[0];
          const player = state.getPlayerByNumber(servingTeamId, rotation[0]);
          if (player) pending[0].playerId = player.id;
        }

        // Commit service action and move to reception
        const action: Action = {
          id: generateId(),
          type: 'service',
          ...pending[0],
        } as Action;

        // Add to current point
        const pointIndex = currentSet.points.findIndex(p => p.id === inputState.currentPointId);
        if (pointIndex !== -1) {
          const updatedPoint = { ...currentSet.points[pointIndex] };
          updatedPoint.actions = [...updatedPoint.actions, action];
          const updatedPoints = [...currentSet.points];
          updatedPoints[pointIndex] = updatedPoint;
          const updatedSet = { ...currentSet, points: updatedPoints };
          const updatedSets = [...match.sets];
          updatedSets[match.currentSetIndex] = updatedSet;

          set({
            match: { ...match, sets: updatedSets },
            inputState: {
              ...inputState,
              phase: 'reception',
              pendingActions: [],
              buffer: '',
            },
          });
        }
        break;
      }

      case 'reception': {
        const buffer = inputState.buffer + key;
        // Pattern: player_number + quality
        const sc = useShortcutsStore.getState().shortcuts;
        const qualityMap: Record<string, Quality> = {
          [sc.qualityExcellent]: '++',
          [sc.qualityGood]: '+',
          [sc.qualityNeutral]: '0',
          [sc.qualityBad]: '-',
          [sc.qualityTerrible]: '--',
        };

        // Check if last char is a quality key
        const lastChar = buffer[buffer.length - 1];
        if (qualityMap[lastChar] && buffer.length >= 2) {
          const playerNumStr = buffer.substring(0, buffer.length - 1);
          const playerNum = parseInt(playerNumStr);
          if (!isNaN(playerNum)) {
            const action: Action = {
              id: generateId(),
              type: 'reception',
              teamId: receivingTeamId,
              playerNumber: playerNum,
              playerId: state.getPlayerByNumber(receivingTeamId, playerNum)?.id,
              quality: qualityMap[lastChar],
              timestamp: Date.now(),
            };

            const pointIndex = currentSet.points.findIndex(p => p.id === inputState.currentPointId);
            if (pointIndex !== -1) {
              const updatedPoint = { ...currentSet.points[pointIndex] };
              updatedPoint.actions = [...updatedPoint.actions, action];
              const updatedPoints = [...currentSet.points];
              updatedPoints[pointIndex] = updatedPoint;
              const updatedSet = { ...currentSet, points: updatedPoints };
              const updatedSets = [...match.sets];
              updatedSets[match.currentSetIndex] = updatedSet;

              set({
                match: { ...match, sets: updatedSets },
                inputState: { ...inputState, phase: 'set_call', pendingActions: [], buffer: '' },
              });
            }
          }
        } else {
          set({ inputState: { ...inputState, buffer } });
        }
        break;
      }

      case 'set_call': {
        const sc = useShortcutsStore.getState().shortcuts;
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

        const pointIndex = currentSet.points.findIndex(p => p.id === inputState.currentPointId);
        if (pointIndex !== -1) {
          const updatedPoint = { ...currentSet.points[pointIndex] };
          updatedPoint.actions = [...updatedPoint.actions, action];
          const updatedPoints = [...currentSet.points];
          updatedPoints[pointIndex] = updatedPoint;
          const updatedSet = { ...currentSet, points: updatedPoints };
          const updatedSets = [...match.sets];
          updatedSets[match.currentSetIndex] = updatedSet;

          set({
            match: { ...match, sets: updatedSets },
            inputState: {
              ...inputState,
              phase: call === 'none' ? 'idle' : 'attack_player',
              pendingActions: [],
              buffer: '',
            },
          });
        }
        break;
      }

      case 'attack_player': {
        const buffer = inputState.buffer + key;
        const playerNum = parseInt(buffer);
        // Accept 1-2 digit numbers, move on when we can identify a player
        if (!isNaN(playerNum) && playerNum > 0) {
          // Check if this player exists
          const player = state.getPlayerByNumber(receivingTeamId, playerNum);
          if (player) {
            set({
              inputState: {
                ...inputState,
                phase: 'attack_blockers',
                buffer: '',
                pendingActions: [{
                  type: 'attack',
                  teamId: receivingTeamId,
                  playerNumber: playerNum,
                  playerId: player.id,
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
        const sc = useShortcutsStore.getState().shortcuts;
        const resultMap: Record<string, AttackResult> = {
          [sc.attackKill]: 'kill',
          [sc.attackError]: 'error',
          [sc.attackContinue]: 'continue',
        };
        const result = resultMap[key];
        if (!result) return;

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
          attackResult: result,
          timestamp: Date.now(),
        };

        const pointIndex = currentSet.points.findIndex(p => p.id === inputState.currentPointId);
        if (pointIndex !== -1) {
          const updatedPoint = { ...currentSet.points[pointIndex] };
          updatedPoint.actions = [...updatedPoint.actions, action];
          const updatedPoints = [...currentSet.points];
          updatedPoints[pointIndex] = updatedPoint;
          const updatedSet = { ...currentSet, points: updatedPoints };
          const updatedSets = [...match.sets];
          updatedSets[match.currentSetIndex] = updatedSet;

          // If continue, loop back to reception (defense phase)
          if (result === 'continue') {
            set({
              match: { ...match, sets: updatedSets },
              inputState: { ...inputState, phase: 'reception', pendingActions: [], buffer: '', courtClicks: [] },
            });
          } else {
            // Kill or error - point effectively ends, wait for space
            set({
              match: { ...match, sets: updatedSets },
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

    const pointIndex = currentSet.points.findIndex(p => p.id === inputState.currentPointId);
    if (pointIndex === -1) return;

    const updatedPoint = { ...currentSet.points[pointIndex] };
    updatedPoint.actions = [...updatedPoint.actions, action];
    const updatedPoints = [...currentSet.points];
    updatedPoints[pointIndex] = updatedPoint;
    const updatedSet = { ...currentSet, points: updatedPoints };
    const updatedSets = [...match.sets];
    updatedSets[match.currentSetIndex] = updatedSet;
    set({ match: { ...match, sets: updatedSets } });
  },

  selectPoint: (pointId) => {
    // For future: open point for editing
  },

  getCurrentSet: () => {
    const { match } = get();
    if (!match || match.currentSetIndex < 0) return null;
    return match.sets[match.currentSetIndex] || null;
  },

  getServingTeam: () => {
    const { match } = get();
    const currentSet = get().getCurrentSet();
    if (!match || !currentSet) return null;
    const lastPoint = currentSet.points[currentSet.points.length - 1];
    const servingId = lastPoint?.servingTeamId || match.teamA.id;
    return servingId === match.teamA.id ? match.teamA : match.teamB;
  },

  getReceivingTeam: () => {
    const { match } = get();
    const serving = get().getServingTeam();
    if (!match || !serving) return null;
    return serving.id === match.teamA.id ? match.teamB : match.teamA;
  },

  getPlayerByNumber: (teamId, num) => {
    const { match } = get();
    if (!match) return undefined;
    const team = teamId === match.teamA.id ? match.teamA : match.teamB;
    return team.players.find(p => p.number === num);
  },
}));
