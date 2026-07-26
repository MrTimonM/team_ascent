"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

const STAGES = [
  "Uploading image",
  "Improving readability",
  "Analyzing with Gemma",
  "Building study guide",
  "Generating mind map",
  "Creating flashcards",
];

/**
 * The backend call is a single opaque request, so stage progress is paced on a
 * timer. The last stage intentionally never auto-completes — it holds until the
 * real response arrives, so the UI never claims to be done before it is.
 */
export function AnalysisProgress() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Paced against a real ~2 minute run, most of it spent in the model call.
    const timings = [900, 2500, 70000, 20000, 14000];
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;

    const advance = () => {
      if (index >= timings.length) return;
      timer = setTimeout(() => {
        index += 1;
        setStage(index);
        advance();
      }, timings[index]);
    };
    advance();

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      {STAGES.map((label, index) => {
        const done = index < stage;
        const active = index === stage;

        return (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -12 }}
            animate={{
              opacity: done || active ? 1 : 0.35,
              x: 0,
            }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center gap-3"
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                done
                  ? "border-accent-500 bg-accent-500/20 text-accent-400"
                  : active
                    ? "border-brand-500 bg-brand-500/20 text-brand-400"
                    : "border-ink-700 text-ink-400"
              }`}
            >
              {done ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : active ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>

            <span
              className={`text-sm ${
                active ? "font-medium text-white" : done ? "text-ink-200" : "text-ink-400"
              }`}
            >
              {label}
            </span>

            {active && (
              <motion.span
                className="ml-auto h-px flex-1 max-w-24 origin-left rounded bg-gradient-to-r from-brand-500 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </motion.div>
        );
      })}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="pt-2 text-center text-sm text-ink-400"
      >
        It works but it takes around 2 minutes to complete. Please wait
      </motion.p>
    </div>
  );
}
