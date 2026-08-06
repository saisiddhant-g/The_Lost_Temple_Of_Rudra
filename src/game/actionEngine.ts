/**
 * actionEngine.ts
 * Generates dynamic ActionButton[] from GameState.
 * Actions evolve as puzzle steps complete and items are collected.
 */
import { ActionButton, GameState, RoomId } from '../types';
import { ROOM_PUZZLE_MAP } from './puzzleRegistry';

// ── Shared buttons ────────────────────────────────────────────────────────────
const MORE_BTN: ActionButton = { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' };

function nav(label: string, command: string): ActionButton {
  return { id: 'move_forward', label, iconName: 'Footprints', command };
}

// ── State queries ─────────────────────────────────────────────────────────────
function hasItem(state: GameState, id: string): boolean {
  return state.inventory.some((i) => i.id === id);
}

function stepDone(state: GameState, roomId: RoomId, stepId: string): boolean {
  const puzzleId = ROOM_PUZZLE_MAP[roomId];
  if (!puzzleId) return false;
  return state.puzzleProgress[puzzleId]?.stepsCompleted.includes(stepId) ?? false;
}

function puzzleSolved(state: GameState, roomId: RoomId): boolean {
  return state.roomFlags[roomId]?.puzzleSolved ?? false;
}

// ── ENTRANCE ──────────────────────────────────────────────────────────────────
function entranceActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'entrance');
  const readDone = stepDone(state, 'entrance', 'entrance_s1');
  const hiddenDone = stepDone(state, 'entrance', 'entrance_s2');
  const actions: ActionButton[] = [];

  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  actions.push({ id: 'inspect_doors', label: 'INSPECT DOORS', iconName: 'Search', command: 'inspect doors' });

  if (!readDone) {
    actions.push({ id: 'read_inscription', label: 'READ INSCRIPTION', iconName: 'FileText', command: 'read inscription', primary: true });
  } else if (!hiddenDone) {
    actions.push({ id: 'inspect_symbols', label: 'REVEAL HIDDEN SYMBOLS', iconName: 'Search', command: 'inspect symbols', primary: true });
  } else if (!solved) {
    actions.push({ id: 'light_brazier', label: 'LIGHT BRAZIER', iconName: 'Flame', command: 'light brazier', primary: true });
  }

  if (solved) {
    actions.push({ id: 'translate_glyphs', label: 'TRANSLATE GLYPHS', iconName: 'FileText', command: 'examine hidden symbol rubbing' });
    actions.push(nav('ENTER TEMPLE', 'move forward'));
  }

  actions.push({ id: 'ask_guide', label: 'ASK GUIDE', iconName: 'Compass', command: 'ask explorer guide' });
  actions.push(MORE_BTN);
  return actions;
}

// ── GUARDIANS ─────────────────────────────────────────────────────────────────
function guardiansActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'guardians');
  const floorDone = stepDone(state, 'guardians', 'guardians_s1');
  const carvingsDone = stepDone(state, 'guardians', 'guardians_s2');
  const actions: ActionButton[] = [];

  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  actions.push({ id: 'inspect_statues', label: 'INSPECT STATUES', iconName: 'Search', command: 'inspect statues' });

  if (!floorDone) {
    actions.push({ id: 'study_floor', label: 'STUDY FLOOR MARKINGS', iconName: 'Grid', command: 'look around', primary: true });
  }
  if (floorDone && !carvingsDone) {
    actions.push({ id: 'read_carvings', label: 'READ CARVINGS', iconName: 'FileText', command: 'read carvings', primary: true });
  }
  if (carvingsDone && !solved) {
    actions.push({ id: 'rotate_statue', label: 'ROTATE SENTINELS', iconName: 'RotateCw', command: 'rotate statue', primary: true });
  }
  if (solved) {
    actions.push(nav('MOVE NORTH', 'move north'));
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

// ── ECHOES ────────────────────────────────────────────────────────────────────
function echoesActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'echoes');
  const listenDone = stepDone(state, 'echoes', 'echoes_s1');
  const crystalsDone = stepDone(state, 'echoes', 'echoes_s2');
  const actions: ActionButton[] = [];

  actions.push({ id: 'inspect_mechanism', label: 'INSPECT MECHANISM', iconName: 'Search', command: 'inspect mechanism' });
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });

  if (!listenDone) {
    actions.push({ id: 'listen', label: 'LISTEN CAREFULLY', iconName: 'Volume2', command: 'listen carefully', primary: true });
  }
  if (listenDone && !crystalsDone) {
    actions.push({ id: 'activate_crystals', label: 'ACTIVATE CRYSTALS', iconName: 'Zap', command: 'activate crystal', primary: true });
    actions.push({ id: 'read_niches', label: 'READ NICHES', iconName: 'FileText', command: 'read niches' });
  }
  if (crystalsDone && !solved) {
    actions.push({ id: 'touch_orb', label: 'ATTUNE ORB', iconName: 'Hand', command: 'touch orb', primary: true });
  }
  if (solved) {
    actions.push(nav('MOVE EAST', 'move east'));
  }

  actions.push({ id: 'ask_guide', label: 'ASK GUIDE', iconName: 'Compass', command: 'ask explorer guide' });
  actions.push(MORE_BTN);
  return actions;
}

// ── PUZZLE CHAMBER ────────────────────────────────────────────────────────────
function puzzleActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'puzzle');
  const inspectedDone = stepDone(state, 'puzzle', 'puzzle_s1');
  const decodedDone = stepDone(state, 'puzzle', 'puzzle_s2');
  const actions: ActionButton[] = [];

  if (!inspectedDone) {
    actions.push({ id: 'inspect_plates', label: 'INSPECT PLATES', iconName: 'Search', command: 'inspect plates', primary: true });
  } else {
    actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  }

  if (inspectedDone && !decodedDone) {
    actions.push({ id: 'read_symbols', label: 'DECODE SYMBOLS', iconName: 'FileText', command: 'read symbols', primary: true });
  }
  if (decodedDone && !solved) {
    actions.push({ id: 'rotate_plate', label: 'ROTATE PLATES', iconName: 'RotateCw', command: 'rotate plate', primary: true });
    actions.push({ id: 'reset_puzzle', label: 'RESET PLATES', iconName: 'RefreshCw', command: 'reset puzzle' });
  }
  if (solved) {
    actions.push({ id: 'examine_rubbing', label: 'EXAMINE RUBBING', iconName: 'FileText', command: 'examine glyph rubbing' });
    actions.push(nav('DESCEND STEPS', 'move down'));
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

// ── LIBRARY ───────────────────────────────────────────────────────────────────
function libraryActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'library');
  const surveyDone = stepDone(state, 'library', 'library_s1');
  const fragmentFound = hasItem(state, 'missing_tablet_fragment');
  const tabletHeld = hasItem(state, 'drainage_tablet');
  const actions: ActionButton[] = [];

  if (!surveyDone) {
    actions.push({ id: 'survey_stacks', label: 'SURVEY STACKS', iconName: 'Search', command: 'survey stacks', primary: true });
  } else {
    actions.push({ id: 'inspect_tablets', label: 'INSPECT TABLETS', iconName: 'Search', command: 'inspect tablets' });
  }
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });

  if (surveyDone && !fragmentFound && !tabletHeld) {
    actions.push({ id: 'search_fragment', label: 'SEARCH FOR FRAGMENT', iconName: 'Search', command: 'search fragment', primary: true });
  }
  if (fragmentFound && !tabletHeld) {
    actions.push({ id: 'read_scroll', label: 'READ COMBINED DIAGRAM', iconName: 'BookOpen', command: 'read scroll', primary: true });
  }
  if (stepDone(state, 'library', 'library_s3') && !tabletHeld) {
    actions.push({ id: 'take_tablet', label: 'TAKE DRAINAGE TABLET', iconName: 'Hand', command: 'take tablet', primary: true });
  }
  if (tabletHeld) {
    actions.push({ id: 'examine_tablet', label: 'EXAMINE TABLET', iconName: 'FileText', command: 'examine drainage tablet' });
  }
  if (solved) {
    actions.push(nav('MOVE DOWN', 'move down'));
  }

  actions.push({ id: 'ask_guide', label: 'ASK GUIDE', iconName: 'Compass', command: 'ask explorer guide' });
  actions.push(MORE_BTN);
  return actions;
}

// ── FLOODED ───────────────────────────────────────────────────────────────────
function floodedActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'flooded');
  const probedDone = stepDone(state, 'flooded', 'flooded_s1');
  const relicFound = hasItem(state, 'submerged_relic');
  const hasFish = hasItem(state, 'bronze_fish');
  const hasTablet = hasItem(state, 'drainage_tablet');
  const actions: ActionButton[] = [];

  if (!probedDone) {
    actions.push({ id: 'probe_water', label: 'PROBE WATER', iconName: 'Droplets', command: 'probe water', primary: true });
  } else {
    actions.push({ id: 'probe_water', label: 'PROBE WATER', iconName: 'Droplets', command: 'probe water' });
  }

  if (probedDone && !relicFound) {
    actions.push({ id: 'recover_relic', label: 'RECOVER RELIC', iconName: 'Hand', command: 'recover relic', primary: true });
  }

  actions.push({ id: 'inspect_sluices', label: 'INSPECT SLUICES', iconName: 'Search', command: 'inspect sluices' });
  actions.push({ id: 'read_markings', label: 'READ MARKINGS', iconName: 'FileText', command: 'read markings' });

  if (!solved) {
    actions.push({
      id: 'open_sluice',
      label: 'OPEN SLUICE',
      iconName: 'Unlock',
      command: 'open sluice',
      primary: hasFish && hasTablet,
      tooltip: (!hasFish || !hasTablet) ? 'Needs Bronze Fish key + Drainage Tablet' : undefined,
    });
  }
  if (solved) {
    actions.push(nav('WADE FORWARD', 'wade forward'));
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

// ── ELEMENTS ──────────────────────────────────────────────────────────────────
function elementsActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'elements');
  const inspectedDone = stepDone(state, 'elements', 'elements_s1');
  const ritualReadDone = stepDone(state, 'elements', 'elements_s2');
  const data = state.roomFlags.elements?.customData as Record<string, boolean> ?? {};
  const actions: ActionButton[] = [];

  if (!inspectedDone) {
    actions.push({ id: 'inspect_shrines', label: 'INSPECT SHRINES', iconName: 'Search', command: 'inspect shrines', primary: true });
  } else {
    actions.push({ id: 'inspect_shrines', label: 'INSPECT SHRINES', iconName: 'Search', command: 'inspect shrines' });
  }
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });

  if (inspectedDone && !ritualReadDone) {
    actions.push({ id: 'read_ritual', label: 'READ RITUAL', iconName: 'FileText', command: 'read ritual', primary: true });
  }

  if (ritualReadDone && !solved) {
    if (!data.earth) actions.push({ id: 'kindle_earth', label: 'KINDLE EARTH', iconName: 'Mountain', command: 'kindle earth shrine', primary: true });
    else if (!data.water) actions.push({ id: 'kindle_water', label: 'KINDLE WATER', iconName: 'Droplets', command: 'kindle water shrine', primary: true });
    else if (!data.fire) actions.push({ id: 'kindle_fire', label: 'KINDLE FIRE', iconName: 'Flame', command: 'kindle fire shrine', primary: true });
    else if (!data.air) actions.push({ id: 'kindle_air', label: 'KINDLE AIR', iconName: 'Wind', command: 'kindle air shrine', primary: true });
  }
  if (solved) {
    actions.push(nav('MOVE INWARD', 'move inward'));
  }

  actions.push({ id: 'ask_guide', label: 'ASK GUIDE', iconName: 'Compass', command: 'ask explorer guide' });
  actions.push(MORE_BTN);
  return actions;
}

// ── SANCTUM ───────────────────────────────────────────────────────────────────
function sanctumActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'sanctum');
  const approachedDone = stepDone(state, 'sanctum', 'sanctum_s1');
  const inscriptionDone = stepDone(state, 'sanctum', 'sanctum_s2');
  const hasRelics = state.inventory.some((i) => i.category === 'relic');
  const actions: ActionButton[] = [];

  if (!approachedDone) {
    actions.push({ id: 'inspect_statue', label: 'INSPECT STATUE', iconName: 'Search', command: 'inspect statue', primary: true });
  } else {
    actions.push({ id: 'inspect_statue', label: 'INSPECT STATUE', iconName: 'Search', command: 'inspect statue' });
  }
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });

  if (approachedDone && !inscriptionDone) {
    actions.push({ id: 'read_inscription', label: 'READ PEDESTAL', iconName: 'FileText', command: 'read inscription', primary: true });
  }
  if (inscriptionDone && !solved) {
    actions.push({
      id: 'make_offering',
      label: 'MAKE OFFERING',
      iconName: 'Sparkles',
      command: 'make offering',
      primary: hasRelics,
      tooltip: !hasRelics ? 'Gather sacred relics first' : undefined,
    });
  }
  if (solved) {
    actions.push(nav('MOVE DEEPER', 'move deeper'));
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

// ── FINAL ─────────────────────────────────────────────────────────────────────
function finalActions(state: GameState): ActionButton[] {
  const solved = puzzleSolved(state, 'final');
  const inspectedDone = stepDone(state, 'final', 'final_s1');
  const coreReadDone = stepDone(state, 'final', 'final_s2');
  const actions: ActionButton[] = [];

  if (!inspectedDone) {
    actions.push({ id: 'inspect_relic', label: 'INSPECT THE EYE', iconName: 'Search', command: 'inspect relic', primary: true });
  }
  if (inspectedDone && !coreReadDone) {
    actions.push({ id: 'read_core', label: 'READ THE CORE', iconName: 'FileText', command: 'read core', primary: true });
  }
  if (coreReadDone && !solved) {
    actions.push({ id: 'take_relic', label: 'ACCEPT THE EYE', iconName: 'Hand', command: 'take relic', primary: true });
    actions.push({ id: 'refuse_relic', label: 'REFUSE THE EYE', iconName: 'ShieldAlert', command: 'refuse relic' });
    actions.push({ id: 'return_relic', label: 'RESTORE THE EYE', iconName: 'RefreshCw', command: 'return relic' });
  }
  if (!solved) {
    actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

// ── Registry + export ─────────────────────────────────────────────────────────
const GENERATORS: Record<RoomId, (s: GameState) => ActionButton[]> = {
  entrance: entranceActions,
  guardians: guardiansActions,
  echoes: echoesActions,
  puzzle: puzzleActions,
  library: libraryActions,
  flooded: floodedActions,
  elements: elementsActions,
  sanctum: sanctumActions,
  final: finalActions,
};

export function getActionsForRoom(state: GameState): ActionButton[] {
  const gen = GENERATORS[state.currentRoomId];
  if (!gen) return [MORE_BTN];
  return gen(state);
}
