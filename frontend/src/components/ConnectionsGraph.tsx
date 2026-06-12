import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  MarkerType,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { getGraph } from "../api";
import type { GEdge, GNode, GraphResponse } from "../types";
import EntityNode, { type EntityNodeData } from "./EntityNode";
import NodeDetailPanel, { type Selected } from "./NodeDetailPanel";

const FOUNDER_COLOR = "#2f6fed"; // ta'sis etgan (учредил) — ko'k
const DIRECTOR_COLOR = "#f4623a"; // rahbarlik (руководит) — to'q sariq

const nodeTypes = { entity: EntityNode };

function edgeColor(type: string): string {
  return type === "FOUNDER" ? FOUNDER_COLOR : type === "DIRECTOR" ? DIRECTOR_COLOR : "#94a3b8";
}

const NODE_W = 212;
const NODE_H = 70;

/** Dagre bilan chapdan-o'ngga ierarxik joylashuv. */
function layout(nodes: Node<EntityNodeData>[], edges: Edge[]): Node<EntityNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranksep: 110, nodesep: 16, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 } };
  });
}

function Inner({ nodeId }: { nodeId: string }) {
  const rf = useReactFlow();
  const rawNodes = useRef(new Map<string, GNode>());
  const rawEdges = useRef(new Map<string, GEdge>());
  const wrapRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<EntityNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [isFs, setIsFs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const selectedRef = useRef<string | null>(null);
  // Joriy graf ildizini kuzatadi — async javoblar eskirganini aniqlash uchun.
  const nodeIdRef = useRef(nodeId);
  useEffect(() => {
    nodeIdRef.current = nodeId;
  }, [nodeId]);

  // fitView uchun rejalashtirilgan timer'lar — unmount'da bekor qilamiz.
  const fitTimers = useRef<number[]>([]);
  useEffect(
    () => () => {
      fitTimers.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  const rebuild = useCallback(() => {
    // Grafdagi qirralardan zaxira (fallback) in/out daraja — backend soni bo'lmasa.
    const indeg: Record<string, number> = {};
    const outdeg: Record<string, number> = {};
    rawEdges.current.forEach((e) => {
      if (e.type === "REGISTERED_AT") return;
      if (e.source.startsWith("address:") || e.target.startsWith("address:")) return;
      outdeg[e.source] = (outdeg[e.source] ?? 0) + 1;
      indeg[e.target] = (indeg[e.target] ?? 0) + 1;
    });

    const rfNodes: Node<EntityNodeData>[] = [];
    rawNodes.current.forEach((n) => {
      if (n.type === "address") return; // manzil grafga qo'shilmaydi
      const id = n.id.split(":")[1];
      const parents = (n.data?.parents as number | undefined) ?? indeg[n.id] ?? 0;
      const children = (n.data?.children as number | undefined) ?? outdeg[n.id] ?? 0;
      rfNodes.push({
        id: n.id,
        type: "entity",
        position: { x: 0, y: 0 },
        data: {
          label: n.label,
          type: n.type,
          status: n.data?.status,
          url: (n.data?.url as string) ?? (n.type === "company" ? `/company/${id}` : `/person/${id}`),
          parents,
          children,
          isRoot: n.id === nodeId,
          selected: n.id === selectedRef.current,
        },
      });
    });

    const rfEdges: Edge[] = [];
    rawEdges.current.forEach((e) => {
      if (e.type === "REGISTERED_AT") return;
      if (e.source.startsWith("address:") || e.target.startsWith("address:")) return;
      if (!rawNodes.current.has(e.source) || !rawNodes.current.has(e.target)) return;
      const current = e.data?.is_current !== false;
      const color = edgeColor(e.type);
      rfEdges.push({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "default",
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
        style: {
          stroke: color,
          strokeWidth: current ? 2 : 1.6,
          strokeDasharray: current ? undefined : "6 5",
          opacity: current ? 0.95 : 0.65,
        },
      });
    });

    const positioned = layout(rfNodes, rfEdges);
    // Mavjud tugunlar pozitsiyasini saqlaymiz (drag yo'qolmasin); yangilarini dagre joylashtiradi.
    setNodes((prev) => {
      const first = prev.length === 0;
      const prevPos = new Map(prev.map((p) => [p.id, p.position]));
      const merged = positioned.map((n) =>
        prevPos.has(n.id) ? { ...n, position: prevPos.get(n.id)! } : n
      );
      if (first) fitTimers.current.push(window.setTimeout(() => rf.fitView({ duration: 500, padding: 0.18 }), 40));
      return merged;
    });
    setEdges(rfEdges);
  }, [nodeId, rf, setNodes, setEdges]);

  const mergeFragment = useCallback(
    (data: GraphResponse) => {
      for (const n of data.nodes) rawNodes.current.set(n.id, n);
      for (const e of data.edges) rawEdges.current.set(e.id, e);
      rebuild();
    },
    [rebuild]
  );

  // Boshlang'ich yuklash
  useEffect(() => {
    rawNodes.current.clear();
    rawEdges.current.clear();
    selectedRef.current = null;
    setSelected(null);
    let alive = true;
    getGraph(nodeId, 2)
      .then((data) => {
        if (!alive) return;
        if (data.meta?.truncated) setInfo("Graf juda katta — bir qismi ko'rsatildi");
        mergeFragment(data);
      })
      .catch(() => alive && setError("Grafni yuklab bo'lmadi. Backend ishlayaptimi?"));
    return () => {
      alive = false;
    };
  }, [nodeId, mergeFragment]);

  // Tugunni grafga qo'shib davom ettirish
  const expandInto = useCallback(
    async (ref: string) => {
      const forNode = nodeIdRef.current; // qaysi graf uchun so'ralganini eslab qolamiz
      try {
        const frag = await getGraph(ref, 1);
        if (nodeIdRef.current !== forNode) return; // graf almashdi — javob eskirgan
        mergeFragment(frag);
      } catch {
        /* jim */
      }
    },
    [mergeFragment]
  );

  const selectNode = useCallback((ref: string, label: string, type: string) => {
    selectedRef.current = ref;
    setSelected({ ref, label, type });
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      const d = node.data as EntityNodeData;
      selectNode(node.id, d.label, d.type);
      expandInto(node.id);
    },
    [expandInto, selectNode]
  );

  // Panel ichidagi aloqadorni grafga qo'shish
  const openRelated = useCallback(
    async (ref: string) => {
      await expandInto(ref);
      const n = rawNodes.current.get(ref);
      const type = ref.split(":")[0];
      selectNode(ref, n?.label ?? ref, type);
    },
    [expandInto, selectNode]
  );

  // Tanlov o'zgarsa kartochka holatini yangilaymiz
  useEffect(() => {
    setNodes((ns) =>
      ns.map((n) => ({ ...n, data: { ...n.data, selected: n.id === selectedRef.current } }))
    );
  }, [selected]);

  // Fullscreen
  useEffect(() => {
    const onFs = () => {
      setIsFs(document.fullscreenElement === wrapRef.current);
      fitTimers.current.push(window.setTimeout(() => rf.fitView({ duration: 300, padding: 0.18 }), 120));
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [rf]);

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen?.();
  };

  const closePanel = () => {
    selectedRef.current = null;
    setSelected(null);
  };

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.8 }), []);

  return (
    <div ref={wrapRef} className={`rf-wrap${isFs ? " fs" : ""}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        defaultViewport={defaultViewport}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.18 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#dbe2ec" />

        <Panel position="top-left" className="rf-ctrls">
          <button onClick={() => rf.zoomIn({ duration: 200 })} title="Kattalashtirish">+</button>
          <button onClick={() => rf.zoomOut({ duration: 200 })} title="Kichiklashtirish">−</button>
          <button onClick={() => rf.fitView({ duration: 400, padding: 0.18 })} title="Hammasini ko'rsatish">⤢</button>
          <button onClick={toggleFs} title={isFs ? "Chiqish" : "Butun ekran"} className="fs">
            {isFs ? "×" : "⛶"}
          </button>
        </Panel>

        <Panel position="bottom-left" className="rf-legend">
          <div className="leg-grid">
            <span className="leg-pill company">Yuridik shaxs</span>
            <span className="leg-edge"><i className="ln founder" /> ta'sis etgan</span>
            <span className="leg-pill person">Jismoniy shaxs</span>
            <span className="leg-edge"><i className="ln director" /> rahbarlik</span>
            <span className="leg-hint">Kartochkani bosing — ochiladi</span>
            <span className="leg-edge"><i className="ln former" /> o'tmishda</span>
          </div>
        </Panel>
      </ReactFlow>

      {selected && <NodeDetailPanel sel={selected} onOpen={openRelated} onClose={closePanel} />}
      {info && <div className="rf-info">{info}</div>}
      {error && <div className="rf-error">{error}</div>}
    </div>
  );
}

export default function ConnectionsGraph({ nodeId }: { nodeId: string }) {
  return (
    <ReactFlowProvider>
      <Inner nodeId={nodeId} />
    </ReactFlowProvider>
  );
}
