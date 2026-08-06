import { RoomData, RoomId, WorldModel } from '../types';

export const INITIAL_ROOM_DATA: Record<RoomId, RoomData> = {
  entrance: {
    id: 'entrance',
    chapter: 'CHAPTER I',
    title: 'TEMPLE ENTRANCE',
    objectiveTitle: 'Light the brazier and open the sealed gate',
    visualTheme: {
      primaryColor: '#c8aa6e',
      ambientLight: 'rgba(212, 142, 44, 0.25)',
      particles: 'dust',
    },
    narrationLines: [
      'Rain has been falling on this doorway for a thousand years. It has not worn it down.',
      'Two lion guardians hold the threshold, their manes furred with vine. Between them, stone doors taller than three men.',
      'Your torch finds an inscription cut deep into the lintel — and something behind it stirs, as if the temple has been waiting for a reader.'
    ],
    contextualActions: [
      { id: 'inspect_doors', label: 'INSPECT DOORS', iconName: 'Search', command: 'inspect doors' },
      { id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' },
      { id: 'read_inscription', label: 'READ INSCRIPTION', iconName: 'FileText', command: 'read inscription', primary: true },
      { id: 'light_brazier', label: 'LIGHT BRAZIER', iconName: 'Flame', command: 'light brazier' },
      { id: 'move_forward', label: 'MOVE FORWARD', iconName: 'Footprints', command: 'move forward' },
      { id: 'ask_guide', label: 'ASK EXPLORER GUIDE', iconName: 'Compass', command: 'ask explorer guide' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [
      { id: 'torch', name: 'Oil Torch', description: 'Imbued with tallow and resin. Burns with steady gold illumination.', category: 'collectible', condition: 'Lit (100%)' },
      { id: 'journal', name: 'Field Journal', description: 'Leather-bound archaeological notes recording previous expeditions.', category: 'collectible', condition: 'Used' },
      { id: 'compass', name: 'Brass Compass', description: 'Ancient magnetic compass that spins strangely near Rudra masonry.', category: 'tool', condition: 'Functional' },
      { id: 'rope', name: 'Rope Coil', description: 'Heavy hemp rope suitable for descending shafts.', category: 'tool', condition: 'Sturdy' },
    ],
    objective: {
      id: 'obj_entrance',
      title: 'Light the brazier and open the sealed gate',
      tasks: [
        { id: 't1', text: 'Read the threshold inscription', completed: true },
        { id: 't2', text: 'Light the torch bracket', completed: false },
        { id: 't3', text: 'Force the sealed doors', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j1', text: '“Day 41 — Local maps end where the jungle begins. The temple is not on any of them.”', category: 'lore' },
      { id: 'j2', text: '“The lion carvings match Rudra-cult masonry from three valleys east.”', category: 'lore' }
    ],
    evaluationState: {
      torch: 100,
      resolve: 'Steady',
      templeFavor: 'Neutral'
    },
    puzzleSolved: false
  },

  guardians: {
    id: 'guardians',
    chapter: 'CHAPTER II',
    title: 'HALL OF GUARDIANS',
    objectiveTitle: 'Pass the four watchers without waking them',
    visualTheme: {
      primaryColor: '#8ca6cc',
      ambientLight: 'rgba(64, 120, 192, 0.25)',
      particles: 'dust',
    },
    narrationLines: [
      'Four sentinels stand where the corridor widens, carved from a single vein of black stone.',
      'Pale blue light falls from a fracture far above, and the geometric markings on the floor drink it in.',
      'Their eyes follow the torch. Not you — the torch.'
    ],
    contextualActions: [
      { id: 'inspect_statues', label: 'INSPECT STATUES', iconName: 'Search', command: 'inspect statues' },
      { id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' },
      { id: 'read_carvings', label: 'READ CARVINGS', iconName: 'FileText', command: 'read carvings', primary: true },
      { id: 'rotate_statue', label: 'ROTATE STATUE', iconName: 'RotateCw', command: 'rotate statue' },
      { id: 'move_north', label: 'MOVE NORTH', iconName: 'Footprints', command: 'move north' },
      { id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [
      { id: 'rubbing', name: 'Threshold Rubbing', description: 'Charcoal transfer of the entrance lintel inscription.', category: 'collectible' }
    ],
    objective: {
      id: 'obj_guardians',
      title: 'Pass the four watchers without waking them',
      tasks: [
        { id: 'gt1', text: 'Study the floor markings', completed: true },
        { id: 'gt2', text: "Match each guardian's gesture", completed: false },
        { id: 'gt3', text: 'Cross to the far arch', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j3', text: '“The doors closed behind me on their own. I did not push them.”', category: 'observation' },
      { id: 'j4', text: '“Guardian gestures may encode an order, not a warning.”', category: 'lore' }
    ],
    evaluationState: {
      torch: 94,
      resolve: 'Uneasy',
      templeFavor: 'Watched'
    },
    puzzleSolved: false
  },

  echoes: {
    id: 'echoes',
    chapter: 'CHAPTER III',
    title: 'HALL OF ECHOES',
    objectiveTitle: "Attune the resonance mechanism to the temple's pulse",
    visualTheme: {
      primaryColor: '#e0bb6b',
      ambientLight: 'rgba(224, 187, 107, 0.3)',
      particles: 'sparks',
    },
    narrationLines: [
      'The hall answers every footstep twice — once for you, once for something a half-second behind.',
      'Wet stone mirrors the torchlight. A circular mechanism waits at the centre, ringed by niched deities.',
      'When you hold your breath, the second footstep keeps walking.'
    ],
    contextualActions: [
      { id: 'inspect_mechanism', label: 'INSPECT MECHANISM', iconName: 'Search', command: 'inspect mechanism' },
      { id: 'listen', label: 'LISTEN', iconName: 'Volume2', command: 'listen carefully', primary: true },
      { id: 'read_niches', label: 'READ NICHES', iconName: 'FileText', command: 'read niches' },
      { id: 'touch_orb', label: 'TOUCH ORB', iconName: 'Hand', command: 'touch orb' },
      { id: 'move_east', label: 'MOVE EAST', iconName: 'Footprints', command: 'move east' },
      { id: 'ask_guide', label: 'ASK EXPLORER GUIDE', iconName: 'Compass', command: 'ask explorer guide' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [
      { id: 'shard', name: 'Resonance Shard', description: 'Vibrates slightly when held near ancient machinery.', category: 'relic' }
    ],
    objective: {
      id: 'obj_echoes',
      title: "Attune the resonance mechanism to the temple's pulse",
      tasks: [
        { id: 'et1', text: 'Locate the central mechanism', completed: true },
        { id: 'et2', text: 'Find the true echo interval', completed: false },
        { id: 'et3', text: 'Attune the orb', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j5', text: '“There is a second set of footsteps. I have stopped writing them down.”', category: 'observation' },
      { id: 'j6', text: '“Interval: one beat and a half. Recorded in case I forget my own rhythm.”', category: 'lore' }
    ],
    evaluationState: {
      torch: 89,
      resolve: 'Fraying',
      templeFavor: 'Curious'
    },
    puzzleSolved: false
  },

  puzzle: {
    id: 'puzzle',
    chapter: 'CHAPTER IV',
    title: 'PUZZLE CHAMBER',
    objectiveTitle: "Align the glyph plates to spell Rudra's name",
    visualTheme: {
      primaryColor: '#e5ab53',
      ambientLight: 'rgba(229, 171, 83, 0.35)',
      particles: 'sparks',
    },
    narrationLines: [
      'Golden script crawls across the floor and up the walls, alive and unhurried.',
      'Five plates sit in a cross. Behind them, a gate held by ancient engineering — counterweights the size of oxen.',
      'Every wrong rotation dims one torch. The room keeps the tally.'
    ],
    contextualActions: [
      { id: 'inspect_plates', label: 'INSPECT PLATES', iconName: 'Search', command: 'inspect plates' },
      { id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' },
      { id: 'read_symbols', label: 'READ SYMBOLS', iconName: 'FileText', command: 'read symbols' },
      { id: 'rotate_plate', label: 'ROTATE PLATE', iconName: 'RotateCw', command: 'rotate plate', primary: true },
      { id: 'reset_puzzle', label: 'RESET PUZZLE', iconName: 'RefreshCw', command: 'reset puzzle' },
      { id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [
      { id: 'glyph_rubbing', name: 'Glyph Rubbing', description: 'Detailed parchment of ancient Sanskrit-derived temple glyphs.', category: 'collectible' }
    ],
    objective: {
      id: 'obj_puzzle',
      title: "Align the glyph plates to spell Rudra's name",
      tasks: [
        { id: 'pt1', text: 'Wake the floor plates', completed: true },
        { id: 'pt2', text: 'Rotate plates into sequence', completed: false },
        { id: 'pt3', text: 'Open the locked gate', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j7', text: '“Blank plate = the unspeakable syllable. Leave it untouched.”', category: 'lore' },
      { id: 'j8', text: '“Three failed rotations. Three torches gone. I am running out of light to be wrong with.”', category: 'observation' }
    ],
    evaluationState: {
      torch: 72,
      resolve: 'Fraying',
      templeFavor: 'Tested'
    },
    puzzleSolved: false
  },

  library: {
    id: 'library',
    chapter: 'CHAPTER V',
    title: 'LIBRARY OF WHISPERS',
    objectiveTitle: 'Recover the drainage tablet from the whispering stacks',
    visualTheme: {
      primaryColor: '#7baed0',
      ambientLight: 'rgba(92, 160, 200, 0.3)',
      particles: 'dust',
    },
    narrationLines: [
      'Thousands of stone tablets rise into the dark, each one a sentence the temple refused to forget.',
      'Cold blue light drifts down through the fracture. Dust hangs in it, unmoving, as if listening back.',
      'The whispers are not one voice. Some of them are lying.'
    ],
    contextualActions: [
      { id: 'inspect_tablets', label: 'INSPECT TABLETS', iconName: 'Search', command: 'inspect tablets' },
      { id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' },
      { id: 'read_scroll', label: 'READ SCROLL', iconName: 'BookOpen', command: 'read scroll' },
      { id: 'take_tablet', label: 'TAKE TABLET', iconName: 'Hand', command: 'take tablet', primary: true },
      { id: 'move_down', label: 'MOVE DOWN', iconName: 'Footprints', command: 'move down' },
      { id: 'ask_guide', label: 'ASK EXPLORER GUIDE', iconName: 'Compass', command: 'ask explorer guide' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [
      { id: 'drainage_tablet', name: 'Drainage Tablet', description: 'Heavy slate inscribed with hydraulic canal diagrams.', category: 'relic' }
    ],
    objective: {
      id: 'obj_library',
      title: 'Recover the drainage tablet from the whispering stacks',
      tasks: [
        { id: 'lt1', text: 'Survey the stacks', completed: true },
        { id: 'lt2', text: 'Silence the false whispers', completed: false },
        { id: 'lt3', text: 'Take the drainage tablet', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j9', text: '“The tablets are shelved by grief, not by subject.”', category: 'lore' },
      { id: 'j10', text: '“Third mouth. Not the first. Written twice, which means someone died learning it.”', category: 'lore' }
    ],
    evaluationState: {
      torch: 66,
      resolve: 'Thin',
      templeFavor: 'Wary'
    },
    puzzleSolved: false
  },

  flooded: {
    id: 'flooded',
    chapter: 'CHAPTER VI',
    title: 'FLOODED CORRIDOR',
    objectiveTitle: 'Open the third sluice and drain the corridor',
    visualTheme: {
      primaryColor: '#5a9aa8',
      ambientLight: 'rgba(50, 130, 150, 0.35)',
      particles: 'water',
    },
    narrationLines: [
      'Black water swallows the carved pillars. Roots hang from the ceiling like severed cable.',
      'Your torch doubles itself on the surface — two flames, one of them slower.',
      'Ahead, the bridge has given up. Beneath it, the temple\'s old drainage throats gape in a row.'
    ],
    contextualActions: [
      { id: 'inspect_sluices', label: 'INSPECT SLUICES', iconName: 'Search', command: 'inspect sluices' },
      { id: 'probe_water', label: 'PROBE WATER', iconName: 'Droplets', command: 'probe water' },
      { id: 'read_markings', label: 'READ MARKINGS', iconName: 'FileText', command: 'read markings' },
      { id: 'open_sluice', label: 'OPEN SLUICE', iconName: 'Unlock', command: 'open sluice', primary: true },
      { id: 'wade_forward', label: 'WADE FORWARD', iconName: 'Footprints', command: 'wade forward' },
      { id: 'ask_temple', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [
      { id: 'bronze_fish', name: 'Bronze Fish', description: 'Weighted mechanical counterweight key used in sluice gates.', category: 'tool' }
    ],
    objective: {
      id: 'obj_flooded',
      title: 'Open the third sluice and drain the corridor',
      tasks: [
        { id: 'fl1', text: 'Probe the flooded floor', completed: true },
        { id: 'fl2', text: 'Reach the broken bridge', completed: false },
        { id: 'fl3', text: 'Open the third sluice', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j11', text: '“Reflection lag confirmed here too. It is not the water.”', category: 'observation' },
      { id: 'j12', text: '“Do not open the first sluice. Claw marks on the inside face.”', category: 'lore' }
    ],
    evaluationState: {
      torch: 58,
      resolve: 'Thin',
      templeFavor: 'Favored'
    },
    puzzleSolved: false
  },

  elements: {
    id: 'elements',
    chapter: 'CHAPTER VII',
    title: 'CHAMBER OF ELEMENTS',
    objectiveTitle: 'Kindle the four shrines in the true order',
    visualTheme: {
      primaryColor: '#df924b',
      ambientLight: 'rgba(223, 146, 75, 0.35)',
      particles: 'embers',
    },
    narrationLines: [
      'Four shrines face a ritual platform ringed in gold inlay: fire, water, earth, air.',
      'Each breathes its own weather — embers, mist, dust, a slow cold draft that has nowhere to come from.',
      'The inlay is a single unbroken line. Break the order and it will close on you instead.'
    ],
    contextualActions: [
      { id: 'inspect_shrines', label: 'INSPECT SHRINES', iconName: 'Search', command: 'inspect shrines' },
      { id: 'look_around', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' },
      { id: 'read_ritual', label: 'READ RITUAL', iconName: 'FileText', command: 'read ritual' },
      { id: 'kindle_shrine', label: 'KINDLE SHRINE', iconName: 'Flame', command: 'kindle shrine', primary: true },
      { id: 'rotate_basin', label: 'ROTATE BASIN', iconName: 'RotateCw', command: 'rotate basin' },
      { id: 'move_inward', label: 'MOVE INWARD', iconName: 'Footprints', command: 'move inward' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [
      { id: 'ember_vessel', name: 'Ember Vessel', description: 'Sacred brass vessel carrying perpetual sacred ritual ash.', category: 'relic' }
    ],
    objective: {
      id: 'obj_elements',
      title: 'Kindle the four shrines in the true order',
      tasks: [
        { id: 'el1', text: 'Examine each shrine', completed: true },
        { id: 'el2', text: 'Determine the elemental order', completed: false },
        { id: 'el3', text: 'Complete the ritual circle', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j13', text: '“Order: earth, water, fire, air. Holds, carries, changes, remains.”', category: 'lore' },
      { id: 'j14', text: '“The air shrine is unfinished. Whoever built this ran out of time, not devotion.”', category: 'lore' }
    ],
    evaluationState: {
      torch: 44,
      resolve: 'Hardened',
      templeFavor: 'Favored'
    },
    puzzleSolved: false
  },

  sanctum: {
    id: 'sanctum',
    chapter: 'CHAPTER VIII',
    title: 'SANCTUM OF RUDRA',
    objectiveTitle: 'Make the offering Rudra will accept',
    visualTheme: {
      primaryColor: '#e07a38',
      ambientLight: 'rgba(224, 122, 56, 0.4)',
      particles: 'embers',
    },
    narrationLines: [
      'The hall opens into something that should not fit inside a mountain.',
      'Rudra sits in stone, many-armed, crowned in flame, eyes lowered at the ring of gold beneath your feet.',
      'Embers drift upward instead of down. The temple is holding its breath with you.'
    ],
    contextualActions: [
      { id: 'inspect_statue_sanctum', label: 'INSPECT STATUE', iconName: 'Search', command: 'inspect statue' },
      { id: 'look_around_sanctum', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' },
      { id: 'read_inscription_sanctum', label: 'READ INSCRIPTION', iconName: 'FileText', command: 'read inscription' },
      { id: 'make_offering', label: 'MAKE OFFERING', iconName: 'Sparkles', command: 'make offering', primary: true },
      { id: 'ask_temple_sanctum', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' },
      { id: 'move_deeper', label: 'MOVE DEEPER', iconName: 'Footprints', command: 'move deeper' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [],
    objective: {
      id: 'obj_sanctum',
      title: 'Make the offering Rudra will accept',
      tasks: [
        { id: 'st1', text: 'Approach the divine statue', completed: true },
        { id: 'st2', text: 'Choose the offering', completed: false },
        { id: 'st3', text: 'Speak the unspoken syllable', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j15', text: '“Every account of this room ends mid-sentence.”', category: 'lore' },
      { id: 'j16', text: '“The gap in the name is the blank plate again. The same silence, larger.”', category: 'lore' }
    ],
    evaluationState: {
      torch: 31,
      resolve: 'Resolute',
      templeFavor: 'Recognised'
    },
    puzzleSolved: false
  },

  final: {
    id: 'final',
    chapter: 'CHAPTER IX',
    title: 'FINAL CHAMBER',
    objectiveTitle: 'Take the relic before the core collapses',
    visualTheme: {
      primaryColor: '#b27edb',
      ambientLight: 'rgba(178, 126, 219, 0.45)',
      particles: 'sparks',
    },
    narrationLines: [
      'The core hangs above a cracked altar: a sphere of violet light bound in carved bronze.',
      'Pillars fail one by one. Slabs lift instead of falling, caught in whatever the relic is doing to gravity.',
      'The whispers resolve into a single voice, and it is using your own cadence.'
    ],
    contextualActions: [
      { id: 'inspect_relic', label: 'INSPECT RELIC', iconName: 'Search', command: 'inspect relic' },
      { id: 'look_around_final', label: 'LOOK AROUND', iconName: 'Eye', command: 'look around' },
      { id: 'read_core', label: 'READ CORE', iconName: 'FileText', command: 'read core' },
      { id: 'take_relic', label: 'TAKE RELIC', iconName: 'Hand', command: 'take relic', primary: true },
      { id: 'refuse_relic', label: 'REFUSE RELIC', iconName: 'ShieldAlert', command: 'refuse relic' },
      { id: 'ask_temple_final', label: 'ASK TEMPLE', iconName: 'Flame', command: 'ask temple' },
      { id: 'more', label: 'MORE', iconName: 'MoreHorizontal', command: 'more options' },
    ],
    defaultItems: [
      { id: 'fragment', name: 'Temple Core Fragment', description: 'Pulsing crystal containing the living memory of Rudra.', category: 'relic' }
    ],
    objective: {
      id: 'obj_final',
      title: 'Take the relic before the core collapses',
      tasks: [
        { id: 'ft1', text: 'Reach the temple core', completed: true },
        { id: 'ft2', text: 'Survive the collapse', completed: false },
        { id: 'ft3', text: 'Claim — or refuse — the relic', completed: false },
      ]
    },
    journalEntries: [
      { id: 'j17', text: '“The lock is not the door. The lock is the visitor.”', category: 'lore' },
      { id: 'j18', text: '“If this is the last entry — I chose with my eyes open.”', category: 'lore' }
    ],
    evaluationState: {
      torch: 12,
      resolve: 'Unbroken',
      templeFavor: 'Chosen'
    },
    puzzleSolved: false
  }
};

export const INITIAL_WORLD_MODEL: WorldModel = {
  currentRoomId: 'entrance',
  unlockedRooms: {
    entrance: true,
    guardians: true,
    echoes: true,
    puzzle: true,
    library: true,
    flooded: true,
    elements: true,
    sanctum: true,
    final: true,
  },
  inventory: [
    { id: 'torch', name: 'Oil Torch', description: 'Imbued with tallow and resin. Burns with steady gold illumination.', category: 'collectible', condition: 'Lit (100%)' },
    { id: 'journal', name: 'Field Journal', description: 'Leather-bound archaeological notes recording previous expeditions.', category: 'collectible', condition: 'Used' },
    { id: 'compass', name: 'Brass Compass', description: 'Ancient magnetic compass that spins strangely near Rudra masonry.', category: 'tool', condition: 'Functional' },
    { id: 'rope', name: 'Rope Coil', description: 'Heavy hemp rope suitable for descending shafts.', category: 'tool', condition: 'Sturdy' },
  ],
  objectives: {
    entrance: INITIAL_ROOM_DATA.entrance.objective,
    guardians: INITIAL_ROOM_DATA.guardians.objective,
    echoes: INITIAL_ROOM_DATA.echoes.objective,
    puzzle: INITIAL_ROOM_DATA.puzzle.objective,
    library: INITIAL_ROOM_DATA.library.objective,
    flooded: INITIAL_ROOM_DATA.flooded.objective,
    elements: INITIAL_ROOM_DATA.elements.objective,
    sanctum: INITIAL_ROOM_DATA.sanctum.objective,
    final: INITIAL_ROOM_DATA.final.objective,
  },
  journal: [
    { id: 'j1', text: '“Day 41 — Local maps end where the jungle begins. The temple is not on any of them.”', category: 'lore' },
    { id: 'j2', text: '“The lion carvings match Rudra-cult masonry from three valleys east.”', category: 'lore' }
  ],
  evaluation: {
    torch: 100,
    resolve: 'Steady',
    templeFavor: 'Neutral',
    observationScore: 85,
    curiosityScore: 90,
    patienceScore: 88,
    integrityScore: 92,
    greedScore: 10,
  },
  turns: 1,
  puzzleStates: {
    entrance: { solved: false, progress: 1 },
    guardians: { solved: false, progress: 0 },
    echoes: { solved: false, progress: 0 },
    puzzle: { solved: false, progress: 0 },
    library: { solved: false, progress: 0 },
    flooded: { solved: false, progress: 0 },
    elements: { solved: false, progress: 0 },
    sanctum: { solved: false, progress: 0 },
    final: { solved: false, progress: 0 },
  },
  eventHistory: [
    { turn: 1, text: 'Crossed the ancient threshold into the Lost Temple of Rudra.', roomId: 'entrance' }
  ],
  templePhase: 1,
  isCollapsing: false,
  gameCompleted: false,
};
