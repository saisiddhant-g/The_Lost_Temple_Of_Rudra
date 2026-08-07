/**
 * commandEngine.ts
 * Processes every player command and returns a CommandResult.
 * Delegates step-driven puzzle logic to puzzleEngine.
 * Handles special cases (elemental sequence, final endings, sluice).
 */
import { GameState, CommandResult, RoomId, JournalCategory } from '../types';
import { getItem } from './gameItems';
import { tryAdvancePuzzle, isPuzzleStepDone, isRoomPuzzleComplete } from './puzzleEngine';
import { getTempleWhisper, getGuideResponse, getGuideDiscoveryComment, generateFieldNote } from './dialogueEngine';
import { getHint, recordRoomFail, isPlayerStuck } from './hintEngine';
import { applyTraitEvent, commandToTraitEvent } from './traitEngine';
import {
  recordHintRequested, recordTempleAsked, recordExplorationAction,
  recordLoreRead, recordRelicCollected, recordMoralChoice,
  recordFailedAttempt, setLastTempleWhisper, setLastGuideResponse,
  recordPlayerDecision, recordHiddenDiscovery, recordDangerousChoice,
  recordItemIgnored,
} from './templeMemoryEngine';
import {
  getTorchDescription, getTorchBrightness, getFloodDescription,
  getStabilityDescription, buildWorldStatusPrefix, checkSecretTrigger,
  applyStabilityDelta,
} from './worldEngine';

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
    const desc = getTorchDescription(state.playerStats.torchFuel);
    return ok(desc);
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
    const newFuel = Math.min(100, state.playerStats.torchFuel + 25);
    return ok(`You tip the Oil Flask against the torch. The flame doubles in size — ${getTorchDescription(newFuel)}`, {
      itemsRemoved: ['oil_flask'],
      stateUpdate: { playerStats: { ...state.playerStats, torchFuel: newFuel } },
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
  const prefix = buildWorldStatusPrefix(state);
  if (isPuzzleStepDone(state, 'puzzle_entrance', 'entrance_s1')) {
    return ok(prefix + 'You\'ve read the inscription. The hidden symbols are now visible as faint heat-marks where the torch exposed them. The brazier bracket waits.');
  }
  return ok(prefix + 'Cold rain glimmers on the lion sentinels. Sanskrit verses cover the entrance archway. An iron brazier bracket sits cold and dry beside the sealed gate.', {
    stateUpdate: { playerStats: { ...state.playerStats, curiosityScore: Math.min(100, state.playerStats.curiosityScore + 3) } },
  });
}

// GUARDIANS: look around
function guardiansLook(state: GameState): CommandResult {
  const prefix = buildWorldStatusPrefix(state);
  if (roomSolved(state, 'guardians')) {
    return ok(prefix + 'The sentinels face inward. The floor channels converge on the central altar, now illuminated. The northern arch is open.');
  }
  return ok(prefix + 'Pale cobalt light from a ceiling fracture. Copper floor channels lead to the central altar. Four sentinels face outward — their quartz eyes reflect your torch in cardinal directions.', {
    stateUpdate: { playerStats: { ...state.playerStats, curiosityScore: Math.min(100, state.playerStats.curiosityScore + 3) } },
  });
}

// ECHOES: look around
function echoesLook(state: GameState): CommandResult {
  const prefix = buildWorldStatusPrefix(state);
  const step1Done = isPuzzleStepDone(state, 'puzzle_echoes', 'echoes_s1');
  if (!step1Done) {
    return ok(prefix + 'Damp reflective walls mirror your torchlight twice. A bronze resonance mechanism sits at the centre. Three alcoves ring the walls, each containing a small crystal.');
  }
  return ok(prefix + 'The three alcove crystals pulse faintly — they remember the tones you activated. The central orb waits for the completing resonance.');
}

// PUZZLE CHAMBER: look around
function puzzleLook(state: GameState): CommandResult {
  const prefix = buildWorldStatusPrefix(state);
  if (roomSolved(state, 'puzzle')) {
    return ok(prefix + 'The plates are locked in cosmic sequence. Stairs descend below the open floor section.');
  }
  const decoded = isPuzzleStepDone(state, 'puzzle_chamber', 'puzzle_s2');
  if (decoded) {
    return ok(prefix + 'The plates glow: Creation (north), Preservation (east), Dissolution (south), Grace (west), Blank (centre). You know the sequence. The rotation mechanism awaits.');
  }
  return ok(prefix + 'Five plates in a cross. The bioluminescent script shifts slightly as your torch moves. Carved stone serpents coil the walls.');
}

// LIBRARY: look around
function libraryLook(state: GameState): CommandResult {
  const prefix = buildWorldStatusPrefix(state);
  if (roomSolved(state, 'library')) {
    return ok(prefix + 'The drainage tablet is secured in your pack. The hidden passage stairs are visible behind the shelving.');
  }
  const hasFragment = hasItem(state, 'missing_tablet_fragment');
  if (hasFragment) {
    return ok(prefix + 'You have the missing fragment. The main drainage diagram is incomplete without it — place them together to read the full schematic.');
  }
  return ok(prefix + 'Thousands of tablets. Clay ones whisper; slate ones are silent. Somewhere in the slate section, the drainage diagram waits — incomplete, with a fragment missing.');
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
  const stabilityUpdate = applyStabilityDelta(state, 'puzzle_solved');
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
        ...stabilityUpdate,
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
  const stabilityBoost = applyStabilityDelta(state, 'offering_made');

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
        ...stabilityBoost,
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
    const stabilityPenalty = applyStabilityDelta(state, 'relic_taken');
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
          ...stabilityPenalty,
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
    const stabilityRestore = applyStabilityDelta(state, 'relic_restored');
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
          ...stabilityRestore,
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
  const { whisper, newContext } = getTempleWhisper(state);
  const newMem = setLastTempleWhisper(
    recordTempleAsked(state.templeMemory),
    whisper,
  );
  return ok(whisper, {
    stateUpdate: {
      templeMemory: newMem,
      dialogueContext: newContext,
    },
    journalEntry: {
      text: whisper,
      category: 'teaching',
    },
  });
}

function handleGuide(state: GameState): CommandResult {
  const roomId = state.currentRoomId;
  const { text: hintText, newHintState, levelUsed } = getHint(state, roomId);
  const { response, newContext } = getGuideResponse(state, hintText, levelUsed);

  const newMem = setLastGuideResponse(
    recordHintRequested(state.templeMemory, roomId),
    response,
  );

  // Apply recklessness penalty for asking guide early
  const failCount = state.hintState.roomFailCount[roomId] ?? 0;
  const traitEvent = failCount === 0 ? 'request_hint' : null;
  const newTraits = traitEvent
    ? applyTraitEvent(state.playerTraits, traitEvent)
    : state.playerTraits;

  return ok(response, {
    stateUpdate: {
      templeMemory: newMem,
      hintState: newHintState,
      dialogueContext: newContext,
      playerTraits: newTraits,
    },
    journalEntry: {
      text: response,
      category: 'observation',
    },
  });
}

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

// ── Narrative side-effects wrapper ────────────────────────────────────────────
/**
 * Wraps any CommandResult with automatic trait, memory, and hint updates
 * based on the command that produced it. Merges the additional stateUpdate
 * cleanly without overwriting result-specific updates.
 */
function withNarrativeSideEffects(
  result: CommandResult,
  state: GameState,
  cmd: string,
): CommandResult {
  let newTraits = { ...state.playerTraits };
  let newMem = { ...state.templeMemory };
  let newHintState = { ...state.hintState };
  const roomId = state.currentRoomId;

  // ── Trait event from command ───────────────────────────────────────────
  const traitEvent = commandToTraitEvent(cmd);
  if (traitEvent) {
    newTraits = applyTraitEvent(newTraits, traitEvent);
  }

  // ── Memory: exploration ────────────────────────────────────────────────
  if (cmd.includes('look') || cmd.includes('inspect') || cmd.includes('examine') || cmd.includes('survey')) {
    newMem = recordExplorationAction(newMem);
  }

  // ── Memory: lore read ──────────────────────────────────────────────────
  if (cmd.includes('read') || cmd.includes('decode') || cmd.includes('translate') || cmd.includes('carvings') || cmd.includes('inscription')) {
    newMem = recordLoreRead(newMem);
    newTraits = applyTraitEvent(newTraits, 'read_lore');
  }

  // ── Memory + trait: relic and hidden items collected ──────────────────
  if (result.itemsAdded) {
    for (const itemId of result.itemsAdded) {
      const item = state.inventory.find(i => i.id === itemId);
      const isRelic = item?.category === 'relic' || [
        'resonance_shard', 'drainage_tablet', 'ember_vessel',
        'submerged_relic', 'guardian_seal', 'temple_core_fragment',
      ].includes(itemId);
      if (isRelic) {
        newMem = recordRelicCollected(newMem, itemId);
        newTraits = applyTraitEvent(newTraits, 'collect_relic');
      }
      // Hidden discovery items
      if (['hidden_symbol_rubbing', 'missing_tablet_fragment', 'echo_crystal_fragment'].includes(itemId)) {
        newMem = recordHiddenDiscovery(newMem, itemId);
        newTraits = applyTraitEvent(newTraits, 'discover_hidden');
      }
    }
  }

  // ── Memory + trait: puzzle solved ──────────────────────────────────────
  const puzzleSolvedNow =
    result.stateUpdate?.roomFlags?.[roomId as RoomId]?.puzzleSolved === true &&
    !(state.roomFlags[roomId]?.puzzleSolved);
  const completionAction = result.completedActionId ?? '';
  const isPuzzleCompletion =
    puzzleSolvedNow ||
    completionAction.startsWith('puzzle_completed_') ||
    completionAction === 'elements_sequence_complete' ||
    completionAction === 'flooded_sluice_opened' ||
    completionAction === 'library_tablet_taken' ||
    completionAction === 'sanctum_offering_complete';

  if (isPuzzleCompletion) {
    const usedHints = (newMem.hintsRequested[roomId] ?? 0) > 0;
    newTraits = applyTraitEvent(newTraits, usedHints ? 'solve_puzzle_hint' : 'solve_puzzle_no_hint');
    if (!newMem.puzzlesSolved.includes(`puzzle_${roomId}`)) {
      newMem = {
        ...newMem,
        puzzlesSolved: [...newMem.puzzlesSolved, `puzzle_${roomId}`],
        consecutiveFails: 0,
        consecutiveSolves: newMem.consecutiveSolves + 1,
      };
    }
  }

  // ── Memory + hint: failed attempt — broadened detection ──────────────
  const failureSignals = [
    result.narration.includes('stonework absorbs'),
    result.narration.includes('does not respond yet'),
    result.narration.includes('without reaction'),
    result.narration.includes('stirs but does not light'),
    result.narration.includes('flares briefly then dies'),
    result.narration.includes('remains cold'),
    result.narration.includes('slides back to neutral'),
    result.narration.includes('cannot be certain'),
    result.narration.includes('haven\'t read'),
  ];
  const isFallback = failureSignals.some(Boolean);

  if (isFallback) {
    newMem = recordFailedAttempt(newMem, `puzzle_${roomId}`);
    newHintState = recordRoomFail(newHintState, roomId);
    newTraits = applyTraitEvent(newTraits, 'failed_attempt');
    if (newMem.consecutiveFails >= 3) {
      newTraits = applyTraitEvent(newTraits, 'consecutive_fails');
    }
  }

  // ── Dangerous choices ──────────────────────────────────────────────────
  if (cmd.includes('first valve') || cmd.includes('second valve')) {
    newMem = recordDangerousChoice(newMem, `risky_valve_${state.currentTurn}`);
  }

  // ── Moral choices ──────────────────────────────────────────────────────
  if (completionAction === 'sanctum_offering_complete') {
    newMem = recordMoralChoice(newMem, state.currentTurn, 'offered_relics', 'noble');
    newTraits = applyTraitEvent(newTraits, 'offer_relic');
    newMem = recordPlayerDecision(newMem, state.currentTurn, roomId, 'Made offering at Rudra\'s feet');
  }
  if (completionAction === 'final_accepted') {
    newMem = recordMoralChoice(newMem, state.currentTurn, 'accepted_eye', 'greedy');
    newTraits = applyTraitEvent(newTraits, 'accept_final_relic');
    newMem = recordPlayerDecision(newMem, state.currentTurn, roomId, 'Accepted the Eye of Rudra');
  }
  if (completionAction === 'final_refused') {
    newMem = recordMoralChoice(newMem, state.currentTurn, 'refused_eye', 'noble');
    newTraits = applyTraitEvent(newTraits, 'refuse_final_relic');
    newMem = recordPlayerDecision(newMem, state.currentTurn, roomId, 'Refused the Eye of Rudra');
  }
  if (completionAction === 'final_returned') {
    newMem = recordMoralChoice(newMem, state.currentTurn, 'restored_eye', 'noble');
    newTraits = applyTraitEvent(newTraits, 'restore_final_relic');
    newMem = recordPlayerDecision(newMem, state.currentTurn, roomId, 'Restored the Eye of Rudra to its cradle');
  }

  // ── Auto-journal: guide discovery comments ────────────────────────────
  // Appended as journal entry when no result-specific entry exists
  let extraJournalText: string | null = null;
  if (isPuzzleCompletion && !result.journalEntry) {
    extraJournalText = getGuideDiscoveryComment(
      { ...state, templeMemory: newMem },
      'puzzle_solved',
    );
  } else if (
    result.itemsAdded?.some(id =>
      ['hidden_symbol_rubbing', 'missing_tablet_fragment', 'echo_crystal_fragment'].includes(id),
    ) && !result.journalEntry
  ) {
    extraJournalText = getGuideDiscoveryComment(
      { ...state, templeMemory: newMem },
      'hidden_found',
    );
  } else if (isFallback && (newMem.consecutiveFails ?? 0) >= 2 && !result.journalEntry) {
    extraJournalText = getGuideDiscoveryComment(
      { ...state, templeMemory: newMem },
      'failed_sequence',
    );
  }

  // ── Merge into result.stateUpdate ─────────────────────────────────────
  const existingUpdate = result.stateUpdate ?? {};
  const mergedUpdate: Partial<typeof state> = {
    ...existingUpdate,
    playerTraits: { ...newTraits, ...(existingUpdate.playerTraits ?? {}) },
    templeMemory: { ...newMem, ...(existingUpdate.templeMemory ?? {}) },
    hintState: { ...newHintState, ...(existingUpdate.hintState ?? {}) },
  };

  const finalJournalEntry = result.journalEntry
    ?? (extraJournalText ? { text: extraJournalText, category: 'observation' as const } : undefined);

  return { ...result, stateUpdate: mergedUpdate, journalEntry: finalJournalEntry };
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
    return withNarrativeSideEffects(handleExamine(state, target), state, cmd);
  }
  if (cmd.startsWith('use ')) {
    const target = cmd.replace(/^use\s+/, '').trim();
    return withNarrativeSideEffects(handleUse(state, target), state, cmd);
  }
  if (cmd === 'help' || cmd === 'commands' || cmd === '?') {
    return ok(`Room ${ROOM_SEQUENCE.indexOf(roomId) + 1} of 9 — ${getRoomTitle(roomId)}.\nUse the action buttons or type: inventory · examine <item> · use <item> · look around · ask temple · ask guide`);
  }

  // ── World status command ──────────────────────────────────────────────────
  if (cmd === 'world status' || cmd === 'status' || cmd === 'temple status') {
    const { playerStats, templeStability, floodLevel } = state;
    const lines = [
      getTorchDescription(playerStats.torchFuel),
      roomId === 'flooded' ? getFloodDescription(floodLevel) : null,
      `Temple Stability: ${templeStability}% — ${getStabilityDescription(templeStability)}`,
    ].filter(Boolean);
    return ok(lines.join('\n\n'));
  }

  // ── Secret discovery check (before puzzle engine) ─────────────────────────
  const secret = checkSecretTrigger(state, cmd);
  if (secret) {
    return withNarrativeSideEffects(
      ok(secret.description, {
        journalEntry: jEntry(secret.journalText, 'discovery'),
        stateUpdate: {
          templeMemory: {
            ...state.templeMemory,
            hiddenDiscoveries: [...state.templeMemory.hiddenDiscoveries, secret.id],
          },
          playerStats: {
            ...state.playerStats,
            observationScore: Math.min(100, state.playerStats.observationScore + 8),
          },
        },
      }),
      state,
      cmd,
    );
  }

  // ── Movement ─────────────────────────────────────────────────────────────
  if (isMovementCommand(cmd)) return handleMovement(state);

  // ── Temple / Guide ────────────────────────────────────────────────────────
  if (cmd.includes('ask temple') || cmd.includes('temple')) return handleTemple(state);
  if (cmd.includes('ask guide') || cmd.includes('ask explorer') || cmd.includes('guide')) return handleGuide(state);

  // ── Special room actions ──────────────────────────────────────────────────
  if (roomId === 'entrance' && (cmd.includes('look around') || cmd.includes('look'))) return withNarrativeSideEffects(entranceLook(state), state, cmd);
  if (roomId === 'guardians' && (cmd.includes('look around') || cmd.includes('look'))) return withNarrativeSideEffects(guardiansLook(state), state, cmd);
  if (roomId === 'echoes' && (cmd.includes('look around') || cmd.includes('look'))) return withNarrativeSideEffects(echoesLook(state), state, cmd);
  if (roomId === 'puzzle' && (cmd.includes('look around') || cmd.includes('look'))) return withNarrativeSideEffects(puzzleLook(state), state, cmd);
  if (roomId === 'library' && (cmd.includes('look around') || cmd.includes('look'))) return withNarrativeSideEffects(libraryLook(state), state, cmd);

  if (roomId === 'flooded' && (cmd.includes('open sluice') || cmd.includes('drain') || cmd.includes('sluice') || cmd.includes('valve'))) {
    return withNarrativeSideEffects(floodedOpenSluice(state), state, cmd);
  }
  if (roomId === 'library' && (cmd.includes('take tablet') || cmd.includes('take drainage') || cmd.includes('grab tablet'))) {
    return withNarrativeSideEffects(libraryTakeTablet(state), state, cmd);
  }
  if (roomId === 'elements' && (cmd.includes('kindle') || cmd.includes('light shrine') || cmd.includes('earth') || cmd.includes('water shrine') || cmd.includes('fire shrine') || cmd.includes('air shrine') || cmd.includes('rotate basin') || cmd.includes('activate shrine'))) {
    return withNarrativeSideEffects(elementsKindleSequence(state, cmd), state, cmd);
  }
  if (roomId === 'sanctum' && (cmd.includes('make offering') || cmd.includes('offer') || cmd.includes('place relic'))) {
    return withNarrativeSideEffects(sanctumMakeOffering(state), state, cmd);
  }
  if (roomId === 'final' && (cmd.includes('take relic') || cmd.includes('refuse') || cmd.includes('return relic') || cmd.includes('claim') || cmd.includes('accept') || cmd.includes('restore') || cmd.includes('put back'))) {
    return withNarrativeSideEffects(finalEnding(state, cmd), state, cmd);
  }

  // ── Puzzle engine ─────────────────────────────────────────────────────────
  const puzzleResult = tryAdvancePuzzle(state, cmd, roomId);
  if (puzzleResult) return withNarrativeSideEffects(puzzleResult, state, cmd);

  // ── Fallback ──────────────────────────────────────────────────────────────
  const fallback = ok(`You pause in the ${getRoomTitle(roomId)}. The stonework absorbs the gesture without reply. Try a more specific action, or ask the guide for a hint.`);
  return withNarrativeSideEffects(fallback, state, cmd);
}
