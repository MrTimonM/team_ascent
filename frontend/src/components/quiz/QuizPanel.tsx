"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RotateCcw, Trophy, X } from "lucide-react";

import { useNoteKoriStore } from "@/store/useNoteKoriStore";
import type { QuizQuestion } from "@/lib/types";

function verdict(score: number, total: number): string {
  if (total === 0) return "—";
  const ratio = score / total;
  if (ratio >= 0.9) return "Excellent";
  if (ratio >= 0.7) return "Good";
  if (ratio >= 0.5) return "Fair";
  return "Needs revision";
}

export function QuizPanel({ questions }: { questions: QuizQuestion[] }) {
  const answers = useNoteKoriStore((state) => state.quizAnswers);
  const answerQuiz = useNoteKoriStore((state) => state.answerQuiz);
  const resetQuiz = useNoteKoriStore((state) => state.resetQuiz);

  const answered = Object.keys(answers).length;
  const score = useMemo(
    () =>
      questions.reduce(
        (total, question, index) =>
          answers[index] === question.correct_answer ? total + 1 : total,
        0,
      ),
    [questions, answers],
  );

  const weakTopics = useMemo(
    () =>
      questions
        .filter((question, index) => answers[index] && answers[index] !== question.correct_answer)
        .map((question) => question.question)
        .slice(0, 3),
    [questions, answers],
  );

  if (questions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900/40 text-sm text-ink-400">
        No quiz questions were generated for this image.
      </div>
    );
  }

  const complete = answered === questions.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900/40 px-4 py-3">
        <span className="text-sm text-ink-200">
          Answered {answered} of {questions.length}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">
            Score {score}/{questions.length}
          </span>
          <button
            type="button"
            onClick={resetQuiz}
            className="no-print flex items-center gap-1 text-xs text-ink-400 transition-colors hover:text-white"
          >
            <RotateCcw className="size-3.5" />
            Retry
          </button>
        </div>
      </div>

      {questions.map((question, index) => {
        const chosen = answers[index];
        const isAnswered = Boolean(chosen);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="avoid-break rounded-2xl border border-ink-700 bg-ink-900/50 p-5"
          >
            <p className="bangla mb-4 font-medium text-white">
              <span className="mr-2 text-ink-400">{index + 1}.</span>
              {question.question}
            </p>

            <div className="space-y-2">
              {question.options.map((option) => {
                const isCorrect = option === question.correct_answer;
                const isChosen = option === chosen;

                let tone = "border-ink-700 bg-ink-850/60 hover:border-ink-600";
                if (isAnswered && isCorrect) {
                  tone = "border-emerald-400/40 bg-emerald-400/10";
                } else if (isAnswered && isChosen) {
                  tone = "border-rose-400/40 bg-rose-400/10";
                } else if (isAnswered) {
                  tone = "border-ink-700 bg-ink-850/30 opacity-60";
                }

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => answerQuiz(index, option)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${tone} ${
                      isAnswered ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <span className="bangla flex-1 text-ink-200">{option}</span>
                    {isAnswered && isCorrect && (
                      <Check className="size-4 shrink-0 text-emerald-400" />
                    )}
                    {isAnswered && isChosen && !isCorrect && (
                      <X className="size-4 shrink-0 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {isAnswered && question.explanation && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bangla mt-3 overflow-hidden border-l-2 border-brand-500/50 pl-3 text-sm text-ink-400"
                >
                  {question.explanation}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="avoid-break rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-600/15 to-ink-900 p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
                <Trophy className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Quiz complete</h3>
                <p className="text-sm text-ink-400">
                  Score {score}/{questions.length} · {verdict(score, questions.length)}
                </p>
              </div>
            </div>

            {weakTopics.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">
                  Revise these
                </p>
                <ul className="space-y-1.5">
                  {weakTopics.map((topic) => (
                    <li key={topic} className="bangla flex gap-2 text-sm text-ink-200">
                      <span className="text-rose-400">•</span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-emerald-300">
                Every answer was correct. This topic is solid.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
