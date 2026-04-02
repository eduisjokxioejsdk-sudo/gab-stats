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
  liberos: Player[];
  setterNumber?: number;
}

export type ActionType = 'service' | 'reception' | 'set' | 'attack' | 'defense';
export type ServiceType = 'smash' | 'float';
export type Quality = '++' | '+' | '0' | '-' | '--';
export type SetCall = 'avant' | 'arriere' | 'decalee' | 'none';
export type AttackResult = 'kill' | 'error' | 'continue';
export type AttackPosition = 'seconde_main' | '4' | '3' | '6' | '2' | '1';

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
  attackPosition?: AttackPosition;
  blockersCount?: number;
  startCoord?: Coordinate;
  endCoord?: Coordinate;
  timestamp: number;
}

export interface Substitution {
  id: string;
  teamId: string;
  outNumber: number;
  inNumber: number;
  atPointIndex: number;
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
  rotationA: number[];
  rotationB: number[];
  currentRotationA: number[];
  currentRotationB: number[];
  points: Point[];
  scoreA: number;
  scoreB: number;
  servingTeamId: string;
  winnerTeamId?: string;
  substitutions: Substitution[];
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

export type InputPhase =
  | 'idle'
  | 'service_coord'
  | 'service_type'
  | 'service_quality'
  | 'ace_receiver'
  | 'reception'
  | 'set_call'
  | 'attack_position'
  | 'attack_player'
  | 'attack_blockers'
  | 'attack_coord'
  | 'attack_result'
  | 'point_winner'
  | 'recording';

export interface InputState {
  phase: InputPhase;
  currentPointId?: string;
  pendingActions: Partial<Action>[];
  courtClicks: Coordinate[];
  buffer: string;
}
