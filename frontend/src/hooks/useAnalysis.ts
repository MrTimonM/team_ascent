"use client";

import { useCallback, useState } from "react";

import { analyzeImage } from "@/lib/api";
import { useNoteKoriStore } from "@/store/useNoteKoriStore";

export function useAnalysis() {
  const setAnalysis = useNoteKoriStore((state) => state.setAnalysis);
  const setImagePreview = useNoteKoriStore((state) => state.setImagePreview);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (file: File) => {
      setIsAnalyzing(true);
      setError(null);

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      try {
        const result = await analyzeImage(file);
        setAnalysis(result);
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Something went wrong during analysis.",
        );
        return false;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [setAnalysis, setImagePreview],
  );

  return { run, isAnalyzing, error, clearError: () => setError(null) };
}
