/**
 * worldEngine.ts
 * World simulation: torch system, flood states, temple stability,
 * ambient events, secret discoveries, and room atmosphere.
 * Pure functions — never mutates GameState directly.
 */
import { GameState, RoomId, JournalCategory } from '../types';

// ── Torch brightness levels ───────────────────────────────────────────────────

export type TorchBrightness = 'blazing' | 'bright' | 'dim' | 'flickering' | 'out';

export function getTorchBrightness(fuel: number): TorchBrightness {
  if (fuel > 75) return 'blazing';
  if (fuel > 45) return 'bright';
  if (fuel > 20) return 'dim';
  if (fuel > 5) return 'flickering';
  return 'out';
}

export function getTorchDescription(fuel: number): string {
  const b = getTorchBrightness(fuel);
  switch (b) {
    case 'blazing':  return `The torch burns strong — gold flame steady, shadows pushed far back. Fuel: ${fuel}%.`;
    case 'bright':   return `The torch holds well. Warm amber light fills the room. Fuel: ${fuel}%.`;
    case 'dim':      return `The flame has shrunk. Shadows press closer. Edges of the room are uncertain. Fuel: ${fuel}%.`;
    case 'flickering': return `The torch gutters — light comes and goes. Some details vanish between flickers. Fuel: ${fuel}%. Use the Oil Flask if you have it.`;
    case 'out':      return `The torch is out. Absolute darkness. You cannot see anything. Use the Oil Flask or find another flame source.`;
  }
}

// ── Flood states ──────────────────────────────────────────────────────────────

export type FloodState = 'dry' | 'shallow' | 'waist_deep' | 'fully_flooded';

export function getFloodState(floodLevel: number): FloodState {
  if (floodLevel <= 0)  return 'dry';
  if (floodLevel <= 30) return 'shallow';
  if (floodLevel <= 65) return 'waist_deep';
  return 'fully_flooded';
}

export function getFloodDescription(floodLevel: number): string {
  switch (getFloodState(floodLevel)) {
    case 'dry':
      return 'The corridor floor is bare stone — completely drained. Every surface gleams damp but passable.';
    case 'shallow':
      return 'Ankle-deep water covers the corridor floor. Cold, dark, and slow-moving. Items near the floor may be reachable.';
    case 'waist_deep':
      return 'Waist-deep water fills the corridor. Movement is slow and exhausting. Items on the floor are submerged and inaccessible without probing.';
    case 'fully_flooded':
      return 'The corridor is fully flooded — black water to the ceiling in places. Passage is impossible without draining first.';
  }
}

export function getFloodMovementNote(floodLevel: number): string | null {
  const state = getFloodState(floodLevel);
  if (state === 'dry') return null;
  if (state === 'shallow') return 'The shallow water slows you slightly but passage is possible.';
  if (state === 'waist_deep') return 'Waist-deep water makes movement laborious. The floor items are submerged.';
  return 'The corridor is fully flooded. You cannot pass until the sluice is drained.';
}

// ── Temple stability ───────────────────────────────────────────────────────────

export type StabilityState = 'stable' | 'unstable' | 'critical' | 'collapsing';

export function getStabilityState(stability: number): StabilityState {
  if (stability > 70) return 'stable';
  if (stability > 40) return 'unstable';
  if (stability > 15) return 'critical';
  return 'collapsing';
}

export function getStabilityDescription(stability: number): string {
  switch (getStabilityState(stability)) {
    case 'stable':
      return 'The temple structure is sound. Stone settles without cracking. No immediate threat.';
    case 'unstable':
      return 'The temple groans intermittently. Dust sifts from the ceiling. Some passages show fresh cracks.';
    case 'critical':
      return 'Deep structural sounds roll through the walls. Stones have shifted visibly. The temple is deteriorating.';
    case 'collapsing':
      return 'The temple is actively collapsing. Debris falls. Passages seal themselves. Time is short.';
  }
}

/** Stability delta per significant action */
export function getStabilityDelta(action: string): number {
  const penalties: Record<string, number> = {
    brazier_lit:       +5,   // beneficial — activates temple systems
    puzzle_solved:     +8,   // harmonises the temple
    offering_made:     +10,  // strongest positive
    relic_restored:    +15,  // highest positive
    wrong_valve:       -8,   // dangerous action
    consecutive_fails: -3,   // wear on mechanisms
    relic_taken:       -5,   // disrupts balance
    torch_extinguished:-2,   // minor disruption
  };
  return penalties[action] ?? 0;
}

// ── Room atmosphere (dynamic, state-driven) ───────────────────────────────────

export interface AtmosphereNote {
  text: string;
  category: JournalCategory;
}

export function getRoomAtmosphere(state: GameState): AtmosphereNote | null {
  const { currentRoomId: room, playerStats, templeStability, floodLevel, currentTurn } = state;
  const fuel = playerStats.torchFuel;
  const stability = templeStability;
  const brightness = getTorchBrightness(fuel);
  const solved = state.roomFlags[room]?.puzzleSolved ?? false;

  // Every 7 turns produce one ambient note per room
  if (currentTurn % 7 !== 0) return null;

  const roomNotes: Partial<Record<RoomId, string[]>> = {
    entrance: [
      'Dust motes drift in the torch beam, stirred by a breath of air from somewhere inside.',
      'The lion sentinels are still. Their shadow falls differently than it did a moment ago.',
      'A distant sound — water or stone — carries up through the gate you opened.',
    ],
    guardians: [
      'One of the sentinel bases has a hairline fracture you did not notice before.',
      solved
        ? 'The sentinels face inward, their alignment creating a subtle resonance in the floor.'
        : 'The quartz eyes of the nearest sentinel catch your torch at a different angle than before.',
      'A low tone carries through the floor — not vibration exactly, more like a held note.',
    ],
    echoes: [
      solved
        ? 'The hall holds its resonance. You can still hear faint harmonics in the walls.'
        : 'The echo interval has shifted — 1.3 seconds now, not 1.5. Something changed.',
      'Wet condensation traces a slow path down the far wall.',
      'Your footstep echoes twice, then a third time from a direction you have not walked.',
    ],
    puzzle: [
      solved
        ? 'The plates are locked in sequence. The room has stopped shifting.'
        : 'The bioluminescent script on the plates pulses once — an almost imperceptible rhythm.',
      'A carved serpent on the wall seems fractionally higher than before.',
      'Dust falls from the ceiling in a thin curtain — the temple settling.',
    ],
    library: [
      'A clay tablet has shifted in its housing. Whispers rise then subside.',
      'The dust in the air has thickened slightly — more tablets disturbed.',
      'Pages or parchment scraps near the bottom shelf stir in an unfelt draft.',
    ],
    flooded: [
      getFloodState(floodLevel) !== 'dry'
        ? 'The water level has dropped half an inch — or risen. The darkness makes it hard to tell.'
        : 'The drained floor still seeps at the edges. The aquifer is working.',
      'Something knocked against a submerged stone — something alive, or just a current.',
      'A ripple crosses the water surface from the far wall toward you. Nothing visible caused it.',
    ],
    elements: [
      'The elemental shrines breathe their own climates — cool mist from water, warm pressure from fire.',
      solved
        ? 'The gold circuit floor glows faintly even without direct torchlight.'
        : 'The basalt shrine is slightly warmer than when you first entered.',
      'Embers drift upward from the fire basin and do not fall.',
    ],
    sanctum: [
      'The embers in the room continue to rise. The air is warm and still.',
      solved
        ? 'The obsidian eyes catch every light source in the room, doubling it.'
        : "Rudra's shadow on the wall shifts by a fraction — the torch moved, or the statue did.",
      'A low resonance from the walls — like something large breathing slowly.',
    ],
    final: [
      'The violet light pulses once. The room adjusts around the pulse.',
      'Gravity is subtly wrong here. A pebble falls at the wrong angle.',
      'The whisper that has been with you since the entrance is loudest here.',
    ],
  };

  const notes = roomNotes[room];
  if (!notes || notes.length === 0) return null;

  // Deterministic pick based on turn so same turn always picks same note
  const idx = Math.floor(currentTurn / 7) % notes.length;
  const text = notes[idx];

  // Low-torch modifier
  if (brightness === 'dim' || brightness === 'flickering') {
    return {
      text: text + (brightness === 'flickering' ? ' The torch flickers and the detail vanishes.' : ' Your dimming torch makes the edges uncertain.'),
      category: 'observation',
    };
  }
  if (stability < 40) {
    return { text: text + ' A crack widens slightly in the wall.', category: 'event' };
  }

  return { text, category: 'observation' };
}

// ── Ambient events (low-frequency, non-blocking) ─────────────────────────────

export interface AmbientEvent {
  text: string;
  journalWorthy: boolean;
}

/** Returns a random ambient event or null (~1-in-5 chance per call) */
export function getAmbientEvent(state: GameState): AmbientEvent | null {
  const { currentRoomId: room, playerStats, templeStability, currentTurn } = state;
  const fuel = playerStats.torchFuel;
  const stability = templeStability;

  // Low-frequency gate: fire ~20% of the time
  const seed = (currentTurn * 1237 + room.charCodeAt(0) * 31) % 100;
  if (seed > 20) return null;

  const globalAmbient: string[] = [
    'A whisper carries through the stone — not words, just presence.',
    'Distant chanting, faint and rhythmic, rises for a moment then stops.',
    'Pebbles fall from the ceiling in a single small cascade.',
    'The air temperature drops suddenly, then returns to normal.',
    'Your torch flame leans sideways — there is a draft from somewhere unmapped.',
  ];

  const torchEvents: string[] = fuel < 30 ? [
    'The torch gutters hard. You shield it instinctively.',
    'The flame shrinks to almost nothing, then recovers.',
  ] : [];

  const stabilityEvents: string[] = stability < 50 ? [
    'A deep structural groan rolls through the walls.',
    'A thin crack appears in the floor near the wall — fresh.',
    'Dust cascades from the ceiling as something settles.',
  ] : [];

  const roomAmbient: Partial<Record<RoomId, string[]>> = {
    entrance: ['Rain still sounds outside. The sealed gate muffles it perfectly.'],
    guardians: ['One of the sentinels shifts — you hear the stone, though you see nothing move.'],
    echoes: ['The hall produces an echo you did not make. Footsteps, from somewhere.'],
    puzzle: ['The glyph plates pulse once in unison, then go still.'],
    library: ['A clay tablet whispers something that sounds almost like your name.'],
    flooded: ['Something stirs under the water near the far wall.'],
    elements: ['The fire shrine\'s flame bends toward the air shrine without wind.'],
    sanctum: ['The embers rise higher for a moment, as if the room exhaled.'],
    final: ['The violet sphere pulses once — slowly, like a heartbeat.'],
  };

  const pool = [
    ...globalAmbient,
    ...torchEvents,
    ...stabilityEvents,
    ...(roomAmbient[room] ?? []),
  ];

  if (pool.length === 0) return null;
  const pick = pool[seed % pool.length];

  return {
    text: pick,
    journalWorthy: stability < 40 || stabilityEvents.includes(pick),
  };
}

// ── Secret discovery system ───────────────────────────────────────────────────

export interface SecretDiscovery {
  id: string;
  roomId: RoomId;
  /** Observation score threshold required */
  requiredObservation: number;
  /** Command keywords that trigger this discovery */
  triggerKeywords: string[];
  description: string;
  journalText: string;
  /** Item rewarded on discovery, if any */
  rewardItemId?: string;
}

export const SECRET_DISCOVERIES: SecretDiscovery[] = [
  {
    id: 'secret_entrance_carving',
    roomId: 'entrance',
    requiredObservation: 10,
    triggerKeywords: ['look close', 'examine lintel', 'look carefully', 'study entrance', 'inspect carefully'],
    description: 'Beneath the main inscription, nearly invisible, is a third layer of text — carved with a pin, not a chisel. It reads: "The temple is not a place. It is an argument."',
    journalText: '[Entrance] Hidden micro-inscription found beneath main lintel text: "The temple is not a place. It is an argument." Third layer — personal, not ceremonial.',
  },
  {
    id: 'secret_guardian_sigil',
    roomId: 'guardians',
    requiredObservation: 20,
    triggerKeywords: ['examine base', 'inspect base', 'look at base', 'study pedestal', 'look carefully'],
    description: 'The base of the northeast sentinel bears a maker\'s sigil — a hand with an eye in its palm. The same symbol appears in the threshold rubbing. These were made by the same builder.',
    journalText: '[Guardians] Maker\'s sigil on NE sentinel base matches threshold rubbing symbol. Same artisan built both the gate and the guardian system.',
  },
  {
    id: 'secret_echo_frequency',
    roomId: 'echoes',
    requiredObservation: 25,
    triggerKeywords: ['count echoes', 'time echo', 'measure interval', 'study echo', 'listen carefully'],
    description: 'If you count carefully: the echo interval changes when more crystals are active. At three crystals, the interval collapses to zero — the hall no longer echoes, it resonates.',
    journalText: '[Echoes] Echo interval disappears at full crystal activation — hall transitions from echo to resonance. Fundamentally different acoustic state.',
  },
  {
    id: 'secret_library_archive',
    roomId: 'library',
    requiredObservation: 30,
    triggerKeywords: ['read whispers', 'listen to tablets', 'decode whisper', 'translate whisper', 'study clay'],
    description: 'One of the clay tablets whispers something different from the others: "The drainage diagram was broken deliberately. Someone did not want the corridor drained." The whisper repeats, then stops.',
    journalText: '[Library] Clay tablet whispers: "The drainage diagram was broken deliberately." Someone intentionally flooded the corridor and hid the means to drain it.',
  },
  {
    id: 'secret_flooded_mural',
    roomId: 'flooded',
    requiredObservation: 35,
    triggerKeywords: ['examine wall', 'inspect wall', 'study wall', 'look at ceiling', 'look above water'],
    description: 'Above the waterline, the corridor walls carry a painted mural — mostly obscured by water damage, but one panel remains: it shows a figure choosing between two doors, both open.',
    journalText: '[Flooded Corridor] Mural above waterline visible: figure at two open doors. Painted before the flooding. Both choices shown as valid.',
  },
  {
    id: 'secret_elements_inscription',
    roomId: 'elements',
    requiredObservation: 35,
    triggerKeywords: ['study floor carefully', 'read floor inscription', 'look beneath shrines', 'inspect inlay closely'],
    description: 'The gold floor inlay, read as text rather than circuit, spells a fifth element not represented by the shrines: Consciousness. The circuit is not the end — it is the gate.',
    journalText: '[Elements] Gold inlay reads as text: a fifth element — Consciousness — implied but unrepresented. The circuit is a gate, not a destination.',
  },
  {
    id: 'secret_sanctum_eye',
    roomId: 'sanctum',
    requiredObservation: 40,
    triggerKeywords: ['study statue closely', 'examine eyes', 'look at eyes', 'inspect face', 'study face'],
    description: 'The obsidian eyes of the Rudra statue are not carved — they are set. Two separate spheres of black glass, each one containing a perfect miniature of the room you are standing in.',
    journalText: '[Sanctum] Rudra\'s eyes are set glass spheres, not carved — each contains a perfect room miniature. The statue has always seen everything in this chamber.',
  },
];

/** Returns secret discoveries available in the current room given player observation score */
export function getAvailableSecrets(state: GameState): SecretDiscovery[] {
  const { currentRoomId, playerStats, templeMemory } = state;
  const obs = playerStats.observationScore;
  return SECRET_DISCOVERIES.filter(
    (s) =>
      s.roomId === currentRoomId &&
      obs >= s.requiredObservation &&
      !templeMemory.hiddenDiscoveries.includes(s.id),
  );
}

/** Check if a command triggers any available secret */
export function checkSecretTrigger(
  state: GameState,
  cmd: string,
): SecretDiscovery | null {
  const available = getAvailableSecrets(state);
  return available.find((s) =>
    s.triggerKeywords.some((kw) => cmd.includes(kw)),
  ) ?? null;
}

// ── World state update helpers ────────────────────────────────────────────────

/** Clamp a value between min and max */
function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Apply a stability delta to GameState fields.
 * Returns updated partial state.
 */
export function applyStabilityDelta(
  state: GameState,
  actionKey: string,
): Partial<GameState> {
  const delta = getStabilityDelta(actionKey);
  if (delta === 0) return {};
  const newStability = clamp(state.templeStability + delta);
  const willCollapse = newStability <= 15;
  return {
    templeStability: newStability,
    isCollapsing: willCollapse,
    templePhase: newStability > 60 ? 1 : newStability > 30 ? 2 : 3,
  };
}

/**
 * Compute torch fuel decay for a turn.
 * Faster in dark / wet rooms.
 */
export function computeTorchDecay(state: GameState): number {
  const { currentRoomId, playerStats } = state;
  const base = 1;
  const wetRooms: RoomId[] = ['flooded', 'echoes'];
  const bonus = wetRooms.includes(currentRoomId) ? 1 : 0;
  return Math.min(base + bonus, playerStats.torchFuel);
}

/**
 * Build a world-state status string for narration injection.
 * Used to prefix look-around responses with environmental context.
 */
export function buildWorldStatusPrefix(state: GameState): string {
  const { playerStats, templeStability, floodLevel, currentRoomId } = state;
  const lines: string[] = [];

  const brightness = getTorchBrightness(playerStats.torchFuel);
  if (brightness === 'dim') lines.push('Your torch is dim — the room\'s edges are shadows.');
  if (brightness === 'flickering') lines.push('The torch flickers badly. Details come and go.');
  if (brightness === 'out') lines.push('Your torch is out. Darkness is total.');

  if (currentRoomId === 'flooded') {
    const floodNote = getFloodMovementNote(floodLevel);
    if (floodNote) lines.push(floodNote);
  }

  const stability = getStabilityState(templeStability);
  if (stability === 'unstable') lines.push('The temple structure groans periodically.');
  if (stability === 'critical') lines.push('The temple is deteriorating. Fresh cracks line the walls.');
  if (stability === 'collapsing') lines.push('WARNING: The temple is actively collapsing. Debris falls.');

  return lines.length > 0 ? lines.join(' ') + '\n\n' : '';
}
