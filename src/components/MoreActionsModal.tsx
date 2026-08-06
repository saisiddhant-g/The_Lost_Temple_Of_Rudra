import React, { useState } from 'react';
import { X, Sparkles, Compass, RotateCcw, BookOpen, Settings, Save } from 'lucide-react';
import { RoomData, WorldModel } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface MoreActionsModalProps {
  room: RoomData;
  worldModel: WorldModel;
  onClose: () => void;
  onExecuteCommand: (cmd: string) => void;
  onResetPuzzle: () => void;
  onSaveGame: () => void;
}

export const MoreActionsModal: React.FC<MoreActionsModalProps> = ({
  room,
  worldModel,
  onClose,
  onExecuteCommand,
  onResetPuzzle,
  onSaveGame,
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'journal' | 'settings'>('actions');

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c08]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      <div className="bg-[#0a0a06] border border-[#b8860b]/40 w-full max-w-2xl rounded-none shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-[#080806] border-b border-[#1a1a14]">
          <div className="flex items-center space-x-3">
            <span className="font-serif text-sm tracking-[0.2em] text-[#d4af37] uppercase font-light">
              TEMPLE CONTEXT & ACTIONS
            </span>
            <span className="text-xs font-sans text-[#7a6a5d]">({room.title})</span>
          </div>
          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="p-1 text-[#7a6a5d] hover:text-[#d4af37] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1a1a14] bg-[#0c0c08] text-xs font-sans">
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-3 text-center font-bold tracking-widest uppercase transition-colors border-b-2 cursor-pointer ${
              activeTab === 'actions'
                ? 'border-[#b8860b] text-[#d4af37] bg-[#1a1a14]'
                : 'border-transparent text-[#7a6a5d] hover:text-[#a19286]'
            }`}
          >
            ACTIONS
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 py-3 text-center font-bold tracking-widest uppercase transition-colors border-b-2 cursor-pointer ${
              activeTab === 'journal'
                ? 'border-[#b8860b] text-[#d4af37] bg-[#1a1a14]'
                : 'border-transparent text-[#7a6a5d] hover:text-[#a19286]'
            }`}
          >
            FULL JOURNAL
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-center font-bold tracking-widest uppercase transition-colors border-b-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#b8860b] text-[#d4af37] bg-[#1a1a14]'
                : 'border-transparent text-[#7a6a5d] hover:text-[#a19286]'
            }`}
          >
            SYSTEM & SAVES
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[60vh] custom-scrollbar text-xs font-sans">
          {activeTab === 'actions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onExecuteCommand('ask temple');
                  onClose();
                }}
                className="flex items-center space-x-3 p-3 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#3d2b1f] hover:border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] rounded-none text-left transition-colors cursor-pointer group"
              >
                <Sparkles className="w-4 h-4 text-[#b8860b] group-hover:text-[#0c0c08] shrink-0" />
                <div>
                  <p className="font-serif uppercase font-bold text-[#d4af37] group-hover:text-[#0c0c08]">ASK TEMPLE AI</p>
                  <p className="text-[11px] text-[#7a6a5d] group-hover:text-[#0c0c08]">Seek Guardian Consciousness evaluation</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onExecuteCommand('ask explorer guide');
                  onClose();
                }}
                className="flex items-center space-x-3 p-3 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#3d2b1f] hover:border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] rounded-none text-left transition-colors cursor-pointer group"
              >
                <Compass className="w-4 h-4 text-[#b8860b] group-hover:text-[#0c0c08] shrink-0" />
                <div>
                  <p className="font-serif uppercase font-bold text-[#d4af37] group-hover:text-[#0c0c08]">EXPLORER GUIDANCE</p>
                  <p className="text-[11px] text-[#7a6a5d] group-hover:text-[#0c0c08]">Get archaeological reasoning advice</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onResetPuzzle();
                  onClose();
                }}
                className="flex items-center space-x-3 p-3 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#3d2b1f] hover:border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] rounded-none text-left transition-colors cursor-pointer group"
              >
                <RotateCcw className="w-4 h-4 text-[#b8860b] group-hover:text-[#0c0c08] shrink-0" />
                <div>
                  <p className="font-serif uppercase font-bold text-[#d4af37] group-hover:text-[#0c0c08]">RESET ROOM MECHANISM</p>
                  <p className="text-[11px] text-[#7a6a5d] group-hover:text-[#0c0c08]">Return statues & plates to initial state</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onExecuteCommand('look around');
                  onClose();
                }}
                className="flex items-center space-x-3 p-3 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#3d2b1f] hover:border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] rounded-none text-left transition-colors cursor-pointer group"
              >
                <BookOpen className="w-4 h-4 text-[#b8860b] group-hover:text-[#0c0c08] shrink-0" />
                <div>
                  <p className="font-serif uppercase font-bold text-[#d4af37] group-hover:text-[#0c0c08]">DEEP OBSERVATION</p>
                  <p className="text-[11px] text-[#7a6a5d] group-hover:text-[#0c0c08]">Study environmental architectural details</p>
                </div>
              </button>
            </div>
          )}

          {activeTab === 'journal' && (
            <div className="space-y-3">
              <h4 className="font-serif text-sm text-[#d4af37] uppercase font-light">
                HISTORICAL DISCOVERIES ({worldModel.journal.length} Entries)
              </h4>
              <div className="space-y-2">
                {worldModel.journal.map((j, idx) => (
                  <div key={idx} className="p-3 bg-[#080806] border-l border-[#b8860b]">
                    <p className="font-serif italic text-[#e3d5ca] leading-relaxed">{j.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#080806] border border-[#1a1a14] rounded-none">
                <div>
                  <p className="font-serif text-sm font-light text-[#d4af37] uppercase">SAVE GAME STATE</p>
                  <p className="text-[11px] text-[#7a6a5d]">Serialize current Persistent World Model</p>
                </div>
                <button
                  onClick={() => {
                    onSaveGame();
                    audioEngine.playClick();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#1a1a14] hover:bg-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] border border-[#b8860b] font-sans font-bold uppercase tracking-widest text-xs rounded-none transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE NOW</span>
                </button>
              </div>

              <div className="p-3 bg-[#080806] border border-[#1a1a14] rounded-none space-y-2">
                <p className="font-serif text-xs font-light text-[#d4af37] uppercase">ENVIRONMENTAL STATISTICS</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#a19286]">
                  <p>Current Turn: <span className="text-[#d4af37]">{worldModel.turns}</span></p>
                  <p>Temple Phase: <span className="text-[#d4af37]">{worldModel.templePhase}</span></p>
                  <p>Observation Rating: <span className="text-[#d4af37]">{worldModel.evaluation.observationScore}/100</span></p>
                  <p>Curiosity Rating: <span className="text-[#d4af37]">{worldModel.evaluation.curiosityScore}/100</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
