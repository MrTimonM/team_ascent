"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ImageUp, Sparkles, X } from "lucide-react";

import { AnalysisProgress } from "@/components/upload/AnalysisProgress";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useNoteKoriStore } from "@/store/useNoteKoriStore";

const ACCEPTED = "image/png,image/jpeg,image/webp";

export function ImageUploader() {
  const { run, isAnalyzing, error, clearError } = useAnalysis();
  const imagePreview = useNoteKoriStore((state) => state.imagePreview);
  const setImagePreview = useNoteKoriStore((state) => state.setImagePreview);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useCallback(
    (incoming: File | undefined) => {
      if (!incoming) return;
      clearError();
      setFile(incoming);
      setImagePreview(URL.createObjectURL(incoming));
    },
    [clearError, setImagePreview],
  );

  const clear = () => {
    setFile(null);
    setImagePreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-ink-700 bg-ink-900/60 p-10 backdrop-blur"
      >
        <div className="mb-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500"
          >
            <Sparkles className="size-7 text-white" />
          </motion.div>
          <h2 className="text-lg font-semibold text-white">Reading your notes</h2>
          <p className="mt-1 text-sm text-ink-400">
            This usually takes 15–40 seconds depending on how dense the board is.
          </p>
        </div>
        <AnalysisProgress />
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          accept(event.dataTransfer.files?.[0]);
        }}
        onClick={() => !imagePreview && inputRef.current?.click()}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-brand-400 bg-brand-500/10"
            : "border-ink-700 bg-ink-900/40 hover:border-ink-600"
        } ${imagePreview ? "" : "cursor-pointer"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(event) => accept(event.target.files?.[0] ?? undefined)}
        />

        <AnimatePresence mode="wait">
          {imagePreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Object URLs cannot be optimised by next/image. */}
              <Image
                src={imagePreview}
                alt="Uploaded whiteboard preview"
                width={1200}
                height={800}
                unoptimized
                className="max-h-[420px] w-full object-contain"
              />
              <button
                type="button"
                onClick={clear}
                aria-label="Remove image"
                className="absolute right-3 top-3 rounded-lg border border-ink-600 bg-ink-950/80 p-2 text-ink-200 backdrop-blur transition-colors hover:bg-ink-800 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl border border-ink-700 bg-ink-800">
                <ImageUp className="size-6 text-brand-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  Drop a whiteboard photo, or click to browse
                </p>
                <p className="mt-1 text-sm text-ink-400">
                  PNG, JPG or WebP · up to 10 MB · Bangla, English or mixed
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
            <p className="text-sm text-rose-200">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        disabled={!file}
        onClick={() => file && run(file)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3.5 font-medium text-white shadow-lg shadow-brand-600/20 transition-all hover:from-brand-500 hover:to-brand-400 disabled:cursor-not-allowed disabled:from-ink-800 disabled:to-ink-800 disabled:text-ink-400 disabled:shadow-none"
      >
        <Sparkles className="size-4" />
        Analyze notes
      </button>
    </div>
  );
}
