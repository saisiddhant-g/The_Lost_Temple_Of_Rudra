import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { RoomId } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface CommandBarProps {
  currentRoomId: RoomId;
  unlockedRooms: Record<RoomId, boolean>;
  onCommandSubmit: (cmd: string) => void;
  onRoomSelect: (roomId: RoomId) => void;
}

const BREADCRUMB_PATH: { id: RoomId; name: string }[] = [
  { id: 'entrance', name: 'TEMPLE ENTRANCE' },
  { id: 'guardians', name: 'HALL OF GUARDIANS' },
  { id: 'echoes', name: 'HALL OF ECHOES' },
  { id: 'puzzle', name: 'PUZZLE CHAMBER' },
  { id: 'library', name: 'LIBRARY OF WHISPERS' },
  { id: 'flooded', name: 'FLOODED CORRIDOR' },
  { id: 'elements', name: 'CHAMBER OF ELEMENTS' },
  { id: 'sanctum', name: 'SANCTUM OF RUDRA' },
  { id: 'final', name: 'FINAL CHAMBER' },
];

export const CommandBar: React.FC<CommandBarProps> = ({
  currentRoomId,
  unlockedRooms,
  onCommandSubmit,
  onRoomSelect,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    audioEngine.playClick();
    onCommandSubmit(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#080806] border border-[#1a1a14] p-3 rounded-none select-none">
      {/* Typed Command Form */}
      <form onSubmit={handleSubmit} className="flex items-center flex-1 max-w-lg">
        <span className="text-[10px] font-sans tracking-widest text-[#5a4a3d] uppercase shrink-0 mr-3 font-bold">
          Command:
        </span>
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="place runic stone on central altar..."
            className="w-full bg-[#0c0c08] border border-[#2b2b24] focus:border-[#b8860b] text-[13px] font-serif italic text-[#b8860b] placeholder-[#5a4a3d] px-3 py-1.5 pr-10 rounded-none outline-none transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-[#1a1a14] hover:bg-[#b8860b] text-[#b8860b] hover:text-[#0c0c08] transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Breadcrumb Navigation Path */}
      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-[10px] font-sans tracking-widest text-[#5a4a3d] overflow-x-auto py-1">
        {BREADCRUMB_PATH.map((item, idx) => {
          const isActive = item.id === currentRoomId;
          const isUnlocked = unlockedRooms[item.id];

          return (
            <React.Fragment key={item.id}>
              {idx > 0 && <span className="text-[#3d2b1f] font-bold">&gt;</span>}
              <button
                onClick={() => {
                  if (isUnlocked && !isActive) {
                    audioEngine.playStoneMovement();
                    onRoomSelect(item.id);
                  }
                }}
                disabled={!isUnlocked}
                className={`transition-colors whitespace-nowrap uppercase ${
                  isActive
                    ? 'text-[#d4af37] font-bold border-b border-[#b8860b] pb-0.5'
                    : isUnlocked
                    ? 'text-[#a19286] hover:text-[#d4af37] cursor-pointer'
                    : 'text-[#3d2b1f] cursor-not-allowed opacity-40'
                }`}
              >
                {item.name}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
