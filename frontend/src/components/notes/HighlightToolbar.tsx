"use client";

import { motion } from "framer-motion";

import { CATEGORY_STYLES } from "@/lib/utils";
import type { HighlightCategory } from "@/lib/types";

const CATEGORIES: HighlightCategory[] = [
  "important",
  "definition",
  "difficult",
  "understood",
];

interface Props {
  x: number;
  y: number;
  onPick: (category: HighlightCategory) => void;
  onDismiss: () => void;
}

export function HighlightToolbar({ x, y, onPick, onDismiss }: Props) {
  // Keep the toolbar inside the viewport when the selection sits near an edge.
  const clampedX = Math.min(Math.max(x, 160), window.innerWidth - 160);
  const showBelow = y < 80;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: showBelow ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      style={{
        left: clampedX,
        top: showBelow ? y + 28 : y - 52,
      }}
      className="no-print fixed z-50 -translate-x-1/2"
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="flex items-center gap-1 rounded-xl border border-ink-600 bg-ink-850/95 p-1 shadow-2xl backdrop-blur">
        {CATEGORIES.map((category) => {
          const style = CATEGORY_STYLES[category];
          return (
            <button
              key={category}
              type="button"
              onClick={() => onPick(category)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-200 transition-colors hover:bg-ink-700 hover:text-white"
            >
              <span className={`size-2 rounded-full ${style.dot}`} />
              {style.label}
            </button>
          );
        })}
        <span className="mx-0.5 h-5 w-px bg-ink-600" />
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-2.5 py-1.5 text-xs text-ink-400 transition-colors hover:bg-ink-700 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
