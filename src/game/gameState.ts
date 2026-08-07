/**
 * gameState.ts
 * Initial GameState factory and persistence helpers.
 */
import { GameState, RoomId, RoomFlags, Objective } from '../types';
import { getItems } from './gameItems';
import { buildInitialTempleMemory } from './templeMemoryEngine';
import { buildInitialHintState } from './hintEngine';

const ALL_ROOM_IDS: RoomId[] = [
  'entrance', 'guardians', 'echoes', 'puzzle',
  'library', 'flooded', 'elements', 'sanctum', 'final',
];

function makeRoomFlags(overrides?: Partial<RoomFlags>): RoomFlags {
  return {
    visited: false,
    puzzleSolved: false,
    puzzleProgress: 0,
    itemsCollected: [],
    actionsCompleted: [],
    customData: {},
    ...overrides,
  };
}

function makeObjective(
  id: string,
  title: string,
  tasks: { id: string; text: string; completed?: boolean }[],
): Objective {
  return {
    id,
    title,
    tasks: tasks.map((t) => ({ id: t.id, text: t.text, completed: t.completed ?? false })),
    completed: false,
    archived: false,
  };
}

export function buildInitialGameState(): GameState {
  const roomFlags: Record<RoomId, RoomFlags> = {} as Record<RoomId, RoomFlags>;
  ALL_ROOM_IDS.forEach((id) => { roomFlags[id] = makeRoomFlags(); });
  roomFlags.entrance.visited = true; // player starts here

  const unlockedRooms: Record<RoomId, boolean> = {
    entrance: true,
    guardians: false,
    echoes: false,
    puzzle: false,
    library: false,
    flooded: false,
    elements: false,
    sanctum: false,
    final: false,
  };

  const objectives: Record<RoomId, Objective> = {
    entrance: makeObjective('obj_entrance', 'Light the brazier and open the sealed gate', [
      { id: 'ent_t1', text: 'Read the threshold inscription' },
      { id: 'ent_t2', text: 'Light the brazier' },
      { id: 'ent_t3', text: 'Pass through the open gate' },
    ]),
    guardians: makeObjective('obj_guardians', 'Pass the four watchers without waking them', [
      { id: 'gua_t1', text: 'Study the floor markings' },
      { id: 'gua_t2', text: "Rotate the sentinels inward" },
      { id: 'gua_t3', text: 'Cross to the far arch' },
    ]),
    echoes: makeObjective('obj_echoes', "Attune the resonance mechanism to the temple's pulse", [
      { id: 'ech_t1', text: 'Locate the central resonance orb' },
      { id: 'ech_t2', text: 'Listen for the echo interval' },
      { id: 'ech_t3', text: 'Touch the orb to attune it' },
    ]),
    puzzle: makeObjective('obj_puzzle', "Align the glyph plates to spell Rudra's name", [
      { id: 'puz_t1', text: 'Inspect the five stone plates' },
      { id: 'puz_t2', text: 'Read the cosmic-cycle symbols' },
      { id: 'puz_t3', text: 'Rotate plates into correct sequence' },
    ]),
    library: makeObjective('obj_library', 'Recover the drainage tablet from the whispering stacks', [
      { id: 'lib_t1', text: 'Survey the tablet stacks' },
      { id: 'lib_t2', text: 'Read the drainage scroll' },
      { id: 'lib_t3', text: 'Take the Drainage Tablet' },
    ]),
    flooded: makeObjective('obj_flooded', 'Open the third sluice and drain the corridor', [
      { id: 'flo_t1', text: 'Probe the flooded floor' },
      { id: 'flo_t2', text: 'Read the valve markings' },
      { id: 'flo_t3', text: 'Engage the third sluice valve' },
    ]),
    elements: makeObjective('obj_elements', 'Kindle the four shrines in the true order', [
      { id: 'ele_t1', text: 'Inspect each elemental shrine' },
      { id: 'ele_t2', text: 'Read the ritual sequence inscription' },
      { id: 'ele_t3', text: 'Kindle shrines: Earth → Water → Fire → Air' },
    ]),
    sanctum: makeObjective('obj_sanctum', 'Make the offering Rudra will accept', [
      { id: 'san_t1', text: 'Approach the divine statue' },
      { id: 'san_t2', text: 'Read the pedestal inscription' },
      { id: 'san_t3', text: 'Present the gathered relics' },
    ]),
    final: makeObjective('obj_final', 'Face the Eye of Rudra and choose', [
      { id: 'fin_t1', text: 'Reach the temple core' },
      { id: 'fin_t2', text: 'Inspect the Eye of Rudra' },
      { id: 'fin_t3', text: 'Claim or refuse the relic' },
    ]),
  };

  return {
    currentRoomId: 'entrance',
    previousRoomId: null,
    visitedRooms: ['entrance'],
    unlockedRooms,

    inventory: getItems([
      'ancient_torch', 'field_journal', 'compass', 'rope',
      'stone_tablet', 'oil_flask', 'temple_map',
    ]),
    equippedItemId: 'ancient_torch',

    objectives,
    completedObjectives: [],
    activeObjectiveId: 'obj_entrance',

    journal: [
      {
        id: 'j_start_1',
        text: 'Day 41 — Local maps end where the jungle begins. The temple is not on any of them.',
        turn: 0,
        roomId: 'entrance',
        category: 'lore',
      },
      {
        id: 'j_start_2',
        text: 'The lion carvings match Rudra-cult masonry from three valleys east. This is the site.',
        turn: 0,
        roomId: 'entrance',
        category: 'observation',
      },
    ],

    roomFlags,
    globalFlags: {},

    playerStats: {
      torchFuel: 100,
      resolve: 'Steady',
      templeFavor: 'Neutral',
      observationScore: 0,
      curiosityScore: 0,
      patienceScore: 0,
      integrityScore: 0,
      greedScore: 0,
    },

    currentTurn: 1,
    templeStability: 100,
    floodLevel: 80,
    templePhase: 1,

    completedActions: [],
    eventHistory: [
      { turn: 1, text: 'Crossed the ancient threshold into the Lost Temple of Rudra.', roomId: 'entrance' },
    ],

    puzzleProgress: {},

    templeMemory: buildInitialTempleMemory(),

    playerTraits: {
      curiosity: 10,
      wisdom: 10,
      courage: 10,
      greed: 0,
      compassion: 10,
      patience: 10,
      recklessness: 0,
      observation: 10,
    },

    hintState: buildInitialHintState(),

    dialogueContext: {
      templeWhistersLog: [],
      guideResponseLog: [],
      lastConversationTurn: 0,
    },

    isCollapsing: false,
    gameCompleted: false,
  };
}

// ── Persistence ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'RUDRA_GAME_STATE_V3';

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save game state:', e);
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (e) {
    console.warn('Could not load game state:', e);
    return null;
  }
}

export function clearGameState(): void {
  localStorage.removeItem('RUDRA_GAME_STATE_V3');
  localStorage.removeItem('RUDRA_GAME_STATE_V2');
  localStorage.removeItem('TEMPLE_OF_RUDRA_STATE');
}
