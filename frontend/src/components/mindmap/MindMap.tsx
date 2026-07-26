"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Maximize2, Minimize2, RotateCcw, Search, X } from "lucide-react";

import { useNoteKoriStore } from "@/store/useNoteKoriStore";
import { NODE_COLORS } from "@/lib/utils";
import type { MindMap as MindMapData, MindMapNode } from "@/lib/types";

// react-force-graph touches `window` at module scope, so it must never be
// evaluated during SSR.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-ink-400">
      <Loader2 className="size-5 animate-spin" />
    </div>
  ),
});

interface GraphNode extends MindMapNode {
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relationship: string;
}

/** Minimal surface of the force-graph imperative handle that we actually use. */
interface ForceGraphHandle {
  centerAt: (x?: number, y?: number, ms?: number) => void;
  zoom: (level?: number, ms?: number) => void;
  zoomToFit: (ms?: number, padding?: number) => void;
  d3ReheatSimulation: () => void;
}

const NODE_RADIUS: Record<string, number> = {
  main: 11,
  subtopic: 7.5,
  definition: 6,
  example: 6,
  code: 6,
  error: 6,
  exam: 6,
};

function linkEndpointId(endpoint: string | GraphNode): string {
  return typeof endpoint === "object" ? endpoint.id : endpoint;
}

export function MindMap({ data }: { data: MindMapData }) {
  const graphRef = useRef<ForceGraphHandle | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedNodeId = useNoteKoriStore((state) => state.selectedNodeId);
  const setSelectedNode = useNoteKoriStore((state) => state.setSelectedNode);

  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [size, setSize] = useState({ width: 800, height: 520 });

  // Clone before handing to the graph: the simulation mutates nodes in place,
  // which would otherwise corrupt the Zustand store.
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((node) => ({ ...node })) as GraphNode[],
      links: data.edges.map((edge) => ({ ...edge })) as GraphLink[],
    }),
    [data],
  );

  // Reveal counter, tied to the graph identity. Adjusting it during render
  // (rather than in an effect) is React's recommended way to reset state when
  // an input changes, and avoids a cascading re-render.
  const [reveal, setReveal] = useState<{ data: typeof graphData; count: number }>({
    data: graphData,
    count: 0,
  });
  if (reveal.data !== graphData) {
    setReveal({ data: graphData, count: 0 });
  }
  const revealed = reveal.data === graphData ? reveal.count : 0;

  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of data.edges) {
      if (!map.has(edge.source)) map.set(edge.source, new Set());
      if (!map.has(edge.target)) map.set(edge.target, new Set());
      map.get(edge.source)!.add(edge.target);
      map.get(edge.target)!.add(edge.source);
    }
    return map;
  }, [data.edges]);

  // Track the container so the canvas fills it on resize and fullscreen toggle.
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Stagger node appearance so the graph assembles itself rather than popping in.
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    const interval = setInterval(() => {
      setReveal((current) => {
        if (current.data !== graphData) return current;
        if (current.count >= graphData.nodes.length) {
          clearInterval(interval);
          return current;
        }
        return { data: graphData, count: current.count + 1 };
      });
    }, 55);

    return () => clearInterval(interval);
  }, [graphData]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const focusNode = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node.id);
      if (node.x !== undefined && node.y !== undefined) {
        graphRef.current?.centerAt(node.x, node.y, 700);
        graphRef.current?.zoom(2.4, 700);
      }
    },
    [setSelectedNode],
  );

  const runSearch = useCallback(() => {
    const term = query.trim().toLowerCase();
    if (!term) return;

    const match = graphData.nodes.find(
      (node) =>
        node.label.toLowerCase().includes(term) ||
        node.description?.toLowerCase().includes(term),
    );
    if (match) focusNode(match);
  }, [query, graphData.nodes, focusNode]);

  const resetView = useCallback(() => {
    setSelectedNode(null);
    setQuery("");
    graphRef.current?.zoomToFit(600, 60);
    graphRef.current?.d3ReheatSimulation();
  }, [setSelectedNode]);

  const activeId = hoveredId ?? selectedNodeId;
  const activeNeighbours = activeId ? neighbours.get(activeId) : undefined;

  const selectedNode = useMemo(
    () => data.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [data.nodes, selectedNodeId],
  );

  const isDimmed = useCallback(
    (nodeId: string) =>
      Boolean(activeId) && nodeId !== activeId && !activeNeighbours?.has(nodeId),
    [activeId, activeNeighbours],
  );

  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const index = graphData.nodes.findIndex((candidate) => candidate.id === node.id);
      if (index >= revealed) return;

      const radius = NODE_RADIUS[node.category] ?? 6;
      const color = NODE_COLORS[node.category] ?? NODE_COLORS.subtopic;
      const dimmed = isDimmed(node.id);

      ctx.globalAlpha = dimmed ? 0.2 : 1;

      // Glow on the focused node and a permanent halo on the main topic.
      if (node.id === activeId || node.category === "main") {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, radius + 5, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}25`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (node.id === selectedNodeId) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }

      const fontSize = Math.max(10 / scale, 2.2);
      ctx.font = `${node.category === "main" ? 600 : 400} ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = dimmed ? "#4b5169" : "#e8ebf5";
      ctx.fillText(node.label, node.x!, node.y! + radius + 2.5);

      ctx.globalAlpha = 1;
    },
    [graphData.nodes, revealed, isDimmed, activeId, selectedNodeId],
  );

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900/40 text-sm text-ink-400">
        No mind map was generated for this image.
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-ink-950 p-4"
          : "flex flex-col gap-3"
      }
    >
      <div className="no-print flex flex-wrap items-center gap-2">
        <div className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-ink-700 bg-ink-900/60 px-3 py-2">
          <Search className="size-4 shrink-0 text-ink-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && runSearch()}
            placeholder="Search a concept, then press Enter"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-ink-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X className="size-3.5 text-ink-400 hover:text-white" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={resetView}
          className="flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-white"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen((value) => !value)}
          className="flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-white"
        >
          {isFullscreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
          {isFullscreen ? "Exit" : "Fullscreen"}
        </button>
      </div>

      <div
        ref={wrapperRef}
        className={`relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-950/60 ${
          isFullscreen ? "flex-1" : "h-[520px]"
        }`}
      >
        <ForceGraph2D
          ref={graphRef as never}
          graphData={graphData}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeCanvasObject={drawNode as never}
          nodePointerAreaPaint={((
            node: GraphNode,
            color: string,
            ctx: CanvasRenderingContext2D,
          ) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, (NODE_RADIUS[node.category] ?? 6) + 3, 0, 2 * Math.PI);
            ctx.fill();
          }) as never}
          linkColor={((link: GraphLink) => {
            const source = linkEndpointId(link.source);
            const target = linkEndpointId(link.target);
            const connected = activeId === source || activeId === target;
            if (connected) return "rgba(124,140,255,0.85)";
            return activeId ? "rgba(51,56,82,0.35)" : "rgba(51,56,82,0.9)";
          }) as never}
          linkWidth={((link: GraphLink) => {
            const source = linkEndpointId(link.source);
            const target = linkEndpointId(link.target);
            return activeId === source || activeId === target ? 2 : 1;
          }) as never}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={((link: GraphLink) => {
            const source = linkEndpointId(link.source);
            const target = linkEndpointId(link.target);
            return activeId === source || activeId === target ? 2.5 : 0;
          }) as never}
          linkDirectionalParticleColor={(() => "#7c8cff") as never}
          onNodeClick={((node: GraphNode) => focusNode(node)) as never}
          onNodeHover={((node: GraphNode | null) => setHoveredId(node?.id ?? null)) as never}
          onBackgroundClick={() => setSelectedNode(null)}
          enableNodeDrag
          enableZoomInteraction
          enablePanInteraction
          cooldownTicks={120}
          d3AlphaDecay={0.025}
          d3VelocityDecay={0.3}
          onEngineStop={() => graphRef.current?.zoomToFit(500, 60)}
        />

        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-4 right-4 rounded-xl border border-ink-600 bg-ink-850/95 p-4 backdrop-blur sm:right-auto sm:max-w-sm"
            >
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      background:
                        NODE_COLORS[selectedNode.category] ?? NODE_COLORS.subtopic,
                    }}
                  />
                  <h3 className="font-medium text-white">{selectedNode.label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  aria-label="Close node details"
                >
                  <X className="size-4 text-ink-400 hover:text-white" />
                </button>
              </div>
              <p className="text-xs uppercase tracking-wider text-ink-400">
                {selectedNode.category}
              </p>
              {selectedNode.description && (
                <p className="mt-2 text-sm leading-relaxed text-ink-200">
                  {selectedNode.description}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="no-print flex flex-wrap gap-3 text-xs text-ink-400">
        {Object.entries(NODE_COLORS).map(([category, color]) => (
          <span key={category} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: color }} />
            {category}
          </span>
        ))}
      </div>
    </div>
  );
}
