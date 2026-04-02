import { useMatchStore } from '@/store/matchStore';
import type { Match, Team, SetData, Point, Action, Quality, AttackResult } from '@/types/volleyball';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const qualityOptions: Quality[] = ['++', '+', '0', '-', '--'];
const attackResults: AttackResult[] = ['kill', 'error', 'continue'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function loadDemoMatch() {
  const store = useMatchStore.getState();

  const teamAId = generateId();
  const teamBId = generateId();

  const teamAPlayers = [1, 4, 7, 9, 11, 15].map((n) => ({
    id: generateId(),
    number: n,
    name: ['Martin', 'Dupont', 'Leroy', 'Moreau', 'Simon', 'Laurent'][n === 1 ? 0 : n === 4 ? 1 : n === 7 ? 2 : n === 9 ? 3 : n === 11 ? 4 : 5],
    teamId: teamAId,
  }));

  const teamBPlayers = [2, 5, 8, 10, 12, 14].map((n) => ({
    id: generateId(),
    number: n,
    name: ['Garcia', 'Bernard', 'Thomas', 'Robert', 'Petit', 'Richard'][n === 2 ? 0 : n === 5 ? 1 : n === 8 ? 2 : n === 10 ? 3 : n === 12 ? 4 : 5],
    teamId: teamBId,
  }));

  const teamA: Team = { id: teamAId, name: 'Paris Volley', players: teamAPlayers, liberos: [{ id: generateId(), number: 15, name: 'Duval', teamId: teamAId }] };
  const teamB: Team = { id: teamBId, name: 'Tours VB', players: teamBPlayers, liberos: [{ id: generateId(), number: 14, name: 'Blanc', teamId: teamBId }] };

  store.createMatch('Démo — Finale Ligue A', new Date().toISOString(), teamA, teamB);

  // Start set with rotations
  const rotA = [1, 4, 7, 9, 11, 15];
  const rotB = [2, 5, 8, 10, 12, 14];
  store.startSet(rotA, rotB, teamAId);

  // Generate ~15 demo points
  const numPoints = 15;
  for (let i = 0; i < numPoints; i++) {
    store.startPoint();

    const state = useMatchStore.getState();
    const currentSet = state.getCurrentSet();
    if (!currentSet) break;

    const lastPoint = currentSet.points[currentSet.points.length - 1];
    if (!lastPoint) break;

    const servingTeamId = lastPoint.servingTeamId;
    const receivingTeamId = servingTeamId === teamAId ? teamBId : teamAId;
    const receivingPlayers = receivingTeamId === teamAId ? teamAPlayers : teamBPlayers;
    const servingPlayers = servingTeamId === teamAId ? teamAPlayers : teamBPlayers;

    // Service action
    const serviceAction: Action = {
      id: generateId(),
      type: 'service',
      teamId: servingTeamId,
      playerNumber: servingPlayers[0].number,
      playerId: servingPlayers[0].id,
      serviceType: Math.random() > 0.5 ? 'smash' : 'float',
      startCoord: { x: 35 + Math.random() * 30, y: 75 + Math.random() * 15 },
      endCoord: { x: 10 + Math.random() * 35, y: 20 + Math.random() * 50 },
      timestamp: Date.now(),
    };
    store.addAction(serviceAction);

    // Reception
    const receiver = randomFrom(receivingPlayers);
    const receptionAction: Action = {
      id: generateId(),
      type: 'reception',
      teamId: receivingTeamId,
      playerNumber: receiver.number,
      playerId: receiver.id,
      quality: randomFrom(qualityOptions),
      timestamp: Date.now(),
    };
    store.addAction(receptionAction);

    // Attack
    const attacker = randomFrom(receivingPlayers);
    const attackAction: Action = {
      id: generateId(),
      type: 'attack',
      teamId: receivingTeamId,
      playerNumber: attacker.number,
      playerId: attacker.id,
      attackResult: randomFrom(attackResults),
      blockersCount: Math.floor(Math.random() * 3),
      startCoord: { x: 10 + Math.random() * 30, y: 20 + Math.random() * 30 },
      endCoord: { x: 55 + Math.random() * 35, y: 10 + Math.random() * 70 },
      timestamp: Date.now(),
    };
    store.addAction(attackAction);

    // End point and assign winner
    store.endPoint();

    // Random winner
    const winner = Math.random() > 0.5 ? teamAId : teamBId;
    store.assignPointWinner(winner);

    // Check if set is over
    const updatedSet = useMatchStore.getState().getCurrentSet();
    if (updatedSet?.winnerTeamId) break;
  }

  useMatchStore.setState({ view: 'live' });
}
