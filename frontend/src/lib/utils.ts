import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORY_STYLES: Record<
  string,
  { label: string; chip: string; dot: string; mark: string }
> = {
  important: {
    label: "Important",
    chip: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    dot: "bg-amber-400",
    mark: "bg-amber-400/30",
  },
  definition: {
    label: "Definition",
    chip: "bg-sky-400/15 text-sky-300 border-sky-400/30",
    dot: "bg-sky-400",
    mark: "bg-sky-400/30",
  },
  difficult: {
    label: "Difficult",
    chip: "bg-rose-400/15 text-rose-300 border-rose-400/30",
    dot: "bg-rose-400",
    mark: "bg-rose-400/30",
  },
  understood: {
    label: "Understood",
    chip: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    dot: "bg-emerald-400",
    mark: "bg-emerald-400/30",
  },
};

export const NODE_COLORS: Record<string, string> = {
  main: "#7c8cff",
  subtopic: "#35d6c0",
  definition: "#38bdf8",
  example: "#a78bfa",
  code: "#fbbf24",
  error: "#f87171",
  exam: "#f472b6",
};

export const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  intermediate: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  advanced: "bg-rose-400/15 text-rose-300 border-rose-400/30",
};
