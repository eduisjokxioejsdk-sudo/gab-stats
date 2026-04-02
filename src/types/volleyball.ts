export interface Player {
  id: string;
  number: number;
  name: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  liberos: Player[]; // up to 2 liberos
}

export type ActionType = 'service' | 'reception' | 'set' | 'attack' | 'defense';
export type ServiceType = 'smash' | 'float';
export type Quality = '++' | '+' | '0' | '-' | '--';
export type SetCall = 'avant' | 'arriere' | 'decalee' | 'none';
export type AttackResult = 'kill' | 'error' | 'continue';

export interface Coordinate {
  x: number;
  y: number;
}

export interface Action {
  id: string;
  type: ActionType;
  playerId?: string;
  playerNumber?: number;
  teamId: string;
  quality?: Quality;
  serviceType?: ServiceType;
  setCall?: SetCall;
  attackResult?: AttackResult;
  blockersCount?: number;
  startCoord?: Coordinate;
  endCoord?: Coordinate;
  timestamp: number;
}

export interface Point {
  id: string;
  setId: string;
  timecodeStart: number;
  timecodeEnd?: number;
  winnerTeamId?: string;
  actions: Action[];
  scoreA: number;
  scoreB: number;
  servingTeamId: string;
}

export interface SetData {
  id: string;
  matchId: string;
  setNumber: number;
  rotationA: number[]; // player numbers in positions 1-6
  rotationB: number[];
  currentRotationA: number[];
  currentRotationB: number[];
  points: Point[];
  scoreA: number;
  scoreB: number;
  servingTeamId: string; // initial serving team for this set
  winnerTeamId?: string;
}

export interface Match {
  id: string;
  name: string;
  date: string;
  teamA: Team;
  teamB: Team;
  sets: SetData[];
  setsWonA: number;
  setsWonB: number;
  currentSetIndex: number;
  winnerTeamId?: string;
}

// Input workflow state
export type InputPhase =
  | 'idle'           // Waiting for space to start
  | 'service_coord'  // Waiting for serve trajectory on court
  | 'service_type'   // S or F
  | 'service_quality'// Service quality: ++ auto-wins point
  | 'reception'      // Player number + quality
  | 'set_call'       // A, Z, E, or 0
  | 'attack_player'  // Attacker number
  | 'attack_blockers'// 0-3
  | 'attack_coord'   // Trajectory on court
  | 'attack_result'  // K, E, C
  | 'point_winner'   // Left/Right arrow after space ends point
  | 'recording';     // Point in progress, waiting for actions or space to end

export interface InputState {
  phase: InputPhase;
  currentPointId?: string;
  pendingActions: Partial<Action>[];
  courtClicks: Coordinate[];
  buffer: string; // keyboard buffer for multi-char input
}
