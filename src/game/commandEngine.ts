/**
 * commandEngine.ts
 * Processes every player command and returns a CommandResult.
 * Delegates step-driven puzzle logic to puzzleEngine.
 * Handles special cases (elemental sequence, final endings, sluice).
 */
import { GameState, CommandResult, RoomId, JournalCategory } from '../types';
import { getItem } from './gameItems';
import { tryAdvancePuzzle, isPuzzleStepDone, isRoomPuzzleComplete } from './puzzleEngine';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasItem(state: GameState, id: string): boolean {
  return state.inventory.some((i) => i.id === id);
}

function actionDone(state: GameState, actionId: string): boolean {
  return state.completedActions.includes(actionId);
}

function roomSolved(state: GameState, roomId: RoomId): boolean {
  return state.roomFlags[roomId]?.puzzleSolved ?? false;
}

function ok(narration: string, extra: Partial<CommandResult> = {}): CommandResult {
  return { narration, stateUpdate: null, ...extra };
}

function jEntry(text: string, category: JournalCategory = 'observation') {
  return { text, category };
}

const ROOM_SEQUENCE: RoomId[] = [
  'entrance', 'guardians', 'echoes', 'puzzle',
  'library', 'flooded', 'elements', 'sanctum', 'final',
];

const MOVEMENT_WORDS = [
  'move', 'wade', 'pass', 'go ', 'forward', 'north',
  'east', 'down', 'inward', 'deeper', 'enter', 'push door',
];

function isMovementCommand(cmd: string): boolean {
  return MOVEMENT_WORDS.some((w) => cmd.includes(w));
}

// ── Global: inventory ─────────────────────────────────────────────────────────
function handleInventory(state: GameState): CommandResult {
  if (state.inventory.length === 0) {
    return ok('Your pack is empty.');
  }
  const lines = state.inventory.map(
    (i) => `• ${i.name}${i.condition ? ` [${i.condition}]` : ''} — ${i.description}`,
  );
  return ok(`Carrying ${state.inventory.length} items:\n${lines.join('\n')}`);
}

// ── Global: examine item ──────────────────────────────────────────────────────
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
  return ok(`Nothing in your pack matches "${target}". The stonework gives no reply.`);
}

// ── Global: use item ──────────────────────────────────────────────────────────
function handleUse(state: GameState, target: string): CommandResult {
  if (target.includes('torch') || target.includes('ancient torch')) {
    return ok(`You raise the Ancient Torch. The gold flame finds hidden wall channels — carved conduits that once carried water or air. Torch fuel: ${state.playerStats.torchFuel}%.`);
  }
  if (target.includes('map') || target.includes('temple map')) {
    return ok('You unfold the Temple Map. You are at room ' + (ROOM_SEQUENCE.indexOf(state.currentRoomId) + 1) + ' of 9. The map\'s question marks cluster around the later chambers.');
  }
  if (target.includes('compass') || target.includes('ancient compass')) {
    const roomIdx = ROOM_SEQUENCE.indexOf(state.currentRoomId);
    return ok(`The compass Dharma arm points inward — toward rooms ${roomIdx + 2} through 9. The Maya arm points back the way you came. Direction confirmed.`);
  }
  if (target.includes('journal') || target.includes('field journal')) {
    const last = state.journal.slice(-3).map((j) => `• ${j.text}`).join('\n');
    return ok(`Field Journal — recent entries:\n${last || '(No entries yet.)'}`);
  }
  if (target.includes('oil flask') || target.includes('oil')) {
    if (!hasItem(state, 'oil_flask')) return ok('You reached for the Oil Flask — it\'s already gone.');
    return ok('You tip the Oil Flask against the torch. The flame doubles in size. Torch fuel extended.', {
      itemsRemoved: ['oil_flask'],
      stateUpdate: { playerStats: { ...state.playerStats, torchFuel: Math.min(100, state.playerStats.torchFuel + 25) } },
      journalEntry: jEntry('Refuelled torch with ritual oil. Burns brighter and cleaner.'),
    });
  }
  if (target.includes('stone tablet')) {
    return ok('The Proto-Shaiva fragment: "...the guardian does not sleep. It merely agrees not to notice." You return it to your pack.', {
      stateUpdate: { playerStats: { ...state.playerStats, observationScore: Math.min(100, state.playerStats.observationScore + 5) } },
    });
  }
  if (target.includes('submerged relic') || target.includes('bronze plaque')) {
    return ok('The founding-ritual plaque confirms: Earth, Water, Fire, Air — in that order. The priests who built this place left the sequence in physical form.');
  }
  const item = state.inventory.find((i) => i.name.toLowerCase().includes(target) || i.id.includes(target));
  if (!item) return ok(`You don't have "${target}".`);
  if (!item.usable) return ok(`The ${item.name} can be examined but has no active use here.`);
  return ok(`You attempt to use the ${item.name}. The temple acknowledges the gesture but does not respond yet.`);
}

// ── Special case handlers (not covered by puzzle steps) ───────────────────────

// ENTRANCE: look around (always available, not a puzzle step)
function entranceLook(state: GameState): CommandResult {
  if (isPuzzleStepDone(state, 'puzzle_entrance', 'entrance_s1')) {
    return ok('You\'ve read the inscription. The hidden symbols are now visible as faint heat-marks where the torch exposed them. The brazier bracket waits.');
  }
  return ok('Cold rain glimmers on the lion sentinels. Sanskrit verses cover the entrance archway. An iron brazier bracket sits cold and dry beside the sealed gate.', {
    stateUpdate: { playerStats: { ...state.playerStats, curiosityScore: Math.min(100, state.playerStats.curiosityScore + 3) } },
  });
}

// GUARDIANS: look around
function guardiansLook(state: GameState): CommandResult {
  if (roomSolved(state, 'guardians')) {
    return ok('The sentinels face inward. The floor channels converge on the central altar, now illuminated. The northern arch is open.');
  }
  return ok('Pale cobalt light from a ceiling fracture. Copper floor channels lead to the central altar. Four sentinels face outward — their quartz eyes reflect your torch in cardinal directions.', {
    stateUpdate: { playerStats: { ...state.playerStats, curiosityScore: Math.min(100, state.playerStats.curiosityScore + 3) } },
  });
}

// ECHOES: look around
function echoesLook(state: GameState): CommandResult {
  const step1Done = isPuzzleStepDone(state, 'puzzle_echoes', 'echoes_s1');
  if (!step1Done) {
    return ok('Damp reflective walls mirror your torchlight twice. A bronze resonance mechanism sits at the centre. Three alcoves ring the walls, each containing a small crystal.');
  }
  return ok('The three alcove crystals pulse faintly — they remember the tones you activated. The central orb waits for the completing resonance.');
}

// PUZZLE CHAMBER: look around
function puzzleLook(state: GameState): CommandResult {
  if (roomSolved(state, 'puzzle')) {
    return ok('The plates are locked in cosmic sequence. Stairs descend below the open floor section.');
  }
  const decoded = isPuzzleStepDone(state, 'puzzle_chamber', 'puzzle_s2');
  if (decoded) {
    return ok('The plates glow: Creation (north), Preservation (east), Dissolution (south), Grace (west), Blank (centre). You know the sequence. The rotation mechanism awaits.');
  }
  return ok('Five plates in a cross. The bioluminescent script shifts slightly as your torch moves. Carved stone serpents coil the walls.');
}

// LIBRARY: look around
function libraryLook(state: GameState): CommandResult {
  if (roomSolved(state, 'library')) {
    return ok('The drainage tablet is secured in your pack. The hidden passage stairs are visible behind the shelving.');
  }
  const hasFragment = hasItem(state, 'missing_tablet_fragment');
  if (hasFragment) {
    return ok('You have the missing fragment. The main drainage diagram is incomplete without it — place them together to read the full schematic.');
  }
  return ok('Thousands of tablets. Clay ones whisper; slate ones are silent. Somewhere in the slate section, the drainage diagram waits — incomplete, with a fragment missing.');
}

// FLOODED: open sluice (item-gated special action)
function floodedOpenSluice(state: GameState): CommandResult {
  if (roomSolved(state, 'flooded')) {
    return ok('The corridor is already drained. The path to the Chamber of Elements is clear.');
  }
  const hasFish = hasItem(state, 'bronze_fish');
  const hasTablet = hasItem(state, 'drainage_tablet');
  if (!hasFish && !hasTablet) {
    return ok('The third valve has a fish-symbol socket and requires a specific key. You also need the Drainage Tablet to confirm which valve is safe to open. Check the Library of Whispers.');
  }
  if (!hasTablet) {
    return ok('You have the Bronze Fish key, but without the Drainage Tablet diagram you can\'t be certain which socket is correct. The Library holds the answer.');
  }
  if (!hasFish) {
    return ok('The Drainage Tablet confirms valve three is the drain. But the fish-symbol socket needs a purpose-made key — you don\'t have it yet. It must be somewhere nearby.');
  }
  const newFlags = { ...state.roomFlags.flooded, puzzleSolved: true, puzzleProgress: 100 };
  return ok(
    'You insert the Bronze Fish key into the third valve\'s socket — exact fit. You turn. A deep hydraulic groan, then a roar as water cascades down into the aquifer. In sixty seconds the corridor floor is exposed bare stone.',
    {
      completedActionId: 'flooded_sluice_opened',
      objectiveUpdates: [{ roomId: 'flooded', taskIndex: 2 }],
      unlockRoom: 'elements',
      stateUpdate: {
        roomFlags: { ...state.roomFlags, flooded: newFlags },
        floodLevel: 0,
        playerStats: { ...state.playerStats, templeFavor: 'Favored' },
        puzzleProgress: {
          ...state.puzzleProgress,
          puzzle_flooded: {
            puzzleId: 'puzzle_flooded',
            currentStepIndex: 4,
            completed: true,
            failed: false,
            stepsCompleted: ['flooded_s1', 'flooded_s2', 'flooded_s3', 'flooded_sluice'],
          },
        },
      },
      journalEntry: jEntry('Third sluice opened with Bronze Fish key. Corridor drained to the aquifer. Chamber of Elements revealed.', 'event'),
      audioEvent: 'stone',
    },
  );
}

// LIBRARY: take tablet (completes puzzle after all steps done)
function libraryTakeTablet(state: GameState): CommandResult {
  if (hasItem(state, 'drainage_tablet')) return ok('You already have the Drainage Tablet in your pack.');
  const step3Done = isPuzzleStepDone(state, 'puzzle_library', 'library_s3');
  if (!step3Done) {
    return ok('You reach for the heavy slate tablet but hesitate — the diagram has a gap and you haven\'t read the full schematic. Find the missing fragment first.');
  }
  const newFlags = { ...state.roomFlags.library, puzzleSolved: true, puzzleProgress: 100 };
  return ok(
    'You slide the complete Drainage Tablet free from its housing. Behind the shelving unit, a counterweight disengages — stone stairs emerge from the wall, descending to the Flooded Corridor.',
    {
      completedActionId: 'library_tablet_taken',
      objectiveUpdates: [{ roomId: 'library', taskIndex: 2 }],
      itemsAdded: ['drainage_tablet'],
      itemsRemoved: ['missing_tablet_fragment'],
      unlockRoom: 'flooded',
      stateUpdate: {
        roomFlags: { ...state.roomFlags, library: newFlags },
        puzzleProgress: {
          ...state.puzzleProgress,
          puzzle_library: {
            puzzleId: 'puzzle_library',
            currentStepIndex: 4,
            completed: true,
            failed: false,
            stepsCompleted: ['library_s1', 'library_s2', 'library_s3', 'library_tablet'],
          },
        },
      },
      journalEntry: jEntry('Drainage Tablet retrieved. Flooded Corridor stairs revealed behind shelving.', 'event'),
      audioEvent: 'stone',
    },
  );
}

// ELEMENTS: full sequence (Earth→Water→Fire→Air, tracked in customData)
function elementsKindleSequence(state: GameState, cmd: string): CommandResult {
  if (roomSolved(state, 'elements')) return ok('All four shrines are lit. The sanctum gates stand open.');

  const data = state.roomFlags.elements.customData as Record<string, boolean>;
  const earthLit = data.earth ?? false;
  const waterLit = data.water ?? false;
  const fireLit = data.fire ?? false;
  const airLit = data.air ?? false;

  // Determine which shrine the player is targeting
  const isEarth = cmd.includes('earth') || cmd.includes('basalt') || cmd.includes('ground');
  const isWater = cmd.includes('water') || cmd.includes('aquamarine') || cmd.includes('mist');
  const isFire = cmd.includes('fire') || cmd.includes('obsidian') || cmd.includes('flame') || cmd.includes('kindle') || (!isEarth && !isWater && !cmd.includes('air'));
  const isAir = cmd.includes('air') || cmd.includes('pumice') || cmd.includes('wind') || cmd.includes('draft');

  if (!hasItem(state, 'ancient_torch')) {
    return ok('You need a fire source to kindle the shrines.');
  }

  // Enforce sequence — wrong order resets and penalises
  if (isEarth && !earthLit) {
    const newData = { ...data, earth: true };
    return ok('The basalt Earth shrine catches first — steady orange flame, still as a foundation stone. The gold inlay at your feet pulses once.', {
      stateUpdate: { roomFlags: { ...state.roomFlags, elements: { ...state.roomFlags.elements, customData: newData } } },
      journalEntry: jEntry('Earth shrine kindled — first in sequence.', 'event'),
      audioEvent: 'bell',
    });
  }
  if (isWater && !waterLit) {
    if (!earthLit) return ok('The water shrine\'s basin remains cold. The sequence requires Earth first — the foundation precedes the flow.');
    const newData = { ...data, water: true };
    return ok('The aquamarine Water shrine ignites cold-blue, mist rising from the basin rim. The floor inlay between Earth and Water lights gold.', {
      stateUpdate: { roomFlags: { ...state.roomFlags, elements: { ...state.roomFlags.elements, customData: newData } } },
      journalEntry: jEntry('Water shrine kindled — second in sequence.', 'event'),
      audioEvent: 'bell',
    });
  }
  if (isFire && !fireLit && !isEarth && !isWater && !isAir) {
    if (!earthLit || !waterLit) return ok('The obsidian fire shrine flares briefly then dies. Earth and Water must precede Fire — fire needs something to burn above and a channel to follow.');
    const newData = { ...data, fire: true };
    return ok('The obsidian Fire shrine erupts — a column of amber flame, clean and vertical. Three sections of the floor inlay now glow.', {
      stateUpdate: { roomFlags: { ...state.roomFlags, elements: { ...state.roomFlags.elements, customData: newData } } },
      journalEntry: jEntry('Fire shrine kindled — third in sequence.', 'event'),
      objectiveUpdates: [{ roomId: 'elements', taskIndex: 2 }],
      audioEvent: 'bell',
    });
  }
  if (isAir && !airLit) {
    if (!earthLit || !waterLit || !fireLit) return ok('The pumice Air shrine stirs but does not light. The three preceding elements must all be active first.');
    // All four — puzzle complete
    const newFlags = { ...state.roomFlags.elements, puzzleSolved: true, puzzleProgress: 100 };
    return ok(
      'The pumice Air shrine breathes a thin clear flame that bends toward nothing. The gold floor circuit floods with light. A deep resonant bell-tone rolls through the room and the sanctum gates swing open.',
      {
        completedActionId: 'elements_sequence_complete',
        objectiveUpdates: [{ roomId: 'elements', taskIndex: 2 }],
        itemsAdded: ['ember_vessel'],
        unlockRoom: 'sanctum',
        stateUpdate: {
          roomFlags: { ...state.roomFlags, elements: newFlags },
          playerStats: { ...state.playerStats, templeFavor: 'Recognised' },
          puzzleProgress: {
            ...state.puzzleProgress,
            puzzle_elements: {
              puzzleId: 'puzzle_elements',
              currentStepIndex: 4,
              completed: true,
              failed: false,
              stepsCompleted: ['elements_s1', 'elements_s2', 'elements_s3', 'elements_air'],
            },
          },
        },
        journalEntry: jEntry('All four shrines kindled: Earth → Water → Fire → Air. Circuit complete. Ember Vessel recovered. Sanctum open.', 'event'),
        audioEvent: 'bell',
      },
    );
  }
  if (isEarth && earthLit) return ok('The Earth shrine is already lit — its flame steady and orange.');
  if (isWater && waterLit) return ok('The Water shrine is already lit — cold-blue mist rising.');
  if (isFire && fireLit) return ok('The Fire shrine is already lit — amber column burning clean.');
  return ok('You approach the shrines with your torch. Which element do you kindle? (Earth, Water, Fire, or Air)');
}

// SANCTUM: make offering — requires ember_vessel + any relics
function sanctumMakeOffering(state: GameState): CommandResult {
  if (roomSolved(state, 'sanctum')) return ok('The offering was accepted. The Final Chamber lies ahead.');

  const inscriptionRead = isPuzzleStepDone(state, 'puzzle_sanctum', 'sanctum_s2');
  if (!inscriptionRead) {
    return ok('You step forward but stop. The pedestal has an inscription you haven\'t read yet. Understanding what Rudra requires may matter.');
  }

  const relics = state.inventory.filter((i) => i.category === 'relic');
  if (!hasItem(state, 'ember_vessel')) {
    return ok('You extend your hands but they hold nothing sacred. You need the Ember Vessel from the Chamber of Elements and the relics gathered through the temple.');
  }
  if (relics.length < 2) {
    return ok(`You have ${relics.length} relic${relics.length !== 1 ? 's' : ''}. The inscription implied a gathering — bring more sacred items from the temple rooms before offering.`);
  }

  const offeredNames = relics.map((r) => r.name).join(', ');
  const removedIds = relics.map((r) => r.id);
  const newFlags = { ...state.roomFlags.sanctum, puzzleSolved: true, puzzleProgress: 100 };

  return ok(
    `You place the ${offeredNames} at the statue\'s feet. Each settles onto the gold inlay with a soft resonant tone. The obsidian eyes open — two columns of gold light fall from them. The floor parts and the passage to the Final Chamber is revealed.`,
    {
      completedActionId: 'sanctum_offering_complete',
      objectiveUpdates: [{ roomId: 'sanctum', taskIndex: 2 }],
      itemsRemoved: removedIds,
      unlockRoom: 'final',
      stateUpdate: {
        roomFlags: { ...state.roomFlags, sanctum: newFlags },
        playerStats: { ...state.playerStats, templeFavor: 'Chosen', integrityScore: Math.min(100, state.playerStats.integrityScore + 20) },
        puzzleProgress: {
          ...state.puzzleProgress,
          puzzle_sanctum: {
            puzzleId: 'puzzle_sanctum',
            currentStepIndex: 4,
            completed: true,
            failed: false,
            stepsCompleted: ['sanctum_s1', 'sanctum_s2', 'sanctum_s3'],
          },
        },
      },
      journalEntry: jEntry(`Offered ${offeredNames} at Rudra\'s feet. The Final Chamber is open.`, 'event'),
      audioEvent: 'bell',
    },
  );
}

// FINAL: three endings
function finalEnding(state: GameState, cmd: string): CommandResult {
  if (roomSolved(state, 'final')) return ok('Your choice is made. The temple cycle is complete.');

  const coreRead = isPuzzleStepDone(state, 'puzzle_final', 'final_s2');
  if (!coreRead && !cmd.includes('take') && !cmd.includes('refuse') && !cmd.includes('return')) {
    return ok('You stand before the Eye of Rudra. Inspect it first — look, listen, understand what is being offered before deciding.');
  }

  const newFlags = { ...state.roomFlags.final, puzzleSolved: true, puzzleProgress: 100 };

  // ACCEPT
  if (cmd.includes('take relic') || cmd.includes('claim') || cmd.includes('accept') || (cmd.includes('take') && !cmd.includes('refuse') && !cmd.includes('return'))) {
    return ok(
      'You step into the violet light. The bronze lattice opens around your hand. A thousand years of intention — devotion, sacrifice, purpose — enters you at once. You are not the same person who crossed the threshold. The Eye is yours to carry into the world.',
      {
        completedActionId: 'final_accepted',
        objectiveUpdates: [{ roomId: 'final', taskIndex: 2 }],
        itemsAdded: ['temple_core_fragment'],
        stateUpdate: {
          roomFlags: { ...state.roomFlags, final: newFlags },
          gameCompleted: true,
          gameEnding: 'transformed',
          playerStats: { ...state.playerStats, greedScore: Math.min(100, state.playerStats.greedScore + 15) },
        },
        journalEntry: jEntry('Accepted the Eye of Rudra. The temple cycle is complete — I carry its memory forward.', 'teaching'),
        audioEvent: 'bell',
        endGame: true,
      },
    );
  }

  // REFUSE (leave it)
  if (cmd.includes('refuse') || cmd.includes('leave relic') || cmd.includes('walk away') || cmd.includes('step back')) {
    return ok(
      'You bow before the Eye and step back. The violet light dims — not in anger, but in acceptance. A passage opens behind you, smooth and lit, leading up through the mountain into clean air. You leave with what you came with and everything you learned.',
      {
        completedActionId: 'final_refused',
        objectiveUpdates: [{ roomId: 'final', taskIndex: 2 }],
        stateUpdate: {
          roomFlags: { ...state.roomFlags, final: newFlags },
          gameCompleted: true,
          gameEnding: 'escaped',
          playerStats: { ...state.playerStats, integrityScore: Math.min(100, state.playerStats.integrityScore + 20) },
        },
        journalEntry: jEntry('Refused the Eye of Rudra. Walked out free. Some knowledge belongs where it is.', 'teaching'),
        audioEvent: 'bell',
        endGame: true,
      },
    );
  }

  // RETURN (put it back / restore it)
  if (cmd.includes('return relic') || cmd.includes('restore') || cmd.includes('put back') || cmd.includes('give back')) {
    return ok(
      'You lift the Eye and place it back in the altar\'s cradle. The bronze lattice closes. A tone plays — not a bell, something deeper — and then silence. The temple exhales. The passage out opens, and it is wider than the one you came in.',
      {
        completedActionId: 'final_returned',
        objectiveUpdates: [{ roomId: 'final', taskIndex: 2 }],
        stateUpdate: {
          roomFlags: { ...state.roomFlags, final: newFlags },
          gameCompleted: true,
          gameEnding: 'escaped',
          playerStats: { ...state.playerStats, integrityScore: Math.min(100, state.playerStats.integrityScore + 30), templeFavor: 'Chosen' },
        },
        journalEntry: jEntry('Returned the Eye to its cradle. Restored the cycle. Left the temple whole.', 'teaching'),
        audioEvent: 'bell',
        endGame: true,
      },
    );
  }

  return ok('Stand before the Eye and decide: take the relic, refuse it, or return it to its cradle.');
}

// ── Temple / Guide responses per room ─────────────────────────────────────────
function handleTemple(state: GameState): CommandResult {
  const responses: Record<RoomId, string[]> = {
    entrance: ['"Only those who bear light into the dark shall pass."', '"The name below is the lock. Fire speaks the key."'],
    guardians: ['"The sentinels watch those who rush in haste."', '"Turn their gaze inward and the path opens without sound."'],
    echoes: ['"Harmony yields passage where force achieves nothing."', '"The mountain breathes at 432Hz — match it."'],
    puzzle: ['"The blank plate is the unspeakable syllable. It is already correct."', '"Creation. Preservation. Dissolution. This is the cycle."'],
    library: ['"Truth rests quietly among a thousand whispering falsehoods."', '"The fragment you need is closer than the whispers suggest."'],
    flooded: ['"Water obeys the vessel that understands its channel."', '"The fish marks the third mouth. Do not touch the first."'],
    elements: ['"Earth holds. Water carries. Fire changes. Air remains."', '"Kindle them in order and the circuit closes."'],
    sanctum: ['"Offer without greed and receive vision. Offer with greed and receive silence."', '"The empty hand is the gesture of receiving."'],
    final: ['"Thousands of years of waiting conclude with you."', '"The cycle accepts either answer."'],
  };
  const options = responses[state.currentRoomId] ?? ['"The temple listens."'];
  return ok(options[state.currentTurn % options.length]);
}

function handleGuide(state: GameState): CommandResult {
  const guides: Record<RoomId, string[]> = {
    entrance: [
      'Guide: "Read the inscription first — it hints at what to do next."',
      'Guide: "The hidden symbols appear when heat is applied directly to the stone. Try your torch."',
      'Guide: "Light the iron bracket beside the gate. That\'s the brazier."',
    ],
    guardians: [
      'Guide: "Study the floor channels first — they tell you the correct orientation."',
      'Guide: "Read the pedestal carvings. They\'re the instruction manual."',
      'Guide: "Rotate all four statues so they face inward. Don\'t look at their faces while doing it."',
    ],
    echoes: [
      'Guide: "Stand still and listen. The echo interval is the key measurement."',
      'Guide: "The three alcove crystals need to be activated — touch each one."',
      'Guide: "Once the crystals are active, touch the central orb with a crystal fragment."',
    ],
    puzzle: [
      'Guide: "Inspect the plates carefully — count them, note which one is blank."',
      'Guide: "Decode the Sanskrit symbols — the cosmic cycle gives you the order."',
      'Guide: "Creation north, Preservation east, Dissolution south. The blank plate stays where it is."',
    ],
    library: [
      'Guide: "Clay tablets whisper lies. Slate tablets are silent truth. Look for slate."',
      'Guide: "There\'s a missing fragment somewhere on the floor between the shelves."',
      'Guide: "Read the combined diagram before taking the tablet — know what you\'re carrying."',
    ],
    flooded: [
      'Guide: "Use the rope to probe depth before wading — you can\'t see the bottom."',
      'Guide: "Something\'s on the floor — reach down and retrieve it before draining."',
      'Guide: "Third valve, fish symbol. You need both the diagram and the key."',
    ],
    elements: [
      'Guide: "Inspect all four shrines first — learn what each element looks like."',
      'Guide: "Read the floor inscription — it gives the exact order."',
      'Guide: "Earth first. Always earth first. Then water, fire, air."',
    ],
    sanctum: [
      'Guide: "Inspect the statue — Rudra\'s posture tells you what it expects."',
      'Guide: "Read the pedestal inscription before offering anything."',
      'Guide: "Bring all the relics you\'ve collected. The Ember Vessel is essential."',
    ],
    final: [
      'Guide: "Inspect the Eye first. Let it show you what it is."',
      'Guide: "Read the core — let it speak to you before you decide."',
      'Guide: "Take it, refuse it, or restore it. All three are valid. Choose what fits who you are."',
    ],
  };
  const options = guides[state.currentRoomId] ?? ['Guide: "Trust the process."'];
  // Progressive hints — reveal more detail as turns increase in the room
  const stepsDone = Object.keys(state.puzzleProgress[ROOM_PUZZLE_MAP_LOCAL[state.currentRoomId] ?? '']?.stepsCompleted ?? {}).length;
  const idx = Math.min(stepsDone, options.length - 1);
  return ok(options[idx]);
}

const ROOM_PUZZLE_MAP_LOCAL: Record<RoomId, string> = {
  entrance: 'puzzle_entrance', guardians: 'puzzle_guardians',
  echoes: 'puzzle_echoes', puzzle: 'puzzle_chamber',
  library: 'puzzle_library', flooded: 'puzzle_flooded',
  elements: 'puzzle_elements', sanctum: 'puzzle_sanctum', final: 'puzzle_final',
};

// ── Movement ──────────────────────────────────────────────────────────────────
function handleMovement(state: GameState): CommandResult {
  const idx = ROOM_SEQUENCE.indexOf(state.currentRoomId);
  const nextId = idx < ROOM_SEQUENCE.length - 1 ? ROOM_SEQUENCE[idx + 1] : null;
  if (!nextId) return ok('There is nowhere further to go. You are at the end of the temple.');
  if (!state.unlockedRooms[nextId]) {
    return ok('The way forward is sealed. The room\'s mechanism has not been resolved yet.');
  }
  return { narration: '__MOVE__', stateUpdate: null };
}

// ── Room-specific fallback look responses ─────────────────────────────────────
const LOOK_HANDLERS: Partial<Record<RoomId, (state: GameState) => CommandResult>> = {
  entrance: entranceLook,
  guardians: guardiansLook,
  echoes: echoesLook,
  puzzle: puzzleLook,
  library: libraryLook,
};

function isRoomSpecificInspect(cmd: string, roomId: RoomId): boolean {
  const kws: Record<RoomId, string[]> = {
    entrance: ['door', 'symbol', 'gate', 'lintel', 'lion', 'inscription'],
    guardians: ['statue', 'sentinel', 'carving', 'floor', 'marking', 'pedestal'],
    echoes: ['mechanism', 'orb', 'niche', 'wheel', 'crystal'],
    puzzle: ['plate', 'floor', 'glyph', 'panel'],
    library: ['tablet', 'stack', 'shelf', 'scroll', 'fragment'],
    flooded: ['sluice', 'valve', 'bridge', 'wall', 'marking'],
    elements: ['shrine', 'basin', 'inlay', 'altar'],
    sanctum: ['statue', 'pedestal', 'floor', 'offering'],
    final: ['relic', 'core', 'altar', 'sphere', 'eye'],
  };
  return (kws[roomId] ?? []).some((kw) => cmd.includes(kw));
}

function getRoomTitle(roomId: RoomId): string {
  const t: Record<RoomId, string> = {
    entrance: 'Temple Entrance', guardians: 'Hall of Guardians',
    echoes: 'Hall of Echoes', puzzle: 'Puzzle Chamber',
    library: 'Library of Whispers', flooded: 'Flooded Corridor',
    elements: 'Chamber of Elements', sanctum: 'Sanctum of Rudra', final: 'Final Chamber',
  };
  return t[roomId] ?? roomId;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function processCommand(state: GameState, commandStr: string): CommandResult {
  const cmd = commandStr.toLowerCase().trim();
  const roomId = state.currentRoomId;

  // ── Global commands ──────────────────────────────────────────────────────
  if (cmd === 'inventory' || cmd === 'items' || cmd === 'bag' || cmd === 'pack') {
    return handleInventory(state);
  }
  if (cmd.startsWith('examine ') || (cmd.startsWith('inspect ') && !isRoomSpecificInspect(cmd, roomId))) {
    const target = cmd.replace(/^(examine|inspect)\s+/, '').trim();
    return handleExamine(state, target);
  }
  if (cmd.startsWith('use ')) {
    const target = cmd.replace(/^use\s+/, '').trim();
    return handleUse(state, target);
  }
  if (cmd === 'help' || cmd === 'commands' || cmd === '?') {
    return ok(`Room ${ROOM_SEQUENCE.indexOf(roomId) + 1} of 9 — ${getRoomTitle(roomId)}.\nUse the action buttons or type: inventory · examine <item> · use <item> · look around · ask temple · ask guide`);
  }

  // ── Movement ─────────────────────────────────────────────────────────────
  if (isMovementCommand(cmd)) return handleMovement(state);

  // ── Temple / Guide ────────────────────────────────────────────────────────
  if (cmd.includes('ask temple') || cmd.includes('temple')) return handleTemple(state);
  if (cmd.includes('ask guide') || cmd.includes('ask explorer') || cmd.includes('guide')) return handleGuide(state);

  // ── Special room actions (item-gated or multi-path) ───────────────────────
  if (roomId === 'entrance' && (cmd.includes('look around') || cmd.includes('look'))) return entranceLook(state);
  if (roomId === 'guardians' && (cmd.includes('look around') || cmd.includes('look'))) return guardiansLook(state);
  if (roomId === 'echoes' && (cmd.includes('look around') || cmd.includes('look'))) return echoesLook(state);
  if (roomId === 'puzzle' && (cmd.includes('look around') || cmd.includes('look'))) return puzzleLook(state);
  if (roomId === 'library' && (cmd.includes('look around') || cmd.includes('look'))) return libraryLook(state);

  if (roomId === 'flooded' && (cmd.includes('open sluice') || cmd.includes('drain') || cmd.includes('sluice') || cmd.includes('valve'))) {
    return floodedOpenSluice(state);
  }
  if (roomId === 'library' && (cmd.includes('take tablet') || cmd.includes('take drainage') || cmd.includes('grab tablet'))) {
    return libraryTakeTablet(state);
  }
  if (roomId === 'elements' && (cmd.includes('kindle') || cmd.includes('light shrine') || cmd.includes('earth') || cmd.includes('water shrine') || cmd.includes('fire shrine') || cmd.includes('air shrine') || cmd.includes('rotate basin') || cmd.includes('activate shrine'))) {
    return elementsKindleSequence(state, cmd);
  }
  if (roomId === 'sanctum' && (cmd.includes('make offering') || cmd.includes('offer') || cmd.includes('place relic'))) {
    return sanctumMakeOffering(state);
  }
  if (roomId === 'final' && (cmd.includes('take relic') || cmd.includes('refuse') || cmd.includes('return relic') || cmd.includes('claim') || cmd.includes('accept') || cmd.includes('restore') || cmd.includes('put back'))) {
    return finalEnding(state, cmd);
  }

  // ── Puzzle engine — step-driven logic ────────────────────────────────────
  const puzzleResult = tryAdvancePuzzle(state, cmd, roomId);
  if (puzzleResult) return puzzleResult;

  // ── Fallback ─────────────────────────────────────────────────────────────
  return ok(`You pause in the ${getRoomTitle(roomId)}. The stonework absorbs the gesture without reply. Try a more specific action, or ask the guide for a hint.`);
}
