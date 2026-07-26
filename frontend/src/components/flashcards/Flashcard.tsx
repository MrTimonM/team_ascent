"use client";

import { motion } from "framer-motion";

import { DIFFICULTY_STYLES } from "@/lib/utils";
import type { Flashcard as FlashcardType } from "@/lib/types";

interface Props {
  card: FlashcardType;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ card, isFlipped, onFlip }: Props) {
  return (
    <div
      className="h-72 cursor-pointer select-none [perspective:1400px]"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
    >
      <motion.div
        className="relative size-full [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120, damping: 18 }}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-6 [backface-visibility:hidden]">
          <div className="mb-4 flex items-center gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                DIFFICULTY_STYLES[card.difficulty] ?? DIFFICULTY_STYLES.beginner
              }`}
            >
              {card.difficulty}
            </span>
            {card.topic && (
              <span className="rounded-md border border-ink-700 bg-ink-800 px-2 py-0.5 text-xs text-ink-400">
                {card.topic}
              </span>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center">
            <p className="bangla text-center text-lg leading-relaxed text-white">
              {card.question}
            </p>
          </div>

          <p className="text-center text-xs text-ink-400">Click to reveal the answer</p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col rounded-2xl border border-brand-500/40 bg-gradient-to-br from-brand-600/20 to-ink-900 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-brand-400">
            Answer
          </p>
          <div className="flex flex-1 items-center justify-center overflow-y-auto">
            <p className="bangla text-center leading-relaxed text-white">{card.answer}</p>
          </div>
          <p className="text-center text-xs text-ink-400">Click to flip back</p>
        </div>
      </motion.div>
    </div>
  );
}
