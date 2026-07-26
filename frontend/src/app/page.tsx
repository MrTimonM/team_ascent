"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Download,
  Highlighter,
  Layers,
  ListChecks,
  Network,
  RotateCcw,
  Upload,
} from "lucide-react";

import { ExportPanel } from "@/components/export/ExportPanel";
import { PrintableReport } from "@/components/export/PrintableReport";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";
import { HighlightsPanel } from "@/components/highlights/HighlightsPanel";
import { MindMap } from "@/components/mindmap/MindMap";
import { StudyGuide } from "@/components/notes/StudyGuide";
import { QuizPanel } from "@/components/quiz/QuizPanel";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { checkHealth } from "@/lib/api";
import { useNoteKoriStore } from "@/store/useNoteKoriStore";
import type { SectionId } from "@/lib/types";

const NAV: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "upload", label: "Upload", icon: <Upload className="size-4" /> },
  { id: "guide", label: "Study Guide", icon: <BookOpen className="size-4" /> },
  { id: "mindmap", label: "Mind Map", icon: <Network className="size-4" /> },
  { id: "flashcards", label: "Flashcards", icon: <Layers className="size-4" /> },
  { id: "quiz", label: "Quiz", icon: <ListChecks className="size-4" /> },
  { id: "highlights", label: "Highlights", icon: <Highlighter className="size-4" /> },
  { id: "export", label: "Export", icon: <Download className="size-4" /> },
];

function BackendStatus() {
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    checkHealth()
      .then((health) =>
        setState({
          ok: health.api_key_configured,
          message: health.api_key_configured
            ? health.model
            : "Backend up · GEMMA_API_KEY not set",
        }),
      )
      .catch(() => setState({ ok: false, message: "Backend offline" }));
  }, []);

  if (!state) return null;

  return (
    <span className="hidden items-center gap-1.5 text-xs text-ink-400 sm:flex">
      <span
        className={`size-1.5 rounded-full ${state.ok ? "bg-emerald-400" : "bg-amber-400"}`}
      />
      {state.message}
    </span>
  );
}

export default function Home() {
  const analysis = useNoteKoriStore((state) => state.analysis);
  const activeSection = useNoteKoriStore((state) => state.activeSection);
  const setActiveSection = useNoteKoriStore((state) => state.setActiveSection);
  const reset = useNoteKoriStore((state) => state.reset);
  const highlights = useNoteKoriStore((state) => state.highlights);

  // The store defers rehydration (skipHydration) so the first client render
  // matches the server HTML; kick it off once mounted.
  const hydrated = useNoteKoriStore((state) => state.hasHydrated);
  useEffect(() => {
    void useNoteKoriStore.persist.rehydrate();
  }, []);

  const available = (id: SectionId) => id === "upload" || Boolean(analysis);

  const renderSection = () => {
    if (activeSection === "upload" || !analysis) {
      return (
        <div className="mx-auto max-w-2xl">
          <ImageUploader />
        </div>
      );
    }

    switch (activeSection) {
      case "guide":
        return <StudyGuide result={analysis} />;
      case "mindmap":
        return <MindMap data={analysis.mindmap} />;
      case "flashcards":
        return <FlashcardDeck cards={analysis.flashcards} />;
      case "quiz":
        return <QuizPanel questions={analysis.quiz} />;
      case "highlights":
        return <HighlightsPanel />;
      case "export":
        return <ExportPanel result={analysis} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="NoteKori logo"
              width={226}
              height={121}
              priority
              className="h-9 w-auto"
            />
            <div>
              <h1 className="font-semibold leading-tight text-white">NoteKori</h1>
              <p className="text-xs leading-tight text-ink-400">
                Whiteboard to study workspace
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <BackendStatus />
            {hydrated && analysis && (
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-xs text-ink-400 transition-colors hover:bg-ink-800 hover:text-white"
              >
                <RotateCcw className="size-3.5" />
                New image
              </button>
            )}
          </div>
        </div>
      </header>

      {/* The whole interactive shell is excluded from print; PrintableReport
          below is the only thing that reaches the PDF. */}
      <div className="no-print mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6">
        <nav className="no-print hidden w-52 shrink-0 lg:block">
          <div className="sticky top-24 space-y-1">
            {NAV.map((item) => {
              const enabled = hydrated && available(item.id);
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!enabled}
                  onClick={() => setActiveSection(item.id)}
                  className={`relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "text-white"
                      : enabled
                        ? "text-ink-400 hover:bg-ink-800/60 hover:text-white"
                        : "cursor-not-allowed text-ink-600"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl border border-brand-500/40 bg-brand-500/15"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{item.icon}</span>
                  <span className="relative">{item.label}</span>
                  {item.id === "highlights" && hydrated && highlights.length > 0 && (
                    <span className="relative ml-auto rounded-md bg-ink-700 px-1.5 py-0.5 text-xs text-ink-200">
                      {highlights.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          <div className="no-print mb-5 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
            {NAV.map((item) => {
              const enabled = hydrated && available(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!enabled}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    activeSection === item.id
                      ? "border-brand-500/40 bg-brand-500/15 text-white"
                      : enabled
                        ? "border-ink-700 bg-ink-900/60 text-ink-400"
                        : "border-ink-800 text-ink-600"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          {hydrated && analysis && activeSection !== "upload" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="no-print mb-6 border-b border-ink-800 pb-5"
            >
              <h2 className="bangla text-2xl font-semibold text-white">{analysis.title}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-400">
                <span>{analysis.subject}</span>
                {analysis.languages.length > 0 && (
                  <>
                    <span className="text-ink-700">·</span>
                    <span>{analysis.languages.join(", ")}</span>
                  </>
                )}
                <span className="text-ink-700">·</span>
                <span
                  className={
                    analysis.confidence_score >= 0.75
                      ? "text-emerald-400"
                      : analysis.confidence_score >= 0.5
                        ? "text-amber-400"
                        : "text-rose-400"
                  }
                >
                  {Math.round(analysis.confidence_score * 100)}% confidence
                </span>
              </div>
            </motion.div>
          )}

          {/* The pre-hydration skeleton is kept outside AnimatePresence: with
              mode="wait" a key change would block the first real section on the
              skeleton's exit animation. */}
          {hydrated ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-64 animate-pulse rounded-2xl border border-ink-800 bg-ink-900/40" />
          )}
        </main>
      </div>

      {hydrated && analysis && <PrintableReport result={analysis} />}
    </div>
  );
}
