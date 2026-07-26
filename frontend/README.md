# NoteKori — Frontend

Next.js 16 (App Router) + TypeScript + Tailwind v4 + Framer Motion.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

`.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Never put the model API key here — anything prefixed `NEXT_PUBLIC_` is visible in the
browser. The key lives only in `backend/.env`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs typecheck) |
| `npm run lint` | ESLint, including the React Compiler rules |

## Structure

| Path | Role |
| --- | --- |
| `src/app/` | Layout, page shell, global + print CSS |
| `src/components/upload/` | Dropzone and staged analysis progress |
| `src/components/notes/` | Markdown reader, code diff, highlight toolbar |
| `src/components/mindmap/` | Force-directed graph |
| `src/components/flashcards/` | Deck and 3D flip card |
| `src/components/quiz/` | Scored quiz with weak-topic report |
| `src/components/export/` | Export panel and print-only report |
| `src/hooks/` | `useAnalysis`, `useTextSelection` |
| `src/store/` | Zustand store, persisted to localStorage |

## Implementation notes

**Hydration.** The store uses `skipHydration`, and `page.tsx` calls `persist.rehydrate()`
on mount. Until it completes a skeleton renders, so the first client paint always
matches the server HTML. The pre-hydration skeleton sits *outside* `AnimatePresence` —
inside it, `mode="wait"` would block the first real section on the skeleton's exit
animation.

**Storage fallback.** `localStorage` throws in private browsing and with cookies
blocked. `createSafeStorage()` probes it and falls back to an in-memory map, and the
hydration flag is set even when rehydration errors, so storage failure degrades to an
empty session rather than a permanently blank page.

**Mind map.** `react-force-graph-2d` reads `window` at module scope and must be loaded
with `dynamic(..., { ssr: false })`. Graph data is cloned before being handed over,
because the d3 simulation mutates nodes in place and would otherwise corrupt the store.

**Print.** The interactive shell is `no-print`; `PrintableReport` is `hidden print:block`.
Bangla shaping comes from the system font stack, which is why print-to-PDF is used
instead of server-side rendering.
