"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, FileDown, FileText, Loader2, Printer } from "lucide-react";

import { exportMarkdown } from "@/lib/api";
import { useNoteKoriStore } from "@/store/useNoteKoriStore";
import type { AnalysisResult } from "@/lib/types";

export function ExportPanel({ result }: { result: AnalysisResult }) {
  const highlights = useNoteKoriStore((state) => state.highlights);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadMarkdown = async () => {
    setBusy(true);
    setError(null);
    try {
      await exportMarkdown(result, highlights);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const contents = [
    ["Study guide", Boolean(result.clean_notes)],
    ["Bangla explanation", Boolean(result.bangla_explanation)],
    ["Key concepts", result.key_concepts.length > 0],
    ["Corrected code", result.code_blocks.length > 0],
    ["Uncertain content", result.uncertain_content.length > 0],
    ["Mermaid mind map", Boolean(result.mermaid)],
    ["Flashcards", result.flashcards.length > 0],
    ["Quiz with answers", result.quiz.length > 0],
    ["Exam questions", result.exam_questions.length > 0],
    ["Revision summary", Boolean(result.revision_summary)],
    ["Your highlights", highlights.length > 0],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={downloadMarkdown}
          disabled={busy}
          className="flex items-start gap-3 rounded-2xl border border-ink-700 bg-ink-900/50 p-5 text-left transition-colors hover:border-brand-500/50 disabled:opacity-60"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15">
            {busy ? (
              <Loader2 className="size-5 animate-spin text-brand-400" />
            ) : (
              <FileText className="size-5 text-brand-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-white">Download Markdown</p>
            <p className="mt-1 text-sm text-ink-400">
              A single .md file with a Mermaid mind map — drops straight into Obsidian.
            </p>
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={() => window.print()}
          className="flex items-start gap-3 rounded-2xl border border-ink-700 bg-ink-900/50 p-5 text-left transition-colors hover:border-accent-500/50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15">
            <Printer className="size-5 text-accent-400" />
          </div>
          <div>
            <p className="font-medium text-white">Download PDF</p>
            <p className="mt-1 text-sm text-ink-400">
              Opens your print dialog — choose &ldquo;Save as PDF&rdquo;. Bangla renders
              correctly.
            </p>
          </div>
        </motion.button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-ink-700 bg-ink-900/40 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <FileDown className="size-4 text-ink-400" />
          What gets included
        </h3>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {contents.map(([label, included]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span
                className={`size-1.5 rounded-full ${
                  included ? "bg-accent-400" : "bg-ink-700"
                }`}
              />
              <span className={included ? "text-ink-200" : "text-ink-600 line-through"}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
