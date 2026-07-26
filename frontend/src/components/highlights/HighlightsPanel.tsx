"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Highlighter, Trash2 } from "lucide-react";

import { useNoteKoriStore } from "@/store/useNoteKoriStore";
import { CATEGORY_STYLES } from "@/lib/utils";
import type { HighlightCategory } from "@/lib/types";

const ORDER: HighlightCategory[] = [
  "important",
  "definition",
  "difficult",
  "understood",
];

export function HighlightsPanel() {
  const highlights = useNoteKoriStore((state) => state.highlights);
  const removeHighlight = useNoteKoriStore((state) => state.removeHighlight);
  const clearHighlights = useNoteKoriStore((state) => state.clearHighlights);

  if (highlights.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/40 px-6 text-center">
        <Highlighter className="size-7 text-ink-600" />
        <div>
          <p className="font-medium text-white">No highlights yet</p>
          <p className="mt-1 text-sm text-ink-400">
            Open the Study Guide and select any passage to save it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {highlights.length} saved {highlights.length === 1 ? "highlight" : "highlights"}
        </p>
        <button
          type="button"
          onClick={clearHighlights}
          className="no-print flex items-center gap-1.5 text-xs text-ink-400 transition-colors hover:text-rose-300"
        >
          <Trash2 className="size-3.5" />
          Clear all
        </button>
      </div>

      {ORDER.map((category) => {
        const items = highlights.filter((highlight) => highlight.category === category);
        if (items.length === 0) return null;

        const style = CATEGORY_STYLES[category];

        return (
          <section key={category} className="print-section">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <span className={`size-2 rounded-full ${style.dot}`} />
              {style.label}
              <span className="text-ink-400">({items.length})</span>
            </h3>

            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {items.map((highlight) => (
                  <motion.div
                    key={highlight.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className={`avoid-break group flex items-start gap-3 rounded-xl border p-3.5 ${style.chip}`}
                  >
                    <p className="bangla flex-1 text-sm leading-relaxed text-ink-200">
                      {highlight.selected_text}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeHighlight(highlight.id)}
                      aria-label="Remove highlight"
                      className="no-print shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5 text-ink-400 hover:text-rose-300" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        );
      })}
    </div>
  );
}
