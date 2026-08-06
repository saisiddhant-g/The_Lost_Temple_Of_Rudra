import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem, Objective, JournalEntry, EvaluationMetrics, RoomId } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface RightSidebarProps {
  currentRoomId: RoomId;
  inventory: InventoryItem[];
  objective: Objective;
  journal: JournalEntry[];
  evaluation: EvaluationMetrics;
  unlockedRooms: Record<RoomId, boolean>;
  onRoomSelect: (roomId: RoomId) => void;
  onItemClick: (item: InventoryItem) => void;
}

const MAP_NODES: { id: RoomId; name: string }[] = [
  { id: 'entrance', name: 'Entrance' },
  { id: 'guardians', name: 'Guardians' },
  { id: 'echoes', name: 'Echoes' },
  { id: 'puzzle', name: 'Puzzle Chamber' },
  { id: 'library', name: 'Library' },
  { id: 'flooded', name: 'Flooded Corridor' },
  { id: 'elements', name: 'Elements' },
  { id: 'sanctum', name: 'Sanctum' },
  { id: 'final', name: 'Final Chamber' },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentRoomId,
  inventory,
  objective,
  journal,
  evaluation,
  unlockedRooms,
  onRoomSelect,
  onItemClick,
}) => {
  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] bg-[#0a0a06] border border-[#1a1a14] rounded-none p-5 flex flex-col gap-5 overflow-y-auto max-h-[85vh] lg:max-h-[calc(100vh-80px)] custom-scrollbar select-none shadow-2xl">
      {/* 1. TEMPLE MAP SECTION */}
      <section className="border-b border-[#1a1a14] pb-4">
        <div className="flex justify-between items-end mb-3">
          <span className="text-[10px] uppercase tracking-widest text-[#b8860b] font-bold font-sans">
            TEMPLE MAP
          </span>
          <span className="text-[10px] text-[#5a4a3d] font-sans">
            Level {MAP_NODES.findIndex(n => n.id === currentRoomId) + 1} of 9
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 aspect-square w-full">
          {MAP_NODES.map((node, idx) => {
            const isActive = node.id === currentRoomId;
            const isUnlocked = unlockedRooms[node.id];

            return (
              <motion.button
                key={node.id}
                whileHover={isUnlocked ? { scale: 1.05 } : {}}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (isUnlocked && !isActive) {
                    audioEngine.playStoneMovement();
                    onRoomSelect(node.id);
                  }
                }}
                disabled={!isUnlocked}
                className={`flex items-center justify-center text-[10px] font-sans transition-all border ${
                  isActive
                    ? 'bg-[#b8860b]/20 border-[#b8860b] text-[#d4af37] font-bold shadow-[0_0_12px_rgba(184,134,11,0.3)]'
                    : isUnlocked
                    ? 'bg-[#1a1a14] border-[#3d2b1f] text-[#a19286] hover:border-[#b8860b] hover:text-[#d4af37] cursor-pointer'
                    : 'bg-[#1a1a14]/30 border-[#2b2b24] text-[#5a4a3d] cursor-not-allowed opacity-30'
                }`}
              >
                0{idx + 1}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 2. OBJECTIVES SECTION */}
      <section className="border-b border-[#1a1a14] pb-4">
        <span className="text-[10px] uppercase tracking-widest text-[#b8860b] font-bold font-sans block mb-2">
          OBJECTIVES
        </span>
        <AnimatePresence mode="wait">
          <motion.p
            key={objective.title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="text-xs font-serif text-[#d4af37] mb-2 leading-tight"
          >
            {objective.title}
          </motion.p>
        </AnimatePresence>

        <ul className="space-y-1.5 text-[12px] text-[#a19286] font-serif">
          {objective.tasks.map((task) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 leading-tight"
            >
              <span className={task.completed ? 'text-[#5a4a3d]' : 'text-[#b8860b]'}>
                &bull;
              </span>
              <span className={task.completed ? 'line-through text-[#5a4a3d]' : 'text-[#a19286]'}>
                {task.text}
              </span>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* 3. INVENTORY SECTION */}
      <section className="border-b border-[#1a1a14] pb-4">
        <span className="text-[10px] uppercase tracking-widest text-[#b8860b] font-bold font-sans block mb-3">
          INVENTORY
        </span>

        <div className="grid grid-cols-4 gap-2">
          {inventory.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.08, borderColor: '#b8860b' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                audioEngine.playClick();
                onItemClick(item);
              }}
              className="aspect-square bg-[#0c0c08] border border-[#3d2b1f] p-1 flex items-center justify-center group cursor-pointer transition-colors shadow-md"
            >
              <div className="w-full h-full bg-[#1a1a14] flex flex-col items-center justify-center text-[8px] text-center p-0.5 text-[#b8860b] font-sans font-bold uppercase truncate">
                {item.name}
              </div>
            </motion.div>
          ))}
          {Array.from({ length: Math.max(0, 8 - inventory.length) }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#0c0c08] border border-[#3d2b1f] p-1 opacity-20" />
          ))}
        </div>
      </section>

      {/* 4. JOURNAL SECTION */}
      <section className="border-b border-[#1a1a14] pb-4">
        <span className="text-[10px] uppercase tracking-widest text-[#b8860b] font-bold font-sans block mb-2">
          JOURNAL RECOLLECTIONS
        </span>
        <div className="space-y-2">
          <AnimatePresence>
            {journal.slice(-2).map((entry) => (
              <motion.p
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-[11px] font-serif italic text-[#a19286] bg-[#0c0c08] p-2 border-l border-[#b8860b] leading-relaxed"
              >
                {entry.text}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* 5. EXPLORER STATE / TEMPLE EVALUATION */}
      <section className="bg-[#080806] border border-[#1a1a14] p-3 mt-auto">
        <div className="flex justify-between items-center text-[10px] font-sans tracking-widest uppercase mb-2">
          <span className="text-[#5a4a3d] font-bold">EXPLORER STATE</span>
          <span className="text-[#d4af37] font-bold">{evaluation.resolve}</span>
        </div>
        <div className="w-full h-1 bg-[#1a1a14] overflow-hidden mb-2">
          <motion.div
            className="h-full bg-[#b8860b] shadow-[0_0_8px_rgba(184,134,11,0.5)]"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(10, Math.min(100, evaluation.torch))}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-sans text-[#7a6a5d]">
          <span>Torch: {evaluation.torch}%</span>
          <span>Favor: {evaluation.templeFavor}</span>
        </div>
      </section>
    </aside>
  );
};
