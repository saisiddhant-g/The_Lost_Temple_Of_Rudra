import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { ActionButton } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface ActionButtonBarProps {
  actions: ActionButton[];
  onActionClick: (command: string, actionId: string) => void;
  onOpenMoreModal: () => void;
}

export const ActionButtonBar: React.FC<ActionButtonBarProps> = ({
  actions,
  onActionClick,
  onOpenMoreModal,
}) => {
  return (
    <div className="w-full my-3 flex flex-wrap gap-2.5 items-center">
      {actions.map((act) => {
        // Dynamically get Lucide icon
        const IconComponent = (Icons as any)[act.iconName] || Icons.Circle;

        const isMore = act.id === 'more' || act.command.includes('more');

        return (
          <motion.button
            key={act.id}
            whileHover={{ scale: 1.03, boxShadow: '0 0 16px rgba(184,134,11,0.4)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => {
              audioEngine.playClick();
              if (isMore) {
                onOpenMoreModal();
              } else {
                onActionClick(act.command, act.id);
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2 text-[11px] font-sans tracking-widest uppercase transition-colors duration-200 rounded-none border border-[#b8860b] cursor-pointer ${
              act.primary
                ? 'bg-[#1a1a14] text-[#d4af37] shadow-[0_0_12px_rgba(184,134,11,0.3)] hover:bg-[#b8860b] hover:text-[#0c0c08]'
                : 'bg-[#1a1a14]/80 text-[#d4af37] hover:bg-[#b8860b] hover:text-[#0c0c08]'
            }`}
          >
            <IconComponent className="w-3.5 h-3.5 text-[#b8860b] group-hover:text-[#0c0c08]" />
            <span>{act.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
