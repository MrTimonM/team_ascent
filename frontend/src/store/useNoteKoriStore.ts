"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

import type {
  AnalysisResult,
  Highlight,
  HighlightCategory,
  SectionId,
} from "@/lib/types";

/**
 * localStorage throws in private browsing, with cookies blocked, and in some
 * headless/embedded contexts. Falling back to memory keeps the session usable
 * for that visit instead of leaving the app stuck before hydration.
 */
function createSafeStorage(): StateStorage {
  const memory = new Map<string, string>();

  const available = (() => {
    try {
      const probe = "__notekori_probe__";
      window.localStorage.setItem(probe, probe);
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  })();

  if (available) return window.localStorage;

  return {
    getItem: (name) => memory.get(name) ?? null,
    setItem: (name, value) => void memory.set(name, value),
    removeItem: (name) => void memory.delete(name),
  };
}

interface NoteKoriState {
  /** False until persisted state has been read back from localStorage. */
  hasHydrated: boolean;
  setHasHydrated: () => void;

  analysis: AnalysisResult | null;
  imagePreview: string | null;
  activeSection: SectionId;

  highlights: Highlight[];

  flashcardIndex: number;
  difficultCardIds: string[];
  easyCardIds: string[];

  quizAnswers: Record<number, string>;

  selectedNodeId: string | null;

  setAnalysis: (result: AnalysisResult | null) => void;
  setImagePreview: (dataUrl: string | null) => void;
  setActiveSection: (section: SectionId) => void;

  addHighlight: (text: string, category: HighlightCategory, sectionId: string) => void;
  removeHighlight: (id: string) => void;
  clearHighlights: () => void;

  setFlashcardIndex: (index: number) => void;
  markCard: (id: string, level: "easy" | "difficult") => void;
  resetFlashcards: () => void;

  answerQuiz: (index: number, answer: string) => void;
  resetQuiz: () => void;

  setSelectedNode: (id: string | null) => void;
  reset: () => void;
}

export const useNoteKoriStore = create<NoteKoriState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: () => set({ hasHydrated: true }),

      analysis: null,
      imagePreview: null,
      activeSection: "upload",
      highlights: [],
      flashcardIndex: 0,
      difficultCardIds: [],
      easyCardIds: [],
      quizAnswers: {},
      selectedNodeId: null,

      setAnalysis: (result) =>
        set({
          analysis: result,
          activeSection: result ? "guide" : "upload",
          flashcardIndex: 0,
          difficultCardIds: [],
          easyCardIds: [],
          quizAnswers: {},
          selectedNodeId: null,
        }),

      setImagePreview: (dataUrl) => set({ imagePreview: dataUrl }),
      setActiveSection: (section) => set({ activeSection: section }),

      addHighlight: (text, category, sectionId) =>
        set((state) => {
          const trimmed = text.trim();
          if (!trimmed) return state;
          // Re-highlighting the same passage recategorises it instead of duplicating.
          const existing = state.highlights.find((h) => h.selected_text === trimmed);
          if (existing) {
            return {
              highlights: state.highlights.map((h) =>
                h.id === existing.id ? { ...h, category } : h,
              ),
            };
          }
          return {
            highlights: [
              ...state.highlights,
              {
                id: `highlight-${Date.now()}`,
                section_id: sectionId,
                selected_text: trimmed,
                category,
                start_offset: 0,
                end_offset: trimmed.length,
              },
            ],
          };
        }),

      removeHighlight: (id) =>
        set((state) => ({ highlights: state.highlights.filter((h) => h.id !== id) })),

      clearHighlights: () => set({ highlights: [] }),

      setFlashcardIndex: (index) => set({ flashcardIndex: Math.max(0, index) }),

      markCard: (id, level) =>
        set((state) => ({
          difficultCardIds:
            level === "difficult"
              ? Array.from(new Set([...state.difficultCardIds, id]))
              : state.difficultCardIds.filter((cardId) => cardId !== id),
          easyCardIds:
            level === "easy"
              ? Array.from(new Set([...state.easyCardIds, id]))
              : state.easyCardIds.filter((cardId) => cardId !== id),
        })),

      resetFlashcards: () =>
        set({ flashcardIndex: 0, difficultCardIds: [], easyCardIds: [] }),

      answerQuiz: (index, answer) =>
        set((state) => ({ quizAnswers: { ...state.quizAnswers, [index]: answer } })),

      resetQuiz: () => set({ quizAnswers: {} }),

      setSelectedNode: (id) => set({ selectedNodeId: id }),

      reset: () =>
        set({
          analysis: null,
          imagePreview: null,
          activeSection: "upload",
          highlights: [],
          flashcardIndex: 0,
          difficultCardIds: [],
          easyCardIds: [],
          quizAnswers: {},
          selectedNodeId: null,
        }),
    }),
    {
      name: "notekori-session",
      storage: createJSONStorage(createSafeStorage),
      // The image preview is a large object URL that is invalid across reloads;
      // persisting it would also risk the ~5MB localStorage quota. `hasHydrated`
      // must never be persisted or it would read back as true before hydration.
      partialize: (state) => ({ ...state, imagePreview: null, hasHydrated: false }),
      // Hydration is deferred to an explicit rehydrate() call from the page, so
      // the first client render always matches the server HTML.
      skipHydration: true,
      // Flip the flag even when rehydration errors, so a storage failure
      // degrades to an empty session rather than a blank page.
      onRehydrateStorage: () => () =>
        useNoteKoriStore.setState({ hasHydrated: true }),
    },
  ),
);
