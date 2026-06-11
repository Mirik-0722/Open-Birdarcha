import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import EdgeCurveProgram, { indexParallelEdgesIndex } from "@sigma/edge-curve";
import { expandNode, getGraph } from "../api";
import type { GEdge, GraphResponse } from "../types";

const NODE_COLORS: Record<string, string> = {
  person: "#1f9d8b",
  company: "#2f6fed",
  address: "#8a8a8a",
};

const EDGE_COLORS: Record<string, string> = {
  FOUNDER: "#e25555",
  DIRECTOR: "#2f6fed",
  REGISTERED_AT: "#b5b5b5",
};

function edgeLabel(e: GEdge): string {
  const old = e.data?.is_current === false;
  let base = "";
  if (e.type === "FOUNDER") {
    base = "ta'sischi";
    const share = e.data?.share_percent;
    if (share != null) base += ` ${share}%`;
  } else if (e.type === "DIRECTOR") {
    base = "rahbar";
  }
  return old && base ? `${base} (sobiq)` : base;
}

/**
 * Backend'dan kelgan graf bo'lagini mavjud grafga qo'shadi (id bo'yicha dedupe).
 * origin berilsa, yangi tugunlar shu nuqta atrofiga "tug'iladi" —
 * layout ularni tabiiy ravishda tarqatadi.
 */
function mergeGraph(
  graph: Graph,
  data: GraphResponse,
  origin?: { x: number; y: number }
) {
  const collapsed = data.meta?.collapsed ?? {};

  for (const n of data.nodes) {
    if (graph.hasNode(n.id)) continue;
    const liquidated = n.data?.status === "liquidated";
    let label = n.label;
    const cnt = (collapsed[n.id] ?? n.data?.company_count) as number | undefined;
    if (n.type === "address" && cnt && cnt > 1) {
      label = `${label} (+${cnt})`;
    }
    graph.addNode(n.id, {
      label,
      nodeType: n.type,
      size: n.id === data.root ? 13 : n.type === "address" ? 7 : 10,
      color: liquidated ? "#c0392b" : NODE_COLORS[n.type] ?? "#999",
      x: (origin?.x ?? 0) + (Math.random() - 0.5),
      y: (origin?.y ?? 0) + (Math.random() - 0.5),
    });
  }

  for (const e of data.edges) {
    if (graph.hasEdge(e.id)) continue;
    if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) continue;
    const current = e.data?.is_current !== false;
    graph.addEdgeWithKey(e.id, e.source, e.target, {
      label: edgeLabel(e),
      color: current ? EDGE_COLORS[e.type] ?? "#999" : "#cfcfcf",
      size: current ? 2.5 : 1.5,
    });
  }

  // Bir juft tugun orasidagi parallel qirralarni (FOUNDER + DIRECTOR)
  // egri chiziq qilib ajratamiz, ustma-ust tushmasin.
  indexParallelEdgesIndex(graph, {
    edgeIndexAttribute: "parallelIndex",
    edgeMinIndexAttribute: "parallelMinIndex",
    edgeMaxIndexAttribute: "parallelMaxIndex",
  });
  graph.forEachEdge((edge, attrs) => {
    const idx = attrs.parallelIndex as number | null | undefined;
    const max = attrs.parallelMaxIndex as number | null | undefined;
    if (typeof idx === "number" && typeof max === "number" && max > 0) {
      const c = 0.4 * (idx / max - 0.5) * 2;
      graph.mergeEdgeAttributes(edge, {
        type: "curved",
        curvature: c === 0 ? 0.2 : c,
      });
    }
  });
}

export default function ConnectionsGraph({ nodeId }: { nodeId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const graph = new Graph({ multi: true });
    const renderer = new Sigma(graph, container, {
      renderEdgeLabels: true,
      edgeProgramClasses: { curved: EdgeCurveProgram },
    });
    let disposed = false;

    async function load() {
      try {
        const data = await getGraph(nodeId, 2);
        if (disposed) return;
        mergeGraph(graph, data);
        forceAtlas2.assign(graph, {
          iterations: 300,
          settings: forceAtlas2.inferSettings(graph),
        });
        if (data.meta?.truncated) {
          setInfo("Graf juda katta — bir qismi ko'rsatildi");
        }
      } catch {
        if (!disposed) setError("Grafni yuklab bo'lmadi. Backend ishlayaptimi?");
      }
    }
    load();

    // Tugunni bosish = uning aloqalarini ochish (manzil uchun expand endpoint)
    renderer.on("clickNode", async ({ node }) => {
      try {
        const pos = graph.getNodeAttributes(node);
        const frag = node.startsWith("address:")
          ? await expandNode(node)
          : await getGraph(node, 1);
        if (disposed) return;
        mergeGraph(graph, frag, { x: pos.x as number, y: pos.y as number });
        forceAtlas2.assign(graph, {
          iterations: 120,
          settings: forceAtlas2.inferSettings(graph),
        });
      } catch {
        /* jim o'tkazamiz */
      }
    });

    return () => {
      disposed = true;
      renderer.kill();
    };
  }, [nodeId]);

  return (
    <div className="graph-wrap">
      <div ref={containerRef} className="graph-container" />
      <div className="graph-legend">
        <span>
          <i style={{ background: NODE_COLORS.person }} /> shaxs
        </span>
        <span>
          <i style={{ background: NODE_COLORS.company }} /> kompaniya
        </span>
        <span>
          <i style={{ background: "#c0392b" }} /> tugatilgan
        </span>
        <span>
          <i style={{ background: NODE_COLORS.address }} /> manzil
        </span>
        <span className="hint">Tugunni bossang — aloqalari ochiladi</span>
      </div>
      {info && <div className="graph-info">{info}</div>}
      {error && <div className="graph-error">{error}</div>}
    </div>
  );
}
