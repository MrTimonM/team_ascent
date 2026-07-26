"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Copy, Wrench } from "lucide-react";

import type { CodeBlock as CodeBlockType } from "@/lib/types";

function CodePane({
  label,
  code,
  language,
  tone,
}: {
  label: string;
  code: string;
  language: string;
  tone: "error" | "ok";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`text-xs font-medium ${
            tone === "error" ? "text-rose-300" : "text-emerald-300"
          }`}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="no-print flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-ink-400 transition-colors hover:text-white"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={`overflow-x-auto rounded-xl border p-3.5 text-[0.82rem] leading-relaxed ${
          tone === "error"
            ? "border-rose-500/25 bg-rose-500/[0.06]"
            : "border-emerald-500/25 bg-emerald-500/[0.06]"
        }`}
      >
        <code className={`language-${language} font-mono`}>{code}</code>
      </pre>
    </div>
  );
}

export function CodeBlockCard({ block, index }: { block: CodeBlockType; index: number }) {
  const hasCorrection =
    Boolean(block.corrected_code) && block.corrected_code !== block.original_code;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="avoid-break rounded-2xl border border-ink-700 bg-ink-900/50 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md border border-ink-700 bg-ink-800 px-2 py-0.5 font-mono text-xs text-accent-400">
          {block.language || "text"}
        </span>
        {hasCorrection && (
          <span className="flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300">
            <Wrench className="size-3" />
            Correction suggested
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {block.original_code && (
          <CodePane
            label={hasCorrection ? "As written on the board" : "From the board"}
            code={block.original_code}
            language={block.language}
            tone={hasCorrection ? "error" : "ok"}
          />
        )}

        {hasCorrection && (
          <>
            <div className="hidden shrink-0 items-center lg:flex">
              <ArrowRight className="size-4 text-ink-600" />
            </div>
            <CodePane
              label="Corrected"
              code={block.corrected_code}
              language={block.language}
              tone="ok"
            />
          </>
        )}
      </div>

      {block.explanation && (
        <p className="mt-3 border-l-2 border-brand-500/50 pl-3 text-sm text-ink-400">
          {block.explanation}
        </p>
      )}
    </motion.div>
  );
}
