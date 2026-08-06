/**
 * actionEngine.ts
 * Generates the list of available ActionButtons dynamically based on GameState.
 * No static button lists — every room's actions are computed at render time.
 */
import { ActionButton, GameState, RoomId } from '../types';

const MORE_BTN: ActionButton = {
  id: 'more',
  label: 'MORE',
  iconName: 'MoreHorizontal',
  command: 'more options',
};

const NAV_FORWARD: ActionButton = {
  id: 'move_forward',
  label: 'MOVE FORWARD',
  iconName: 'Footprints',
  command: 'move forward',
};

function hasItem(state: GameState, itemId: string): boolean {
  return state.inventory.some((i) => i.id === itemId);
}

function actionDone(state: GameState, actionId: string): boolean {
  return state.completedActions.includes(actionId);
}

function roomSolved(state: GameState, roomId: RoomId): boolean {
  return state.roomFlags[roomId]?.puzzleSolved ?? false;
}

// ── Per-room action generators ─────────────────────────────────────────────────

function entranceActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const solved = roomSolved(state, 'entrance');

  actions.push({
    id: 'look_around',
    label: 'LOOK AROUND',
    iconName: 'Eye',
    command: 'look around',
  });

  if (!actionDone(state, 'entrance_read_inscription')) {
    actions.push({
      id: 'read_inscription',
      label: 'READ INSCRIPTION',
      iconName: 'FileText',
      command: 'read inscription',
      primary: !solved,
    });
  } else {
    actions.push({
      id: 'inspect_symbols',
      label: 'INSPECT SYMBOLS',
      iconName: 'Search',
      command: 'inspect symbols',
    });
  }

  actions.push({
    id: 'inspect_doors',
    label: 'INSPECT DOORS',
    iconName: 'Search',
    command: 'inspect doors',
  });

  if (!solved) {
    actions.push({
      id: 'light_brazier',
      label: 'LIGHT BRAZIER',
      iconName: 'Flame',
      command: 'light brazier',
      primary: actionDone(state, 'entrance_read_inscription'),
    });
  } else {
    actions.push({
      id: 'push_doors',
      label: 'PUSH OPEN DOORS',
      iconName: 'DoorOpen',
      command: 'push doors',
      primary: true,
    });
  }

  if (state.unlockedRooms.guardians) {
    actions.push({ ...NAV_FORWARD, label: 'ENTER TEMPLE', command: 'move forward' });
  }

  actions.push({
    id: 'ask_guide',
    label: 'ASK GUIDE',
    iconName: 'Compass',
    command: 'ask explorer guide',
  });
  actions.push(MORE_BTN);
  return actions;
}

function guardiansActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const solved = roomSolved(state, 'guardians');

  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  actions.push({ id: 'inspect_statues', label: 'INSPECT STATUES', iconName: 'Search', command: 'inspect statues' });

  if (!actionDone(state, 'guardians_read_carvings')) {
    actions.push({ id: 'read_carvings', label: 'READ CARVINGS', iconName: 'FileText', command: 'read carvings', primary: true });
  }

  if (!solved) {
    actions.push({ id: 'rotate_statue', label: 'ROTATE STATUE', iconName: 'RotateCw', command: 'rotate statue', primary: actionDone(state, 'guardians_read_carvings') });
  }

  if (state.unlockedRooms.echoes) {
    actions.push({ ...NAV_FORWARD, label: 'MOVE NORTH', command: 'move north' });
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

function echoesActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const solved = roomSolved(state, 'echoes');

  actions.push({ id: 'inspect_mechanism', label: 'INSPECT MECHANISM', iconName: 'Search', command: 'inspect mechanism' });
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });

  if (!actionDone(state, 'echoes_listened')) {
    actions.push({ id: 'listen', label: 'LISTEN', iconName: 'Volume2', command: 'listen carefully', primary: true });
  }

  actions.push({ id: 'read_niches', label: 'READ NICHES', iconName: 'FileText', command: 'read niches' });

  if (!solved) {
    actions.push({ id: 'touch_orb', label: 'TOUCH ORB', iconName: 'Hand', command: 'touch orb', primary: actionDone(state, 'echoes_listened') });
  }

  if (state.unlockedRooms.puzzle) {
    actions.push({ ...NAV_FORWARD, label: 'MOVE EAST', command: 'move east' });
  }

  actions.push({ id: 'ask_guide', label: 'ASK GUIDE', iconName: 'Compass', command: 'ask explorer guide' });
  actions.push(MORE_BTN);
  return actions;
}

function puzzleActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const solved = roomSolved(state, 'puzzle');

  actions.push({ id: 'inspect_plates', label: 'INSPECT PLATES', iconName: 'Search', command: 'inspect plates' });
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  actions.push({ id: 'read_symbols', label: 'READ SYMBOLS', iconName: 'FileText', command: 'read symbols' });

  if (!solved) {
    actions.push({ id: 'rotate_plate', label: 'ROTATE PLATE', iconName: 'RotateCw', command: 'rotate plate', primary: actionDone(state, 'puzzle_read_symbols') });
    actions.push({ id: 'reset_puzzle', label: 'RESET PUZZLE', iconName: 'RefreshCw', command: 'reset puzzle' });
  }

  if (state.unlockedRooms.library) {
    actions.push({ ...NAV_FORWARD, label: 'DESCEND STEPS', command: 'move down' });
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

function libraryActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const tabletCollected = hasItem(state, 'drainage_tablet');

  actions.push({ id: 'inspect_tablets', label: 'INSPECT TABLETS', iconName: 'Search', command: 'inspect tablets' });
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  actions.push({ id: 'read_scroll', label: 'READ SCROLL', iconName: 'BookOpen', command: 'read scroll' });

  if (!tabletCollected) {
    actions.push({ id: 'take_tablet', label: 'TAKE TABLET', iconName: 'Hand', command: 'take tablet', primary: true });
  } else {
    actions.push({ id: 'examine_tablet', label: 'EXAMINE TABLET', iconName: 'FileText', command: 'examine drainage tablet', primary: false });
  }

  if (state.unlockedRooms.flooded) {
    actions.push({ ...NAV_FORWARD, label: 'MOVE DOWN', command: 'move down' });
  }

  actions.push({ id: 'ask_guide', label: 'ASK GUIDE', iconName: 'Compass', command: 'ask explorer guide' });
  actions.push(MORE_BTN);
  return actions;
}

function floodedActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const solved = roomSolved(state, 'flooded');

  actions.push({ id: 'inspect_sluices', label: 'INSPECT SLUICES', iconName: 'Search', command: 'inspect sluices' });
  actions.push({ id: 'probe_water', label: 'PROBE WATER', iconName: 'Droplets', command: 'probe water' });
  actions.push({ id: 'read_markings', label: 'READ MARKINGS', iconName: 'FileText', command: 'read markings' });

  if (!solved) {
    const hasFish = hasItem(state, 'bronze_fish');
    const hasTablet = hasItem(state, 'drainage_tablet');
    actions.push({
      id: 'open_sluice',
      label: 'OPEN SLUICE',
      iconName: 'Unlock',
      command: 'open sluice',
      primary: hasFish && hasTablet,
      tooltip: (!hasFish || !hasTablet) ? 'You need the Bronze Fish key and Drainage Tablet first' : undefined,
    });
  }

  if (state.unlockedRooms.elements) {
    actions.push({ ...NAV_FORWARD, label: 'WADE FORWARD', command: 'wade forward' });
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

function elementsActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const solved = roomSolved(state, 'elements');

  actions.push({ id: 'inspect_shrines', label: 'INSPECT SHRINES', iconName: 'Search', command: 'inspect shrines' });
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  actions.push({ id: 'read_ritual', label: 'READ RITUAL', iconName: 'FileText', command: 'read ritual' });

  if (!solved) {
    const hasVessel = hasItem(state, 'ember_vessel');
    actions.push({
      id: 'kindle_shrine',
      label: 'KINDLE SHRINE',
      iconName: 'Flame',
      command: 'kindle shrine',
      primary: actionDone(state, 'elements_read_ritual'),
      tooltip: !hasVessel ? 'Find a vessel to carry ritual fire' : undefined,
    });
    actions.push({ id: 'rotate_basin', label: 'ROTATE BASIN', iconName: 'RotateCw', command: 'rotate basin' });
  }

  if (state.unlockedRooms.sanctum) {
    actions.push({ ...NAV_FORWARD, label: 'MOVE INWARD', command: 'move inward' });
  }

  actions.push({ id: 'ask_guide', label: 'ASK GUIDE', iconName: 'Compass', command: 'ask explorer guide' });
  actions.push(MORE_BTN);
  return actions;
}

function sanctumActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const solved = roomSolved(state, 'sanctum');

  actions.push({ id: 'inspect_statue', label: 'INSPECT STATUE', iconName: 'Search', command: 'inspect statue' });
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  actions.push({ id: 'read_inscription', label: 'READ INSCRIPTION', iconName: 'FileText', command: 'read inscription' });

  if (!solved) {
    const hasRelics = state.inventory.some((i) => i.category === 'relic');
    actions.push({
      id: 'make_offering',
      label: 'MAKE OFFERING',
      iconName: 'Sparkles',
      command: 'make offering',
      primary: hasRelics,
      tooltip: !hasRelics ? 'Gather sacred relics from the temple first' : undefined,
    });
  }

  if (state.unlockedRooms.final) {
    actions.push({ ...NAV_FORWARD, label: 'MOVE DEEPER', command: 'move deeper' });
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

function finalActions(state: GameState): ActionButton[] {
  const actions: ActionButton[] = [];
  const solved = roomSolved(state, 'final');

  actions.push({ id: 'inspect_relic', label: 'INSPECT RELIC', iconName: 'Search', command: 'inspect relic' });
  actions.push({ id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' });
  actions.push({ id: 'read_core', label: 'READ CORE', iconName: 'FileText', command: 'read core' });

  if (!solved) {
    actions.push({ id: 'take_relic', label: 'TAKE RELIC', iconName: 'Hand', command: 'take relic', primary: true });
    actions.push({ id: 'refuse_relic', label: 'REFUSE RELIC', iconName: 'ShieldAlert', command: 'refuse relic' });
  }

  actions.push({ id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' });
  actions.push(MORE_BTN);
  return actions;
}

// ── Public API ─────────────────────────────────────────────────────────────────

const ROOM_ACTION_GENERATORS: Record<RoomId, (state: GameState) => ActionButton[]> = {
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

/**
 * Returns the dynamic action list for the player's current room.
 * Call this every render to get an up-to-date button set.
 */
export function getActionsForRoom(state: GameState): ActionButton[] {
  const generator = ROOM_ACTION_GENERATORS[state.currentRoomId];
  if (!generator) return [MORE_BTN];
  return generator(state);
}
