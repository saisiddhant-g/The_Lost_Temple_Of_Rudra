import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CinematicViewport } from './components/CinematicViewport';
import { ActionButtonBar } from './components/ActionButtonBar';
import { CommandBar } from './components/CommandBar';
import { RightSidebar } from './components/RightSidebar';
import { OpeningCinematicModal } from './components/OpeningCinematicModal';
import { EndingSequenceModal } from './components/EndingSequenceModal';
import { MoreActionsModal } from './components/MoreActionsModal';

import { ROOM_DATA } from './data/templeData';
import { buildInitialGameState, saveGameState, loadGameState, clearGameState } from './game/gameState';
import { getActionsForRoom } from './game/actionEngine';
import { processCommand } from './game/commandEngine';
import { getItem } from './game/gameItems';

import {
  GameState, RoomId, RoomData, InventoryItem,
  Objective, JournalEntry, EvaluationMetrics, WorldModel,
} from './types';
import { audioEngine } from './audio/audioEngine';

// ── Adapter: GameState → legacy WorldModel shape for existing components ──────
function toWorldModel(gs: GameState): WorldModel {
  return {
    currentRoomId: gs.currentRoomId,
    unlockedRooms: gs.unlockedRooms,
    inventory: gs.inventory,
    objectives: gs.objectives,
    journal: gs.journal,
    evaluation: {
      torch: gs.playerStats.torchFuel,
      resolve: gs.playerStats.resolve,
      templeFavor: gs.playerStats.templeFavor,
      observationScore: gs.playerStats.observationScore,
      curiosityScore: gs.playerStats.curiosityScore,
      patienceScore: gs.playerStats.patienceScore,
      integrityScore: gs.playerStats.integrityScore,
      greedScore: gs.playerStats.greedScore,
    },
    turns: gs.currentTurn,
    puzzleStates: Object.fromEntries(
      (Object.keys(gs.roomFlags) as RoomId[]).map((id) => [
        id,
        { solved: gs.roomFlags[id].puzzleSolved, progress: gs.roomFlags[id].puzzleProgress },
      ]),
    ) as WorldModel['puzzleStates'],
    eventHistory: gs.eventHistory,
    templePhase: gs.templePhase,
    isCollapsing: gs.isCollapsing,
    gameCompleted: gs.gameCompleted,
    gameEnding: gs.gameEnding,
  };
}

// ── Adapter: GameState objective → Objective (with completed/archived) ─────────
function getObjectiveForRoom(gs: GameState, roomId: RoomId): Objective {
  return gs.objectives[roomId] ?? ROOM_DATA[roomId].objective as Objective;
}

export default function App() {
  const [showIntroModal, setShowIntroModal] = useState<boolean>(true);
  const [showMoreModal, setShowMoreModal] = useState<boolean>(false);
  const [showEndingModal, setShowEndingModal] = useState<boolean>(false);

  // ── GameState ─────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadGameState();
    return saved ?? buildInitialGameState();
  });

  // Narration displayed in CinematicViewport
  const [currentNarration, setCurrentNarration] = useState<string>(
    ROOM_DATA.entrance.narrationLines.join('\n\n'),
  );
  const [narrationKey, setNarrationKey] = useState<number>(0);

  // Always-current ref for async handlers
  const gsRef = useRef<GameState>(gameState);
  useEffect(() => { gsRef.current = gameState; }, [gameState]);

  // Auto-persist on every change
  useEffect(() => { saveGameState(gameState); }, [gameState]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const pushNarration = useCallback((text: string) => {
    setCurrentNarration(text);
    setNarrationKey((k) => k + 1);
  }, []);

  /** Apply a CommandResult to GameState */
  const applyResult = useCallback((result: import('./types').CommandResult, gs: GameState): GameState => {
    let next: GameState = { ...gs };

    // State patch from result
    if (result.stateUpdate) {
      next = { ...next, ...(result.stateUpdate as Partial<GameState>) };
      // merge playerStats carefully
      if (result.stateUpdate.playerStats) {
        next.playerStats = { ...gs.playerStats, ...result.stateUpdate.playerStats };
      }
      if (result.stateUpdate.roomFlags) {
        next.roomFlags = { ...gs.roomFlags, ...result.stateUpdate.roomFlags };
      }
      // merge puzzleProgress deeply so steps from different rooms are preserved
      if (result.stateUpdate.puzzleProgress) {
        next.puzzleProgress = { ...gs.puzzleProgress, ...result.stateUpdate.puzzleProgress };
      }
    }

    // Items added
    if (result.itemsAdded) {
      for (const id of result.itemsAdded) {
        if (!next.inventory.some((i) => i.id === id)) {
          try { next.inventory = [...next.inventory, getItem(id)]; } catch {}
        }
      }
    }

    // Items removed
    if (result.itemsRemoved) {
      next.inventory = next.inventory.filter((i) => !result.itemsRemoved!.includes(i.id));
    }

    // Objective task completions
    if (result.objectiveUpdates) {
      const objs = { ...next.objectives };
      for (const { roomId, taskIndex } of result.objectiveUpdates) {
        if (objs[roomId]?.tasks[taskIndex]) {
          const tasks = [...objs[roomId].tasks];
          tasks[taskIndex] = { ...tasks[taskIndex], completed: true };
          const allDone = tasks.every((t) => t.completed);
          objs[roomId] = { ...objs[roomId], tasks, completed: allDone };
          if (allDone && !next.completedObjectives.includes(objs[roomId].id)) {
            next.completedObjectives = [...next.completedObjectives, objs[roomId].id];
          }
        }
      }
      next.objectives = objs;
    }

    // Journal entry
    if (result.journalEntry) {
      const text = result.journalEntry.text;
      if (!next.journal.some((j) => j.text === text)) {
        const entry: JournalEntry = {
          id: `j_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text,
          turn: next.currentTurn,
          roomId: gs.currentRoomId,
          category: result.journalEntry.category,
        };
        next.journal = [...next.journal, entry];
      }
    }

    // Unlock room
    if (result.unlockRoom) {
      next.unlockedRooms = { ...next.unlockedRooms, [result.unlockRoom]: true };
    }

    // Mark completed action
    if (result.completedActionId && !next.completedActions.includes(result.completedActionId)) {
      next.completedActions = [...next.completedActions, result.completedActionId];
    }

    // Increment turn
    next.currentTurn = gs.currentTurn + 1;

    // Torch fuel decay (1% per turn)
    next.playerStats = {
      ...next.playerStats,
      torchFuel: Math.max(0, next.playerStats.torchFuel - 1),
    };

    return next;
  }, []);

  // ── handleCommand ─────────────────────────────────────────────────────────
  const handleCommand = useCallback(async (commandStr: string, _actionId?: string) => {
    const gs = gsRef.current;
    audioEngine.playClick();

    const result = processCommand(gs, commandStr);

    // Movement signal — handle specially
    if (result.narration === '__MOVE__') {
      const ROOM_SEQ: RoomId[] = ['entrance','guardians','echoes','puzzle','library','flooded','elements','sanctum','final'];
      const idx = ROOM_SEQ.indexOf(gs.currentRoomId);
      const nextId = idx < ROOM_SEQ.length - 1 ? ROOM_SEQ[idx + 1] : null;
      if (!nextId || !gs.unlockedRooms[nextId]) {
        pushNarration('The way forward is sealed. Resolve this room before moving on.');
        return;
      }

      audioEngine.playStoneMovement();

      // Auto-collect room initial items on first visit
      let nextGs: GameState = { ...gs, currentRoomId: nextId };
      const flags = nextGs.roomFlags[nextId];
      if (!flags.visited) {
        const roomDef = ROOM_DATA[nextId];
        for (const itemId of roomDef.initialItems) {
          if (!nextGs.inventory.some((i) => i.id === itemId)) {
            try { nextGs.inventory = [...nextGs.inventory, getItem(itemId)]; } catch {}
          }
        }
        // Auto-journal room entry
        const entryText = roomDef.entryJournalText;
        if (entryText && !nextGs.journal.some((j) => j.text === entryText)) {
          nextGs.journal = [...nextGs.journal, {
            id: `j_entry_${nextId}_${Date.now()}`,
            text: entryText,
            turn: nextGs.currentTurn,
            roomId: nextId,
            category: 'event',
          }];
        }
        nextGs.roomFlags = {
          ...nextGs.roomFlags,
          [nextId]: { ...flags, visited: true },
        };
        nextGs.visitedRooms = [...(nextGs.visitedRooms ?? []), nextId];
        nextGs.previousRoomId = gs.currentRoomId;
        nextGs.currentTurn += 1;
        nextGs.playerStats = { ...nextGs.playerStats, torchFuel: Math.max(0, nextGs.playerStats.torchFuel - 1) };
      }

      setGameState(nextGs);
      pushNarration(ROOM_DATA[nextId].narrationLines.join('\n\n'));
      return;
    }

    // Normal command
    const nextGs = applyResult(result, gs);

    // Audio
    if (result.audioEvent === 'stone') audioEngine.playStoneMovement();
    else if (result.audioEvent === 'bell') audioEngine.playResonanceBell();

    pushNarration(result.narration);
    setGameState(nextGs);

    // End game
    if (result.endGame) {
      setTimeout(() => setShowEndingModal(true), 1800);
    }

    // Enhance narration via backend AI (non-blocking, optional)
    const keyAtDispatch = narrationKey + 1;
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandStr,
          currentRoom: ROOM_DATA[gs.currentRoomId],
          worldModel: toWorldModel(nextGs),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.narration && !data.fallback) {
          setNarrationKey((currentKey) => {
            if (currentKey === keyAtDispatch) setCurrentNarration(data.narration);
            return currentKey;
          });
        }
      }
    } catch { /* server offline — narration already set locally */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyResult, pushNarration]);

  // ── Room navigation (breadcrumb / map) ────────────────────────────────────
  const handleRoomSelect = useCallback((roomId: RoomId) => {
    const gs = gsRef.current;
    if (!gs.unlockedRooms[roomId]) return;
    audioEngine.playStoneMovement();
    setGameState((prev) => ({ ...prev, currentRoomId: roomId, previousRoomId: prev.currentRoomId }));
    pushNarration(ROOM_DATA[roomId].narrationLines.join('\n\n'));
  }, [pushNarration]);

  // ── Reset puzzle (room mechanism only) ───────────────────────────────────
  const handleResetPuzzle = useCallback(() => {
    audioEngine.playStoneMovement();
    const roomId = gsRef.current.currentRoomId;
    setGameState((prev) => ({
      ...prev,
      roomFlags: {
        ...prev.roomFlags,
        [roomId]: {
          ...prev.roomFlags[roomId],
          puzzleSolved: false,
          puzzleProgress: 0,
        },
      },
    }));
    pushNarration(ROOM_DATA[roomId].narrationLines.join('\n\n'));
  }, [pushNarration]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSaveGame = useCallback(() => {
    saveGameState(gsRef.current);
  }, []);

  // ── Item click → examine ─────────────────────────────────────────────────
  const handleItemClick = useCallback((item: InventoryItem) => {
    audioEngine.playClick();
    handleCommand(`examine ${item.name}`);
  }, [handleCommand]);

  // ── Derived display data ──────────────────────────────────────────────────
  const currentRoomDef: RoomData = ROOM_DATA[gameState.currentRoomId] ?? ROOM_DATA.entrance;
  const dynamicActions = getActionsForRoom(gameState);
  const worldModel = toWorldModel(gameState);
  const currentObjective: Objective = getObjectiveForRoom(gameState, gameState.currentRoomId);

  return (
    <div className="w-full h-screen bg-[#0c0c08] text-[#e3d5ca] font-serif flex flex-col overflow-hidden select-none">
      {/* Header */}
      <Header onOpenJournalModal={() => setShowMoreModal(true)} />

      {/* Main layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 sm:p-4 lg:p-6 gap-4">
        {/* Left: Viewport + Actions + CommandBar */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <CinematicViewport
            room={currentRoomDef}
            narration={currentNarration}
            narrationKey={narrationKey}
            isCollapsing={gameState.isCollapsing}
          />

          {/* Dynamic action buttons */}
          <ActionButtonBar
            actions={dynamicActions}
            onActionClick={(cmd, id) => handleCommand(cmd, id)}
            onOpenMoreModal={() => setShowMoreModal(true)}
          />

          <CommandBar
            currentRoomId={gameState.currentRoomId}
            unlockedRooms={gameState.unlockedRooms}
            onCommandSubmit={(cmd) => handleCommand(cmd)}
            onRoomSelect={handleRoomSelect}
          />
        </div>

        {/* Right sidebar */}
        <RightSidebar
          currentRoomId={gameState.currentRoomId}
          inventory={gameState.inventory}
          objective={currentObjective}
          journal={gameState.journal}
          evaluation={worldModel.evaluation}
          unlockedRooms={gameState.unlockedRooms}
          onRoomSelect={handleRoomSelect}
          onItemClick={handleItemClick}
        />
      </main>

      {/* Modals */}
      {showIntroModal && (
        <OpeningCinematicModal onStartJourney={() => setShowIntroModal(false)} />
      )}

      {showMoreModal && (
        <MoreActionsModal
          room={currentRoomDef}
          worldModel={worldModel}
          onClose={() => setShowMoreModal(false)}
          onExecuteCommand={(cmd) => handleCommand(cmd)}
          onResetPuzzle={handleResetPuzzle}
          onSaveGame={handleSaveGame}
        />
      )}

      {showEndingModal && (
        <EndingSequenceModal
          evaluation={worldModel.evaluation}
          onRestartGame={() => {
            clearGameState();
            setGameState(buildInitialGameState());
            pushNarration(ROOM_DATA.entrance.narrationLines.join('\n\n'));
            setShowEndingModal(false);
            setShowIntroModal(true);
          }}
        />
      )}
    </div>
  );
}
