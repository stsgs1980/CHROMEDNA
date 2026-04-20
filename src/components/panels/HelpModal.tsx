'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface ShortcutEntry {
  keys: string;
  description: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: '1-4', description: 'Switch Symbol (CL / NG / RB / HO)' },
  { keys: 'E', description: 'Toggle EIA Report' },
  { keys: 'P', description: 'Toggle Playback Mode' },
  { keys: 'R', description: 'Toggle Auto Rotate' },
  { keys: 'F', description: 'Toggle Fibonacci Levels' },
  { keys: 'L', description: 'Toggle Live Mode' },
  { keys: '[', description: 'Toggle Left Panel' },
  { keys: ']', description: 'Toggle Right Panel' },
  { keys: '\\', description: 'Toggle Bottom Panel' },
  { keys: '?', description: 'Show Help' },
];

export function HelpModal() {
  const showHelp = useUIStore((s) => s.showHelp);
  const toggleHelp = useUIStore((s) => s.toggleHelp);

  return (
    <AnimatePresence>
      {showHelp && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={toggleHelp}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 w-full max-w-sm mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-gray-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Keyboard className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">
                      Keyboard <span className="text-amber-400">Shortcuts</span>
                    </h2>
                    <p className="text-[10px] text-gray-500">Quick access to all controls</p>
                  </div>
                </div>
                <button
                  onClick={toggleHelp}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shortcuts Grid */}
              <div className="px-5 py-4 space-y-1">
                {SHORTCUTS.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    {/* Key Badge */}
                    <div className="flex-shrink-0 min-w-[40px] h-7 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center px-2">
                      <span className="text-[11px] font-bold text-white tracking-wide">
                        {shortcut.keys}
                      </span>
                    </div>
                    {/* Description */}
                    <span className="text-xs text-gray-300 font-medium">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01]">
                <div className="flex items-center justify-center">
                  <span className="text-[9px] text-gray-600">
                    Press <span className="text-amber-400/70 font-medium">?</span> anytime to toggle this panel
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
