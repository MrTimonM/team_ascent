"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { Flashcard } from "@/components/flashcards/Flashcard";
import { useNoteKoriStore } from "@/store/useNoteKoriStore";
import type { Flashcard as FlashcardType } from "@/lib/types";

const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"] as const;

export function FlashcardDeck({ cards }: { cards: FlashcardType[] }) {
  const index = useNoteKoriStore((state) => state.flashcardIndex);
  const setIndex = useNoteKoriStore((state) => state.setFlashcardIndex);
  const difficultIds = useNoteKoriStore((state) => state.difficultCardIds);
  const easyIds = useNoteKoriStore((state) => state.easyCardIds);
  const markCard = useNoteKoriStore((state) => state.markCard);
  const resetFlashcards = useNoteKoriStore((state) => state.resetFlashcards);

  const [filter, setFilter] = useState<(typeof DIFFICULTIES)[number]>("all");
  const [topic, setTopic] = useState("all");
  const [isFlipped, setIsFlipped] = useState(false);
  // Null means "source order". Shuffling happens in the click handler so no
  // impure randomness runs during render.
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);

  const topics = useMemo(
    () => ["all", ...Array.from(new Set(cards.map((card) => card.topic).filter(Boolean)))],
    [cards],
  );

  const deck = useMemo(() => {
    const filtered = cards.filter(
      (card) =>
        (filter === "all" || card.difficulty === filter) &&
        (topic === "all" || card.topic === topic),
    );

    if (shuffledIds) {
      const rank = new Map(shuffledIds.map((id, position) => [id, position]));
      return [...filtered].sort(
        (a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0),
      );
    }

    // Cards marked difficult are pushed to the end so they come back around
    // before the session finishes.
    return [
      ...filtered.filter((card) => !difficultIds.includes(card.id)),
      ...filtered.filter((card) => difficultIds.includes(card.id)),
    ];
  }, [cards, filter, topic, difficultIds, shuffledIds]);

  // Derived rather than synced: filters can shrink the deck under the index.
  const safeIndex = deck.length > 0 ? Math.min(index, deck.length - 1) : 0;

  const go = useCallback(
    (delta: number) => {
      if (deck.length === 0) return;
      setIsFlipped(false);
      setIndex((safeIndex + delta + deck.length) % deck.length);
    },
    [deck.length, safeIndex, setIndex],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === " ") {
        event.preventDefault();
        setIsFlipped((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const changeFilters = (apply: () => void) => {
    apply();
    setIsFlipped(false);
    setIndex(0);
  };

  const shuffle = () => {
    const ids = deck.map((card) => card.id);
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffledIds(ids);
    setIsFlipped(false);
    setIndex(0);
  };

  if (cards.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900/40 text-sm text-ink-400">
        No flashcards were generated for this image.
      </div>
    );
  }

  const card = deck[safeIndex];
  const reviewed = new Set([...easyIds, ...difficultIds]).size;
  const progress = cards.length > 0 ? (reviewed / cards.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2">
        {DIFFICULTIES.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => changeFilters(() => setFilter(level))}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
              filter === level
                ? "border-brand-500 bg-brand-500/20 text-brand-400"
                : "border-ink-700 bg-ink-900/60 text-ink-400 hover:text-white"
            }`}
          >
            {level}
          </button>
        ))}

        {topics.length > 1 && (
          <select
            value={topic}
            onChange={(event) => changeFilters(() => setTopic(event.target.value))}
            className="ml-auto rounded-lg border border-ink-700 bg-ink-900/60 px-2.5 py-1 text-xs text-ink-200 outline-none"
          >
            {topics.map((name) => (
              <option key={name} value={name} className="bg-ink-850">
                {name === "all" ? "All topics" : name}
              </option>
            ))}
          </select>
        )}
      </div>

      {deck.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900/40 text-sm text-ink-400">
          No cards match these filters.
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${card.id}-${safeIndex}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
            >
              <Flashcard
                card={card}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped((value) => !value)}
              />
            </motion.div>
          </AnimatePresence>

          <div className="no-print flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              className="flex items-center gap-1 rounded-xl border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-white"
            >
              <ChevronLeft className="size-4" />
              Prev
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  markCard(card.id, "difficult");
                  go(1);
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  difficultIds.includes(card.id)
                    ? "border-rose-400/40 bg-rose-400/15 text-rose-300"
                    : "border-ink-700 bg-ink-900/60 text-ink-400 hover:text-rose-300"
                }`}
              >
                <ThumbsDown className="size-4" />
                Hard
              </button>
              <button
                type="button"
                onClick={() => {
                  markCard(card.id, "easy");
                  go(1);
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  easyIds.includes(card.id)
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                    : "border-ink-700 bg-ink-900/60 text-ink-400 hover:text-emerald-300"
                }`}
              >
                <ThumbsUp className="size-4" />
                Easy
              </button>
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              className="flex items-center gap-1 rounded-xl border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-white"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-ink-700 bg-ink-900/40 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-200">
                Card {safeIndex + 1} of {deck.length}
              </span>
              <span className="text-ink-400">
                Reviewed {Math.round(progress)}% · {easyIds.length} easy ·{" "}
                {difficultIds.length} hard
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="no-print flex gap-2 pt-1">
              <button
                type="button"
                onClick={shuffle}
                className="flex items-center gap-1.5 text-xs text-ink-400 transition-colors hover:text-white"
              >
                <Shuffle className="size-3.5" />
                Shuffle
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFlashcards();
                  setShuffledIds(null);
                  setIsFlipped(false);
                }}
                className="flex items-center gap-1.5 text-xs text-ink-400 transition-colors hover:text-white"
              >
                <RotateCcw className="size-3.5" />
                Restart session
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
