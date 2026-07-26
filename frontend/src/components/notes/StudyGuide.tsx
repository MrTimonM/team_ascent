"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { AlertTriangle, BookOpen, Code2, Languages, Lightbulb, Timer } from "lucide-react";

import { CodeBlockCard } from "@/components/notes/CodeBlock";
import { HighlightToolbar } from "@/components/notes/HighlightToolbar";
import { useTextSelection } from "@/hooks/useTextSelection";
import { useNoteKoriStore } from "@/store/useNoteKoriStore";
import type { AnalysisResult } from "@/lib/types";

function Section({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="print-section"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-400">
        {icon}
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

export function StudyGuide({ result }: { result: AnalysisResult }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selection, clear } = useTextSelection(containerRef);
  const addHighlight = useNoteKoriStore((state) => state.addHighlight);

  return (
    <div ref={containerRef} className="space-y-10">
      <AnimatePresence>
        {selection && (
          <HighlightToolbar
            x={selection.x}
            y={selection.y}
            onPick={(category) => {
              addHighlight(selection.text, category, "study-guide");
              clear();
            }}
            onDismiss={clear}
          />
        )}
      </AnimatePresence>

      {result.clean_notes && (
        <Section title="Study Guide" icon={<BookOpen className="size-4" />}>
          <div className="prose-notekori max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {result.clean_notes}
            </ReactMarkdown>
          </div>
        </Section>
      )}

      {result.bangla_explanation && (
        <Section
          title="সহজ বাংলা ব্যাখ্যা"
          icon={<Languages className="size-4" />}
          delay={0.05}
        >
          <div className="rounded-2xl border border-accent-500/25 bg-accent-500/[0.06] p-5">
            <div className="bangla prose-notekori max-w-none text-[0.98rem]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.bangla_explanation}
              </ReactMarkdown>
            </div>
          </div>
        </Section>
      )}

      {result.key_concepts.length > 0 && (
        <Section
          title="Key Concepts"
          icon={<Lightbulb className="size-4" />}
          delay={0.1}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {result.key_concepts.map((concept, index) => (
              <motion.div
                key={`${concept.name}-${index}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.1 + index * 0.04 }}
                className="avoid-break rounded-xl border border-ink-700 bg-ink-900/50 p-4"
              >
                <h3 className="mb-1 font-medium text-white">{concept.name}</h3>
                <p className="text-sm leading-relaxed text-ink-400">
                  {concept.definition}
                </p>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {result.code_blocks.length > 0 && (
        <Section title="Code" icon={<Code2 className="size-4" />} delay={0.15}>
          <div className="space-y-4">
            {result.code_blocks.map((block, index) => (
              <CodeBlockCard key={index} block={block} index={index} />
            ))}
          </div>
        </Section>
      )}

      {result.uncertain_content.length > 0 && (
        <Section
          title="Uncertain Content"
          icon={<AlertTriangle className="size-4" />}
          delay={0.2}
        >
          <p className="mb-3 text-sm text-ink-400">
            These passages were unclear in the photo. Check them against your own notes
            before revising.
          </p>
          <div className="space-y-2">
            {result.uncertain_content.map((item, index) => (
              <div
                key={index}
                className="avoid-break flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3.5"
              >
                <span className="mt-0.5 shrink-0 rounded-md bg-amber-400/15 px-1.5 py-0.5 font-mono text-xs text-amber-300">
                  {Math.round(item.confidence * 100)}%
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-ink-200">{item.text}</p>
                  {item.reason && (
                    <p className="mt-1 text-xs text-ink-400">{item.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.revision_summary && (
        <Section
          title="One-Minute Revision"
          icon={<Timer className="size-4" />}
          delay={0.25}
        >
          <div className="rounded-2xl border border-brand-500/25 bg-brand-500/[0.07] p-5">
            <div className="prose-notekori max-w-none text-[0.95rem]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.revision_summary}
              </ReactMarkdown>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
