/**
 * commandEngine.ts
 * Processes every player command and returns a CommandResult.
 * No state is mutated here — callers apply the result.
 */
import { GameState, CommandResult, RoomId, JournalCategory } from '../types';
import { getItem } from './gameItems';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasItem(state: GameState, id: string): boolean {
  return state.inventory.some((i) => i.id === id);
}

function taskDone(state: GameState, roomId: RoomId, taskId: string): boolean {
  return state.objectives[roomId]?.tasks.find((t) => t.id === taskId)?.completed ?? false;
}

function actionDone(state: GameState, actionId: string): boolean {
  return state.completedActions.includes(actionId);
}

function roomSolved(state: GameState, roomId: RoomId): boolean {
  return state.roomFlags[roomId]?.puzzleSolved ?? false;
}

function journal(text: string, category: JournalCategory = 'observation') {
  return { text, category };
}

function ok(
  narration: string,
  opts: Partial<Omit<CommandResult, 'narration'>> = {},
): CommandResult {
  return { narration, stateUpdate: null, ...opts };
}

// ── Room sequence (for movement) ──────────────────────────────────────────────
const ROOM_SEQUENCE: RoomId[] = [
  'entrance', 'guardians', 'echoes', 'puzzle',
  'library', 'flooded', 'elements', 'sanctum', 'final',
];

const MOVEMENT_WORDS = [
  'move', 'wade', 'pass', 'go ', 'forward', 'north',
  'east', 'down', 'inward', 'deeper', 'enter', 'push',
];

function isMovementCommand(cmd: string): boolean {
  return MOVEMENT_WORDS.some((w) => cmd.includes(w));
}

// ── Inventory command ─────────────────────────────────────────────────────────
function handleInventory(state: GameState): CommandResult {
  if (state.inventory.length === 0) {
    return ok('Your pack is empty. The weight of nothing is surprisingly heavy.');
  }
  const lines = state.inventory.map(
    (i) => `• ${i.name}${i.condition ? ` [${i.condition}]` : ''} — ${i.description}`,
  );
  return ok(`Carrying ${state.inventory.length} item${state.inventory.length !== 1 ? 's' : ''}:\n${lines.join('\n')}`);
}

// ── Examine item ──────────────────────────────────────────────────────────────
function handleExamine(state: GameState, target: string): CommandResult {
  const item = state.inventory.find(
    (i) => i.name.toLowerCase().includes(target) || i.id.toLowerCase().includes(target),
  );
  if (item) {
    return ok(item.inspectionText, {
      stateUpdate: {
        playerStats: {
          ...state.playerStats,
          observationScore: Math.min(100, state.playerStats.observationScore + 3),
        },
      },
    });
  }
  return ok(`You search your surroundings for "${target}". Ancient stonework stares back without comment.`);
}

// ── Use item ──────────────────────────────────────────────────────────────────
function handleUse(state: GameState, target: string): CommandResult {
  if (target.includes('torch') || target.includes('ancient torch')) {
    return ok(
      `You raise the Ancient Torch. Its light finds stone faces in the walls you hadn't noticed — watchers carved shallow, present for a thousand years.`,
    );
  }
  if (target.includes('map') || target.includes('temple map')) {
    return ok(
      `You unfold the Temple Map. Your current position is roughly marked with a pencil cross. Three rooms ahead, the cartographer's notes end in a smear. Whatever they saw stopped the pen.`,
    );
  }
  if (target.includes('compass')) {
    const roomIdx = ROOM_SEQUENCE.indexOf(state.currentRoomId);
    return ok(
      `The compass needle oscillates, then locks. It points not north but inward — toward something deeper at chamber ${roomIdx + 1} of 9. The deeper you go, the more certain it becomes.`,
    );
  }
  if (target.includes('journal') || target.includes('field journal')) {
    const lastEntries = state.journal.slice(-3);
    const lines = lastEntries.map((j) => `• ${j.text}`).join('\n');
    return ok(`Field Journal — last entries:\n${lines}`);
  }
  if (target.includes('oil flask')) {
    if (!hasItem(state, 'oil_flask')) {
      return ok('You reach for the Oil Flask but your pack is empty of it.');
    }
    return ok(
      'You tip the Oil Flask against the torch bracket. The flame blooms larger and brighter, the resin hiss sharp and clean. Torch fuel extended.',
      {
        itemsRemoved: ['oil_flask'],
        stateUpdate: {
          playerStats: {
            ...state.playerStats,
            torchFuel: Math.min(100, state.playerStats.torchFuel + 25),
          },
        },
        journalEntry: journal('Refuelled the torch with ritual sesame oil. Burns cleaner than expected.'),
      },
    );
  }
  if (target.includes('stone tablet')) {
    return ok(
      'You study the Stone Tablet. The Proto-Shaiva fragment reads: "...the guardian does not sleep. It merely agrees not to notice." A chill that has nothing to do with temperature.',
      { stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 5) } } },
    );
  }
  const item = state.inventory.find((i) => i.name.toLowerCase().includes(target) || i.id.includes(target));
  if (!item) return ok(`You don't have "${target}".`);
  if (!item.usable) return ok(`The ${item.name} can be examined but not used directly here.`);
  return ok(`You attempt to use the ${item.name}. The temple acknowledges the gesture without reaction.`);
}

// ── ENTRANCE ──────────────────────────────────────────────────────────────────
function handleEntrance(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look') || cmd.includes('observe')) {
    return ok(
      'Cold rain glimmers on the twin stone lion sentinels. Their manes are thick with vine, but the carving beneath is immaculate — the sculptor worked in dry conditions. The gate is basalt, not granite. Someone brought this stone a long way.',
      {
        stateUpdate: { playerStats: { ...state.playerStats, curiosityScore: Math.min(100, state.playerStats.curiosityScore + 5) } },
      },
    );
  }

  if (cmd.includes('inspect symbol') || (cmd.includes('inspect') && actionDone(state, 'entrance_read_inscription'))) {
    return ok(
      'Above the inscription, barely visible, is a second text in a different hand — smaller, more urgent. It reads: "This door opened once before. Whoever lit the brazier did not come back." Below that, someone scratched a single word: "Worth it."',
      {
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 8) } },
        journalEntry: journal('Found a second inscription above the lintel. A previous explorer left a final note: "Worth it."', 'discovery'),
      },
    );
  }

  if (cmd.includes('inspect doors') || cmd.includes('inspect door') || (cmd.includes('inspect') && !actionDone(state, 'entrance_read_inscription'))) {
    return ok(
      'You examine the basalt gate. Deep counterweight channels run into the masonry above — this door is held by a thermal lock, not a physical bar. Heat on the correct point releases the weight. The brazier bracket beside the door is cold and dry.',
      {
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 5) } },
        objectiveUpdates: [{ roomId: 'entrance', taskIndex: 0 }],
      },
    );
  }

  if (cmd.includes('read inscription') || cmd.includes('read') || cmd.includes('inscription') || cmd.includes('lintel')) {
    if (actionDone(state, 'entrance_read_inscription')) {
      return ok('You have already committed the inscription to memory: "Bring warmth to the cold stone; only light may unbolt the eternal threshold."');
    }
    return ok(
      'The lintel script flares faint gold when your torch passes close. You translate: "Bring warmth to the cold stone; only light may unbolt the eternal threshold." The words seem carved recently — but the stone beneath is ancient.',
      {
        completedActionId: 'entrance_read_inscription',
        objectiveUpdates: [{ roomId: 'entrance', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 10) } },
        journalEntry: journal('Lintel inscription translated: "Bring warmth to the cold stone; only light may unbolt the eternal threshold."', 'lore'),
        audioEvent: 'click',
      },
    );
  }

  if (cmd.includes('light brazier') || cmd.includes('brazier') || cmd.includes('light') || cmd.includes('fire')) {
    if (roomSolved(state, 'entrance')) {
      return ok('The brazier is already lit. The gate stands open.');
    }
    const newFlags = { ...state.roomFlags.entrance, puzzleSolved: true };
    return ok(
      'You hold the Ancient Torch to the dry iron bracket. Oil-soaked tallow catches in a single second — golden fire leaps across the brazier. A deep mechanical thud shakes the floor as counterweights the size of millstones disengage. The lion doors swing open with a breath of cold air from inside.',
      {
        completedActionId: 'entrance_light_brazier',
        objectiveUpdates: [{ roomId: 'entrance', taskIndex: 1 }, { roomId: 'entrance', taskIndex: 2 }],
        unlockRoom: 'guardians',
        stateUpdate: {
          roomFlags: { ...state.roomFlags, entrance: newFlags },
          playerStats: { ...state.playerStats, templeFavor: 'Watched', torchFuel: Math.max(0, state.playerStats.torchFuel - 5) },
        },
        journalEntry: journal('Lit the threshold brazier. Counterweights disengaged the gate seal. The Hall of Guardians lies ahead.', 'event'),
        audioEvent: 'stone',
      },
    );
  }

  if (cmd.includes('push doors') || cmd.includes('push door')) {
    if (!roomSolved(state, 'entrance')) {
      return ok('The doors do not yield. The basalt is solid and the thermal lock is still engaged. You need to light the brazier first.');
    }
    return ok('The doors are already open, held by the brazier heat. The Hall of Guardians waits.');
  }

  if (cmd.includes('ask explorer guide') || cmd.includes('ask guide') || cmd.includes('guide')) {
    if (!roomSolved(state, 'entrance')) {
      return ok('Guide\'s Note: "The inscription mentions warmth. That iron bracket beside the gate is a brazier — it\'s designed to hold a torch. Light it and the thermal lock should disengage."');
    }
    return ok('Guide\'s Note: "The gate is open. You can proceed into the Hall of Guardians whenever you\'re ready."');
  }

  if (cmd.includes('ask temple')) {
    return ok('"Only those who bear light into the dark shall pass through Rudra\'s gate." — the words drift from the stone like heat.');
  }

  return null as unknown as CommandResult;
}

// ── HALL OF GUARDIANS ─────────────────────────────────────────────────────────
function handleGuardians(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look')) {
    return ok(
      'Pale cobalt light falls from a ceiling fracture onto copper-inlaid floor channels. The channels trace a pattern — not decorative, but instructional. Something must align with something.',
      { stateUpdate: { playerStats: { ...state.playerStats, curiosityScore: Math.min(100, state.playerStats.curiosityScore + 5) } } },
    );
  }

  if (cmd.includes('inspect statues') || cmd.includes('inspect statue') || (cmd.includes('inspect') && !cmd.includes('carving'))) {
    return ok(
      'Four sentinels, each carved from a single vein of volcanic black stone. Their quartz crystal eyes catch torchlight and redirect it along cardinal axes — each toward a different compass point. Their posture is identical but their facing diverges. Someone rotated them.',
      {
        objectiveUpdates: [{ roomId: 'guardians', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 8) } },
      },
    );
  }

  if (cmd.includes('read carvings') || cmd.includes('read carving') || (cmd.includes('read') && !actionDone(state, 'guardians_read_carvings'))) {
    return ok(
      'The pedestal carvings read: "When the four sentinels turn their gaze inward to the central altar, the path shall open without sound." Below that, in a different script: "Do not look at their faces when they move."',
      {
        completedActionId: 'guardians_read_carvings',
        objectiveUpdates: [{ roomId: 'guardians', taskIndex: 0 }, { roomId: 'guardians', taskIndex: 1 }],
        journalEntry: journal('"When the four sentinels turn inward to the altar, the path opens." Rotate all four to face the centre.', 'lore'),
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 10) } },
      },
    );
  }

  if (cmd.includes('rotate statue') || cmd.includes('rotate') || cmd.includes('turn statue') || cmd.includes('align')) {
    if (roomSolved(state, 'guardians')) {
      return ok('The sentinels are already aligned inward. The northern archway stands open.');
    }
    const newFlags = { ...state.roomFlags.guardians, puzzleSolved: true };
    return ok(
      'You grip the first sentinel\'s shoulders and rotate it inward. Cold stone grinds on hidden bearings — far smoother than it should be. One by one you turn each guardian to face the central altar. A counterweight pin disengages beneath the floor with a clean click. The northern archway unseals.',
      {
        completedActionId: 'guardians_rotated',
        objectiveUpdates: [{ roomId: 'guardians', taskIndex: 1 }, { roomId: 'guardians', taskIndex: 2 }],
        itemsAdded: ['threshold_rubbing'],
        unlockRoom: 'echoes',
        stateUpdate: { roomFlags: { ...state.roomFlags, guardians: newFlags }, playerStats: { ...state.playerStats, patienceScore: Math.min(100, state.playerStats.patienceScore + 10) } },
        journalEntry: journal('Rotated all four sentinels inward. The floor pin disengaged — passage north is open.', 'event'),
        audioEvent: 'stone',
      },
    );
  }

  if (cmd.includes('ask temple')) {
    return ok('"The sentinels watch those who rush. They have stood here longer than patience has a name."');
  }

  if (cmd.includes('ask guide') || cmd.includes('ask explorer guide') || cmd.includes('guide')) {
    if (!actionDone(state, 'guardians_read_carvings')) {
      return ok('Guide\'s Note: "Read the pedestal carvings first — they describe exactly what to do here."');
    }
    return ok('Guide\'s Note: "Rotate all four statues so they face the central altar. The inscriptions confirmed it."');
  }

  return null as unknown as CommandResult;
}

// ── HALL OF ECHOES ────────────────────────────────────────────────────────────
function handleEchoes(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look')) {
    return ok(
      'Reflective damp stone walls mirror your torchlight in twin images. The second image is always half a second behind. The bronze resonance mechanism at the centre of the hall rotates slightly — or maybe you imagined it.',
    );
  }

  if (cmd.includes('inspect mechanism') || cmd.includes('inspect')) {
    return ok(
      'A bronze and slate acoustic wheel on a magnetic counter-spindle. The mechanism is designed to be tuned — small bronze fins can be angled to specific frequencies. The central orb sits in a cradle waiting for contact.',
      {
        objectiveUpdates: [{ roomId: 'echoes', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 8) } },
      },
    );
  }

  if (cmd.includes('read niches') || cmd.includes('read')) {
    return ok(
      'The alcove carvings describe eight frequencies of sacred sound. The seventh — 432Hz — is marked with a flame glyph. The text reads: "Match the breath of the mountain and the door remembers how to open."',
      {
        objectiveUpdates: [{ roomId: 'echoes', taskIndex: 1 }],
        journalEntry: journal('"Match the seventh frequency — 432Hz. The mountain\'s own breath."', 'lore'),
      },
    );
  }

  if (cmd.includes('listen carefully') || cmd.includes('listen') || cmd.includes('hear')) {
    if (actionDone(state, 'echoes_listened')) {
      return ok('You already measured it: a 1.5-second echo delay at 432Hz. The hall pulses with it if you hold still.');
    }
    return ok(
      'You hold your breath. The hall answers your last footstep — 1.5 seconds later, exactly. Not random reverb. A single clean note: 432Hz. The mechanism is waiting for that precise frequency.',
      {
        completedActionId: 'echoes_listened',
        objectiveUpdates: [{ roomId: 'echoes', taskIndex: 1 }],
        journalEntry: journal('Echo interval: 1.5 seconds at 432Hz. This is the resonance the mechanism requires.', 'observation'),
        stateUpdate: { playerStats: { ...state.playerStats, patienceScore: Math.min(100, state.playerStats.patienceScore + 10) } },
      },
    );
  }

  if (cmd.includes('touch orb') || cmd.includes('touch') || cmd.includes('attune') || cmd.includes('orb')) {
    if (roomSolved(state, 'echoes')) {
      return ok('The orb still hums at 432Hz. The eastern door remains open.');
    }
    const newFlags = { ...state.roomFlags.echoes, puzzleSolved: true };
    return ok(
      'You press your palm to the central orb. It vibrates against your hand — searching. You hum the 432Hz tone you heard in the echo. The orb locks onto it, resonance climbing through the mechanism. A bell-like chime reverberates through the stone and the eastern door unseals.',
      {
        completedActionId: 'echoes_attuned',
        objectiveUpdates: [{ roomId: 'echoes', taskIndex: 2 }],
        itemsAdded: ['resonance_shard'],
        unlockRoom: 'puzzle',
        stateUpdate: { roomFlags: { ...state.roomFlags, echoes: newFlags }, playerStats: { ...state.playerStats, templeFavor: 'Curious' } },
        journalEntry: journal('Attuned the resonance orb at 432Hz. The eastern passage is open. A crystal shard broke free from the mechanism.', 'event'),
        audioEvent: 'bell',
      },
    );
  }

  if (cmd.includes('ask guide') || cmd.includes('ask explorer guide') || cmd.includes('guide')) {
    if (!actionDone(state, 'echoes_listened')) {
      return ok('Guide\'s Note: "Listen first — stand still and let the echo tell you its frequency. Then match it on the orb."');
    }
    return ok('Guide\'s Note: "You measured 432Hz. Touch the orb and try to match that tone — hum it, feel it in your chest."');
  }

  if (cmd.includes('ask temple')) {
    return ok('"Harmony yields passage where force achieves nothing. The mountain breathes at 432."');
  }

  return null as unknown as CommandResult;
}

// ── PUZZLE CHAMBER ────────────────────────────────────────────────────────────
function handlePuzzle(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look')) {
    return ok(
      'Carved stone serpents coil around the perimeter walls. The five glyph plates pulse with faint bioluminescence. Each wrong rotation dims one wall torch — three are already dark.',
    );
  }

  if (cmd.includes('inspect plates') || cmd.includes('inspect')) {
    return ok(
      'Five stone plates sit in a cross pattern. Each engraved with a glowing Sanskrit glyph — four are labelled, one is left deliberately blank. The blank plate sits at position five.',
      {
        objectiveUpdates: [{ roomId: 'puzzle', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 8) } },
      },
    );
  }

  if (cmd.includes('read symbols') || cmd.includes('read symbol') || cmd.includes('read')) {
    return ok(
      'The four labelled plates read: Srishti (Creation), Sthiti (Preservation), Samhara (Dissolution), and — partially worn — what looks like Anugraha (Grace). The fifth plate is blank. A separate inscription warns: "The blank plate is the unspeakable syllable. Leave it untouched."',
      {
        completedActionId: 'puzzle_read_symbols',
        objectiveUpdates: [{ roomId: 'puzzle', taskIndex: 1 }],
        journalEntry: journal('"Cosmic sequence: Creation → Preservation → Dissolution. The blank plate — the unspeakable syllable — stays put."', 'lore'),
      },
    );
  }

  if (cmd.includes('rotate plate') || cmd.includes('rotate') || cmd.includes('align plate')) {
    if (roomSolved(state, 'puzzle')) {
      return ok('The plates are already aligned in cosmic sequence. The staircase to the Library lies below.');
    }
    const newFlags = { ...state.roomFlags.puzzle, puzzleSolved: true };
    return ok(
      'You rotate the plates into sacred cosmic sequence: Creation → Preservation → Dissolution, leaving the blank plate untouched. Each correct rotation produces a resonant tone. On the final click, massive floor gears engage — a section of floor slides aside revealing stone steps descending to the Library of Whispers.',
      {
        completedActionId: 'puzzle_solved',
        objectiveUpdates: [{ roomId: 'puzzle', taskIndex: 2 }],
        itemsAdded: ['glyph_rubbing'],
        unlockRoom: 'library',
        stateUpdate: { roomFlags: { ...state.roomFlags, puzzle: newFlags }, playerStats: { ...state.playerStats, integrityScore: Math.min(100, state.playerStats.integrityScore + 10) } },
        journalEntry: journal('Aligned glyph plates: Creation → Preservation → Dissolution. Blank plate untouched. Library staircase unsealed.', 'event'),
        audioEvent: 'stone',
      },
    );
  }

  if (cmd.includes('reset puzzle') || cmd.includes('reset')) {
    return ok(
      'You pull the counterweight reset lever on the wall. The floor plates grind back to their neutral positions. A wall torch relights. The room is patient.',
      { audioEvent: 'stone' },
    );
  }

  if (cmd.includes('ask temple')) {
    return ok('"The word of power requires Dissolution before Grace. The blank syllable is the pivot."');
  }

  if (cmd.includes('ask guide') || cmd.includes('ask explorer guide') || cmd.includes('guide')) {
    if (!actionDone(state, 'puzzle_read_symbols')) {
      return ok('Guide\'s Note: "Read the symbols on the plates first — the sequence is written into them."');
    }
    return ok('Guide\'s Note: "Creation, Preservation, Dissolution — in that order. The blank plate doesn\'t move. Don\'t touch it."');
  }

  return null as unknown as CommandResult;
}

// ── LIBRARY OF WHISPERS ───────────────────────────────────────────────────────
function handleLibrary(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look')) {
    return ok(
      'Cold azure light drifts through high stone fractures. Thousands of baked clay and slate tablets stack into the dark. The whispering is not imagination — it is many voices speaking simultaneously in a language slightly too old to resolve.',
    );
  }

  if (cmd.includes('inspect tablets') || cmd.includes('inspect')) {
    return ok(
      'Baked clay tablets cover one wall; heavier slate tablets cover another. The clay ones whisper. The slate ones are silent. The drainage tablet you need is slate — it won\'t mislead you.',
      {
        objectiveUpdates: [{ roomId: 'library', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 8) } },
      },
    );
  }

  if (cmd.includes('read scroll') || cmd.includes('read tablet') || cmd.includes('read')) {
    return ok(
      'The scroll you extract describes the lower drainage system in meticulous engineer\'s notation: "The first valve floods the hall. The second valve locks the outer gate. The third valve redirects reservoir water to the deep aquifer and drains the passage." The third valve is marked with a fish symbol.',
      {
        completedActionId: 'library_read_scroll',
        objectiveUpdates: [{ roomId: 'library', taskIndex: 1 }],
        journalEntry: journal('"Third sluice valve — marked with a fish — drains the passage to the aquifer. Do not touch valves one or two."', 'lore'),
      },
    );
  }

  if (cmd.includes('take tablet') || cmd.includes('take drainage') || cmd.includes('grab tablet')) {
    if (hasItem(state, 'drainage_tablet')) {
      return ok('You already have the Drainage Tablet in your pack.');
    }
    return ok(
      'You locate the heavy slate Drainage Tablet in the third stack — silent among the whispering clay. The moment you lift it, a counterweight somewhere below the floor disengages. Stone steps grind open behind the shelving unit, revealing a passage down to the Flooded Corridor.',
      {
        completedActionId: 'library_took_tablet',
        objectiveUpdates: [{ roomId: 'library', taskIndex: 2 }],
        itemsAdded: ['drainage_tablet'],
        unlockRoom: 'flooded',
        stateUpdate: { roomFlags: { ...state.roomFlags, library: { ...state.roomFlags.library, puzzleSolved: true } } },
        journalEntry: journal('Retrieved the Drainage Tablet from the third stack. Passage down to the Flooded Corridor is now open.', 'event'),
        audioEvent: 'stone',
      },
    );
  }

  if (cmd.includes('examine drainage tablet') || (cmd.includes('examine') && cmd.includes('tablet'))) {
    const item = state.inventory.find((i) => i.id === 'drainage_tablet');
    if (item) return ok(item.inspectionText);
    return ok('You don\'t have the Drainage Tablet yet.');
  }

  if (cmd.includes('ask guide') || cmd.includes('ask explorer guide') || cmd.includes('guide')) {
    return ok('Guide\'s Note: "Slate tablets are silent, clay tablets whisper. The Drainage Tablet is slate — look for the heavy silent ones in the third stack."');
  }

  if (cmd.includes('ask temple')) {
    return ok('"Truth rests quietly amidst a thousand whispering falsehoods."');
  }

  return null as unknown as CommandResult;
}

// ── FLOODED CORRIDOR ──────────────────────────────────────────────────────────
function handleFlooded(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look')) {
    return ok(
      'Bioluminescent moss on the ceiling throws a cyan glow across the black water surface. The reflection lag is still present here — your torch doubles in the water, one flame a half-second behind the other.',
    );
  }

  if (cmd.includes('inspect sluices') || cmd.includes('inspect')) {
    return ok(
      'Three bronze sluice valve wheels protrude from the upper masonry wall. The first has claw marks on its face — from the inside. The second is fused with mineral deposit. The third has a fish-symbol socket beside it. That\'s the one.',
      {
        objectiveUpdates: [{ roomId: 'flooded', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 8) } },
      },
    );
  }

  if (cmd.includes('probe water') || cmd.includes('probe')) {
    return ok(
      'You extend the rope into the dark water. Submerged stone steps descend two feet, level off, then lead toward the valve wall. Safe to wade if you go slow. The water is cold enough that your ankle aches immediately.',
      {
        completedActionId: 'flooded_probed',
        objectiveUpdates: [{ roomId: 'flooded', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, patienceScore: Math.min(100, state.playerStats.patienceScore + 8) } },
        journalEntry: journal('Probed the flood depth — two feet at most. Submerged steps lead to the valve wall.', 'observation'),
      },
    );
  }

  if (cmd.includes('read markings') || cmd.includes('read')) {
    return ok(
      'Bronze glyphs above the valves: "First valve: the flood remembers its origin. Second valve: the gate remembers its lock. Third valve: the aquifer remembers its thirst." The third valve is the drain.',
      {
        completedActionId: 'flooded_read_markings',
        objectiveUpdates: [{ roomId: 'flooded', taskIndex: 1 }],
        journalEntry: journal('"Third valve drains to the aquifer." Confirms the Drainage Tablet diagram.', 'observation'),
      },
    );
  }

  if (cmd.includes('open sluice') || cmd.includes('open valve') || cmd.includes('drain') || cmd.includes('sluice')) {
    if (roomSolved(state, 'flooded')) {
      return ok('The corridor is already drained. The path to the Chamber of Elements is clear.');
    }
    if (!hasItem(state, 'drainage_tablet') && !hasItem(state, 'bronze_fish')) {
      return ok('You reach for the third valve but hesitate — without the diagram and the correct tool, you risk opening the wrong one. Study the Drainage Tablet and find the Bronze Fish key first.');
    }
    if (!hasItem(state, 'drainage_tablet')) {
      return ok('You can see the third valve but the fish-symbol socket needs a specific key. The Drainage Tablet from the Library might have more detail.');
    }
    if (!hasItem(state, 'bronze_fish')) {
      return ok('The third valve has a fish-symbol socket. Your tools don\'t fit it. There must be a purpose-made key somewhere in this corridor.');
    }
    const newFlags = { ...state.roomFlags.flooded, puzzleSolved: true };
    return ok(
      'You insert the Bronze Fish key into the fish-symbol socket beside the third valve and turn. The mechanism is precise — engineered to exact torque. The valve opens with a resonant click. Water roars down the deep aquifer drain. In under a minute the corridor floor is bare and the passage to the Chamber of Elements stands revealed.',
      {
        completedActionId: 'flooded_drained',
        objectiveUpdates: [{ roomId: 'flooded', taskIndex: 2 }],
        unlockRoom: 'elements',
        stateUpdate: { roomFlags: { ...state.roomFlags, flooded: newFlags }, playerStats: { ...state.playerStats, templeFavor: 'Favored', floodLevel: 0 } as any },
        journalEntry: journal('Opened the third sluice with the Bronze Fish key. Corridor drained. Chamber of Elements accessible.', 'event'),
        audioEvent: 'stone',
      },
    );
  }

  if (cmd.includes('ask guide') || cmd.includes('ask explorer guide') || cmd.includes('guide')) {
    if (!hasItem(state, 'drainage_tablet')) {
      return ok('Guide\'s Note: "Go back to the Library — the Drainage Tablet has a diagram showing exactly which valve to open."');
    }
    if (!hasItem(state, 'bronze_fish')) {
      return ok('Guide\'s Note: "The third valve needs a fish-shaped key. Look around the corridor — it should be somewhere nearby."');
    }
    return ok('Guide\'s Note: "You have everything you need. Use the Bronze Fish key on the third valve socket."');
  }

  if (cmd.includes('ask temple')) {
    return ok('"Water obeys the vessel that understands its channel. The third mouth leads home."');
  }

  return null as unknown as CommandResult;
}

// ── CHAMBER OF ELEMENTS ───────────────────────────────────────────────────────
function handleElements(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look')) {
    return ok(
      'Four shrines breathe their own microweather: embers, mist, a tiny dust devil, a slow cold draft from nowhere. The gold inlay on the floor connects them in an unbroken circuit.',
    );
  }

  if (cmd.includes('inspect shrines') || cmd.includes('inspect')) {
    return ok(
      'Basalt (earth), aquamarine (water), obsidian (fire), pumice (air) — each shrine holds a shallow stone basin and a carved deity face. The basalt shrine is slightly warmer than the others, as if it was lit last and not quite cooled.',
      {
        objectiveUpdates: [{ roomId: 'elements', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 8) } },
      },
    );
  }

  if (cmd.includes('read ritual') || cmd.includes('read')) {
    return ok(
      'The floor inlay inscription reads: "Earth holds. Water carries. Fire changes. Air remains. Kindle them in their nature and the circle completes." Beneath that: "Earth first. Always earth first. Earth is the foundation of all that follows."',
      {
        completedActionId: 'elements_read_ritual',
        objectiveUpdates: [{ roomId: 'elements', taskIndex: 1 }],
        journalEntry: journal('"Elemental order: Earth → Water → Fire → Air. Earth is always first."', 'lore'),
      },
    );
  }

  if (cmd.includes('rotate basin') || cmd.includes('rotate')) {
    return ok(
      'You rotate the water shrine\'s bronze basin. It clicks to a new position, angling toward the next shrine in sequence. Something in the floor circuit shifts — a faint hum.',
      { stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 3) } } },
    );
  }

  if (cmd.includes('kindle shrine') || cmd.includes('kindle') || cmd.includes('light shrine')) {
    if (roomSolved(state, 'elements')) {
      return ok('All four shrines are lit. The sanctum gates stand open.');
    }
    const hasVessel = hasItem(state, 'ember_vessel');
    if (!hasVessel && !hasItem(state, 'ancient_torch')) {
      return ok('You need a vessel to carry the ritual fire from shrine to shrine in the correct sequence.');
    }
    const newFlags = { ...state.roomFlags.elements, puzzleSolved: true };
    return ok(
      'You kindle the Earth shrine first — the basalt basin catches flame from your torch. Earth to Water: the mist shrine ignites cold-blue. Water to Fire: the obsidian basin erupts amber. Fire to Air: the pumice shrine breathes a thin clear flame that bends toward no draft. The gold inlay circuit completes. Energy arcs across the floor and the sanctum gates swing inward.',
      {
        completedActionId: 'elements_kindled',
        objectiveUpdates: [{ roomId: 'elements', taskIndex: 2 }],
        itemsAdded: ['ember_vessel'],
        unlockRoom: 'sanctum',
        stateUpdate: { roomFlags: { ...state.roomFlags, elements: newFlags }, playerStats: { ...state.playerStats, templeFavor: 'Recognised' } },
        journalEntry: journal('Kindled shrines: Earth → Water → Fire → Air. Sanctum gates open. Collected the Ember Vessel.', 'event'),
        audioEvent: 'bell',
      },
    );
  }

  if (cmd.includes('ask guide') || cmd.includes('ask explorer guide') || cmd.includes('guide')) {
    if (!actionDone(state, 'elements_read_ritual')) {
      return ok('Guide\'s Note: "Read the floor inscription first — the sequence is written there."');
    }
    return ok('Guide\'s Note: "Earth first, then Water, then Fire, then Air. Use your torch to kindle the basalt shrine and work around the circle."');
  }

  if (cmd.includes('ask temple')) {
    return ok('"Master the four before entering the presence of the one."');
  }

  return null as unknown as CommandResult;
}

// ── SANCTUM OF RUDRA ──────────────────────────────────────────────────────────
function handleSanctum(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look')) {
    return ok('Golden embers drift upward instead of down. The dome above is lost in darkness. The ring of gold inlay at your feet pulses faintly with each step — the floor is alive, or something beneath it is.');
  }

  if (cmd.includes('inspect statue') || cmd.includes('inspect')) {
    return ok(
      'A twenty-foot obsidian icon of Rudra. Eight arms, each holding a different symbol: trident, flame, drum, lotus, skull, serpent, bow, and one empty hand — palm outward. The empty hand faces you.',
      {
        objectiveUpdates: [{ roomId: 'sanctum', taskIndex: 0 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 10) } },
      },
    );
  }

  if (cmd.includes('read inscription') || cmd.includes('read')) {
    return ok(
      'The pedestal reads: "Offer that which you have gathered without greed, and receive eternal vision. Offer that which you have gathered with greed, and receive eternal silence." Below that, someone scratched in charcoal: "Leave the Ember Vessel. It belongs here."',
      {
        completedActionId: 'sanctum_read_inscription',
        objectiveUpdates: [{ roomId: 'sanctum', taskIndex: 1 }],
        journalEntry: journal('"Offer without greed — receive vision. Offer with greed — receive silence." The Ember Vessel may be the key.', 'teaching'),
      },
    );
  }

  if (cmd.includes('make offering') || cmd.includes('offer')) {
    if (roomSolved(state, 'sanctum')) {
      return ok('The offering was made. The core chamber lies ahead.');
    }
    const relics = state.inventory.filter((i) => i.category === 'relic');
    if (relics.length === 0) {
      return ok('You step forward but your hands are empty of sacred things. Rudra\'s open palm waits. You need to gather relics from the temple before this offering will be accepted.');
    }
    const offered = relics.map((r) => r.name).join(', ');
    const newFlags = { ...state.roomFlags.sanctum, puzzleSolved: true };
    const removedIds = relics.map((r) => r.id);
    return ok(
      `You place the ${offered} at the foot of the statue. The obsidian eyes open — not metaphorically. They open, and light falls from them in two columns of gold. The empty palm lowers. Beneath your feet the gold inlay floods with light and a section of floor slides aside, revealing the passage to the Final Chamber.`,
      {
        completedActionId: 'sanctum_offered',
        objectiveUpdates: [{ roomId: 'sanctum', taskIndex: 2 }],
        itemsRemoved: removedIds,
        unlockRoom: 'final',
        stateUpdate: { roomFlags: { ...state.roomFlags, sanctum: newFlags }, playerStats: { ...state.playerStats, templeFavor: 'Chosen', integrityScore: Math.min(100, state.playerStats.integrityScore + 15) } },
        journalEntry: journal(`Offered ${offered} at Rudra's feet. The Final Chamber is unsealed.`, 'event'),
        audioEvent: 'bell',
      },
    );
  }

  if (cmd.includes('ask guide') || cmd.includes('ask explorer guide') || cmd.includes('guide')) {
    const relics = state.inventory.filter((i) => i.category === 'relic');
    if (relics.length === 0) {
      return ok('Guide\'s Note: "You need relics from the temple rooms before Rudra will accept an offering. The Resonance Shard, Drainage Tablet, and Ember Vessel are good candidates."');
    }
    return ok(`Guide\'s Note: "You have ${relics.length} relic${relics.length !== 1 ? 's' : ''} (${relics.map((r) => r.name).join(', ')}). Place them as an offering at the statue's feet."`);
  }

  if (cmd.includes('ask temple')) {
    return ok('"Humility and wisdom open the final portal where strength cannot."');
  }

  return null as unknown as CommandResult;
}

// ── FINAL CHAMBER ─────────────────────────────────────────────────────────────
function handleFinal(state: GameState, cmd: string): CommandResult {

  if (cmd.includes('look around') || cmd.includes('look')) {
    return ok('Pillars float in the violet space, gravity suspended. Time in this room has a texture — it presses against your skin like deep water. The Eye of Rudra at the centre is the only fixed point.');
  }

  if (cmd.includes('inspect relic') || cmd.includes('inspect')) {
    return ok(
      'The Eye of Rudra is a sphere of compressed violet light in a bronze lattice. It distorts the space around it slightly — your hand looks wrong when you hold it near. Inside the light, very small and very far away, something moves.',
      {
        objectiveUpdates: [{ roomId: 'final', taskIndex: 1 }],
        stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 10) } },
      },
    );
  }

  if (cmd.includes('read core') || cmd.includes('read')) {
    return ok(
      'There is no inscription. The core speaks directly: "Thousands of years of waiting conclude with you. Carry us into the world, or leave us to finish the waiting. Either choice completes the cycle."',
      { objectiveUpdates: [{ roomId: 'final', taskIndex: 0 }] },
    );
  }

  if (cmd.includes('take relic') || cmd.includes('claim relic') || cmd.includes('take the relic')) {
    if (roomSolved(state, 'final')) {
      return ok('The relic is already in your possession. The cycle is complete.');
    }
    const newFlags = { ...state.roomFlags.final, puzzleSolved: true };
    return ok(
      'You step into the violet light and close your hand around the Eye. The bronze lattice is warm — the same warmth as the Ember Vessel, the same warmth as the threshold inscription under torchlight. A thousand years of accumulated intention enters you at once. You understand everything that happened here, and everything that is expected of you next.',
      {
        completedActionId: 'final_took_relic',
        objectiveUpdates: [{ roomId: 'final', taskIndex: 2 }],
        itemsAdded: ['temple_core_fragment'],
        stateUpdate: { roomFlags: { ...state.roomFlags, final: newFlags }, gameCompleted: true, gameEnding: 'transformed', playerStats: { ...state.playerStats, greedScore: Math.min(100, state.playerStats.greedScore + 20) } },
        journalEntry: journal('Claimed the Eye of Rudra. The temple cycle is complete — I am the next Guardian.', 'teaching'),
        audioEvent: 'bell',
        endGame: true,
      },
    );
  }

  if (cmd.includes('refuse relic') || cmd.includes('refuse') || cmd.includes('leave relic')) {
    if (roomSolved(state, 'final')) {
      return ok('You already made your choice. The cycle is complete.');
    }
    const newFlags = { ...state.roomFlags.final, puzzleSolved: true };
    return ok(
      'You bow before the Eye and step back. The violet light dims — not in anger, but in acceptance. The temple exhales. A passage opens behind you, smooth and lit, leading up through the mountain and into clean air and rain. You leave with nothing but what you came with, and everything you learned.',
      {
        completedActionId: 'final_refused_relic',
        objectiveUpdates: [{ roomId: 'final', taskIndex: 2 }],
        stateUpdate: { roomFlags: { ...state.roomFlags, final: newFlags }, gameCompleted: true, gameEnding: 'escaped', playerStats: { ...state.playerStats, integrityScore: Math.min(100, state.playerStats.integrityScore + 20) } },
        journalEntry: journal('Refused the Eye of Rudra. Walked out of the temple. Some knowledge is not meant to leave.', 'teaching'),
        audioEvent: 'bell',
        endGame: true,
      },
    );
  }

  if (cmd.includes('ask temple')) {
    return ok('"Thousands of years of waiting conclude with you. Claim or refuse the Eye."');
  }

  if (cmd.includes('ask guide') || cmd.includes('guide')) {
    return ok('Guide\'s Note: "This is it. Take the relic and carry the temple\'s memory into the world, or refuse it and walk out free. Both are valid endings."');
  }

  return null as unknown as CommandResult;
}

// ── Movement ──────────────────────────────────────────────────────────────────
function handleMovement(state: GameState): CommandResult {
  const currentIdx = ROOM_SEQUENCE.indexOf(state.currentRoomId);
  const nextRoomId = currentIdx < ROOM_SEQUENCE.length - 1 ? ROOM_SEQUENCE[currentIdx + 1] : null;

  if (!nextRoomId) {
    return ok('There is nowhere further to go. You are at the end of the known temple.');
  }
  if (!state.unlockedRooms[nextRoomId]) {
    return ok('The way forward is sealed. Something in this room must be resolved before passage opens.');
  }
  // Movement is handled by the caller; return a signal
  return { narration: '__MOVE__', stateUpdate: null };
}

// ── Room dispatcher ───────────────────────────────────────────────────────────
const ROOM_HANDLERS: Record<RoomId, (state: GameState, cmd: string) => CommandResult> = {
  entrance: handleEntrance,
  guardians: handleGuardians,
  echoes: handleEchoes,
  puzzle: handlePuzzle,
  library: handleLibrary,
  flooded: handleFlooded,
  elements: handleElements,
  sanctum: handleSanctum,
  final: handleFinal,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Process a command string against current game state.
 * Returns a CommandResult — the caller is responsible for applying state changes.
 */
export function processCommand(state: GameState, commandStr: string): CommandResult {
  const cmd = commandStr.toLowerCase().trim();

  // Global commands (work in any room)
  if (cmd === 'inventory' || cmd === 'items' || cmd === 'bag' || cmd === 'pack') {
    return handleInventory(state);
  }
  if (cmd.startsWith('examine ') || (cmd.startsWith('inspect ') && !isRoomSpecificInspect(cmd, state.currentRoomId))) {
    const target = cmd.replace(/^(examine|inspect)\s+/, '').trim();
    return handleExamine(state, target);
  }
  if (cmd.startsWith('use ')) {
    const target = cmd.replace(/^use\s+/, '').trim();
    return handleUse(state, target);
  }
  if (cmd === 'help' || cmd === 'commands' || cmd === '?') {
    return ok(
      `You are in ${ROOM_SEQUENCE.indexOf(state.currentRoomId) + 1} of 9 rooms.\nType commands freely or use the action buttons.\nGlobal: inventory · examine <item> · use <item> · help`,
    );
  }

  // Movement
  if (isMovementCommand(cmd)) {
    return handleMovement(state);
  }

  // Room-specific
  const handler = ROOM_HANDLERS[state.currentRoomId];
  if (handler) {
    const result = handler(state, cmd);
    if (result) return result;
  }

  // Fallback
  return ok(
    `You pause in the ${getRoomTitle(state.currentRoomId)}. The ancient stonework absorbs the gesture without reaction. Try a more specific action.`,
  );
}

/** Check if an 'inspect' command targets something in the room (not a generic item inspect) */
function isRoomSpecificInspect(cmd: string, roomId: RoomId): boolean {
  const roomKeywords: Record<RoomId, string[]> = {
    entrance: ['door', 'symbol', 'gate', 'lintel', 'lion'],
    guardians: ['statue', 'sentinel', 'carving', 'floor', 'marking'],
    echoes: ['mechanism', 'orb', 'niche', 'wheel'],
    puzzle: ['plate', 'floor', 'glyph', 'panel'],
    library: ['tablet', 'stack', 'shelf', 'scroll'],
    flooded: ['sluice', 'valve', 'bridge', 'wall'],
    elements: ['shrine', 'basin', 'inlay', 'altar'],
    sanctum: ['statue', 'pedestal', 'floor', 'offering'],
    final: ['relic', 'core', 'altar', 'sphere'],
  };
  return (roomKeywords[roomId] ?? []).some((kw) => cmd.includes(kw));
}

function getRoomTitle(roomId: RoomId): string {
  const titles: Record<RoomId, string> = {
    entrance: 'Temple Entrance', guardians: 'Hall of Guardians',
    echoes: 'Hall of Echoes', puzzle: 'Puzzle Chamber',
    library: 'Library of Whispers', flooded: 'Flooded Corridor',
    elements: 'Chamber of Elements', sanctum: 'Sanctum of Rudra', final: 'Final Chamber',
  };
  return titles[roomId] ?? roomId;
}
