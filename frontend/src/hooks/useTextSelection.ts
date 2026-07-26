"use client";

import { useCallback, useEffect, useState } from "react";

export interface SelectionState {
  text: string;
  x: number;
  y: number;
}

/**
 * Tracks a text selection inside `containerRef` and reports its viewport
 * position so a floating toolbar can be anchored to it.
 */
export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const clear = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    const handle = () => {
      const active = window.getSelection();

      if (!active || active.isCollapsed || active.rangeCount === 0) {
        setSelection(null);
        return;
      }

      const range = active.getRangeAt(0);
      const container = containerRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      const text = active.toString().trim();
      if (text.length < 3) {
        setSelection(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    };

    // `mouseup` covers pointer selection; `selectionchange` covers keyboard
    // and touch handles, which never fire mouseup.
    document.addEventListener("mouseup", handle);
    document.addEventListener("selectionchange", handle);

    return () => {
      document.removeEventListener("mouseup", handle);
      document.removeEventListener("selectionchange", handle);
    };
  }, [containerRef]);

  return { selection, clear };
}
