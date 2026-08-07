/**
 * hintEngine.ts
 * Three-level progressive hint system.
 * Hints advance only after repeated failures or explicit requests.
 * Never reveals the direct solution.
 */
import { HintState, RoomId, GameState } from '../types';
import { hintsForRoom } from './templeMemoryEngine';

// ── Factory ───────────────────────────────────────────────────────────────────

const ALL_ROOMS: RoomId[] = [
  'entrance', 'guardians', 'echoes', 'puzzle',
  'library', 'flooded', 'elements', 'sanctum', 'final',
];

export function buildInitialHintState(): HintState {
  const roomHintLevel = {} as Record<RoomId, 0 | 1 | 2 | 3>;
  const roomFailCount = {} as Record<RoomId, number>;
  const roomHintUsed = {} as Record<RoomId, string[]>;
  const lastHintTurn = {} as Record<RoomId, number>;
  ALL_ROOMS.forEach((r) => {
    roomHintLevel[r] = 0;
    roomFailCount[r] = 0;
    roomHintUsed[r] = [];
    lastHintTurn[r] = 0;
  });
  return { roomHintLevel, roomFailCount, roomHintUsed, lastHintTurn };
}

// ── Hint content — 3 levels per room ─────────────────────────────────────────
// Level 1: Vague observation (player could have noticed this)
// Level 2: Points to something specific to inspect
// Level 3: Describes the mechanism without giving the answer

type HintLevels = [string, string, string];

const ROOM_HINTS: Record<RoomId, HintLevels> = {
  entrance: [
    'The stone here feels different from ordinary rock. Old construction often hides its mechanisms in plain sight.',
    'The lintel inscription reacts to something nearby. Pay attention to what changes when your torch gets close to the stone.',
    'Heat activates a hidden secondary layer beneath the visible inscription. The brazier bracket beside the gate is not decorative — it is the mechanism.',
  ],
  guardians: [
    'The room feels like it wants to converge on something. The floor geometry is deliberate.',
    'Read what is carved into the pedestals before trying to move anything. The carvings are the instructions.',
    'The sentinels are meant to face inward toward the altar. Their current outward position is the problem. Rotate each one to face the centre — but do not look at their faces while doing so.',
  ],
  echoes: [
    'Sound behaves unusually here. Not all echoes are natural.',
    'The alcoves around the walls each produce a different tone. Try touching the crystal objects inside each one.',
    'The three alcove crystals must be activated first to build the resonance chord. Only then will the central orb respond to contact.',
  ],
  puzzle: [
    'The plates are not random. They have a grammar — a sequence borrowed from something ancient.',
    'Decode what each plate says before attempting to move them. The Sanskrit labels are the key.',
    'The correct order follows the cosmic cycle: Creation → Preservation → Dissolution. The blank plate in the centre must not be touched. It is already in its correct position.',
  ],
  library: [
    'The room contains two types of tablets. They behave differently. That difference is significant.',
    'The main drainage diagram has a physical gap — a missing fragment somewhere in this room. Look between the shelving units.',
    'Find the missing slate fragment, combine it with the main diagram, and read the complete schematic before taking the tablet. The diagram tells you which valve is safe.',
  ],
  flooded: [
    'The floor is not uniformly safe. Test before you commit to a path.',
    'Something metal is resting on the submerged floor. Reaching it before draining might be important.',
    'The third valve — marked with a fish symbol — drains to the aquifer. You need a purpose-made key that fits its socket, and the full drainage diagram to be certain you are using the correct valve.',
  ],
  elements: [
    'Each shrine has its own climate. The order you kindle them is not arbitrary.',
    'The floor inscription spells out the sequence. Read it before lighting anything.',
    'The sequence is: Earth first, then Water, then Fire, then Air. Kindling them in wrong order will extinguish prior shrines. Earth is always the foundation.',
  ],
  sanctum: [
    'Rudra\'s posture communicates something. Study the statue carefully before deciding what to do.',
    'The pedestal text distinguishes between two kinds of offering. Read it before placing anything.',
    'Place the relics you gathered throughout the temple at the statue\'s feet. The Ember Vessel from the Chamber of Elements must be among them. Offer without greed.',
  ],
  final: [
    'The Eye is not merely an object. Let it show you what it is before deciding.',
    'The core communicates directly. It will tell you what it needs from you.',
    'Three choices exist: accept the Eye and carry its memory forward, refuse it and walk free, or restore it to the altar and leave the cycle intact. All three are complete answers.',
  ],
};

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Returns the appropriate hint text for the current room and level.
 * Advances the hint level if conditions are met.
 */
export function getHint(
  state: GameState,
  roomId: RoomId,
  forceAdvance: boolean = false,
): { text: string; newHintState: HintState; levelUsed: 1 | 2 | 3 } {
  const hs = state.hintState;
  const mem = state.templeMemory;

  const currentLevel = hs.roomHintLevel[roomId];
  const failCount = hs.roomFailCount[roomId];
  const hintCount = hintsForRoom(mem, roomId);

  // Determine new level
  // Advance if: forceAdvance, or failCount ≥ 3, or multiple hint requests
  let targetLevel: 1 | 2 | 3 = Math.max(1, currentLevel) as 1 | 2 | 3;

  if (forceAdvance || hintCount >= 3 || failCount >= 4) {
    targetLevel = Math.min(3, (currentLevel + 1)) as 1 | 2 | 3;
  } else if (hintCount >= 2 || failCount >= 2) {
    targetLevel = Math.min(2, Math.max(1, currentLevel + 1)) as 1 | 2 | 3;
  } else {
    targetLevel = 1;
  }

  const hints = ROOM_HINTS[roomId];
  const hintText = hints[targetLevel - 1];

  // Check if already used — if so, try next level
  const used = hs.roomHintUsed[roomId] ?? [];
  let finalLevel = targetLevel;
  let finalText = hintText;

  if (used.includes(hintText) && targetLevel < 3) {
    finalLevel = Math.min(3, targetLevel + 1) as 1 | 2 | 3;
    finalText = hints[finalLevel - 1];
  }

  const newHintState: HintState = {
    ...hs,
    roomHintLevel: { ...hs.roomHintLevel, [roomId]: finalLevel },
    roomHintUsed: {
      ...hs.roomHintUsed,
      [roomId]: [...used, finalText],
    },
    lastHintTurn: { ...hs.lastHintTurn, [roomId]: state.currentTurn },
  };

  return { text: finalText, newHintState, levelUsed: finalLevel };
}

/**
 * Records a failed attempt in the hint state for a room.
 */
export function recordRoomFail(hs: HintState, roomId: RoomId): HintState {
  const prev = hs.roomFailCount[roomId] ?? 0;
  return {
    ...hs,
    roomFailCount: { ...hs.roomFailCount, [roomId]: prev + 1 },
  };
}

/**
 * Returns whether the player is stuck (many fails, no solve).
 */
export function isPlayerStuck(state: GameState, roomId: RoomId): boolean {
  return (state.hintState.roomFailCount[roomId] ?? 0) >= 3;
}
