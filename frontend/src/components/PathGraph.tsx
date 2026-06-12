import { useEffect, useRef, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import EntityNode, { type EntityNodeData } from "./EntityNode";
import type { GEdge, GNode } from "../types";

const FOUNDER_COLOR = "#2f6fed";
const DIRECTOR_COLOR = "#f4623a";
const nodeTypes = { entity: EntityNode };
const NODE_W = 212;
const NODE_H = 70;

function edgeColor(type: string): string {
  return type === "FOUNDER" ? FOUNDER_COLOR : type === "DIRECTOR" ? DIRECTOR_COLOR : "#94a3b8";
}

function edgeLabel(e: GEdge): string {
  const old = e.data?.is_current === false;
  let base = e.type === "FOUNDER" ? "ta'sischi" : e.type === "DIRECTOR" ? "rahbar" : "";
  if (e.type === "FOUNDER" && e.data?.share_percent != null) base += ` ${e.data.share_percent}%`;
  return old && base ? `${base} (sobiq)` : base;
}

function layout(nodes: Node<EntityNodeData>[], edges: Edge[]): Node<EntityNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranksep: 130, nodesep: 24, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 } };
  });
}

function Inner({ gNodes, gEdges, rootId }: { gNodes: GNode[]; gEdges: GEdge[]; rootId: string }) {
  const rf = useReactFlow();
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<EntityNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const rfNodes: Node<EntityNodeData>[] = gNodes
      .filter((n) => n.type !== "address")
      .map((n) => {
        const id = n.id.split(":")[1];
        return {
          id: n.id,
          type: "entity",
          position: { x: 0, y: 0 },
          data: {
            label: n.label,
            type: n.type,
            status: n.data?.status as string | undefined,
            url: (n.data?.url as string) ?? (n.type === "company" ? `/company/${id}` : `/person/${id}`),
            parents: (n.data?.parents as number) ?? 0,
            children: (n.data?.children as number) ?? 0,
            isRoot: n.id === rootId,
          },
        };
      });
    const rfEdges: Edge[] = gEdges
      .filter((e) => e.type !== "REGISTERED_AT")
      .map((e) => {
        const current = e.data?.is_current !== false;
        const color = edgeColor(e.type);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "default",
          label: edgeLabel(e),
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 6,
          labelStyle: { fill: color, fontSize: 11, fontWeight: 600 },
          labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
          style: {
            stroke: color,
            strokeWidth: current ? 2.4 : 1.8,
            strokeDasharray: current ? undefined : "6 5",
            opacity: current ? 0.95 : 0.7,
          },
        };
      });
    const positioned = layout(rfNodes, rfEdges);
    setNodes(positioned);
    setEdges(rfEdges);
    window.setTimeout(() => rf.fitView({ padding: 0.2, duration: 400 }), 40);
  }, [gNodes, gEdges, rootId, rf, setNodes, setEdges]);

  useEffect(() => {
    const onFs = () => {
      setIsFs(document.fullscreenElement === wrapRef.current);
      window.setTimeout(() => rf.fitView({ padding: 0.2, duration: 300 }), 120);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [rf]);

  const onNodeClick: NodeMouseHandler = (_e, node) => {
    const d = node.data as EntityNodeData;
    navigate(d.url);
  };

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen?.();
  };

  return (
    <div ref={wrapRef} className={`rf-wrap${isFs ? " fs" : ""}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#dbe2ec" />
        <Panel position="top-left" className="rf-ctrls">
          <button onClick={() => rf.zoomIn({ duration: 200 })} title="Kattalashtirish">+</button>
          <button onClick={() => rf.zoomOut({ duration: 200 })} title="Kichiklashtirish">−</button>
          <button onClick={() => rf.fitView({ duration: 400, padding: 0.2 })} title="Hammasini ko'rsatish">⤢</button>
          <button onClick={toggleFs} title={isFs ? "Chiqish" : "Butun ekran"} className="fs">{isFs ? "×" : "⛶"}</button>
        </Panel>
        <Panel position="bottom-left" className="rf-legend">
          <div className="leg-grid">
            <span className="leg-pill company">Yuridik shaxs</span>
            <span className="leg-edge"><i className="ln founder" /> ta'sis etgan</span>
            <span className="leg-pill person">Jismoniy shaxs</span>
            <span className="leg-edge"><i className="ln director" /> rahbarlik</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

/** Bog'lanish zanjirini graf (kartochka) ko'rinishida chizadi. */
export default function PathGraph({
  nodes,
  edges,
  rootId,
}: {
  nodes: GNode[];
  edges: GEdge[];
  rootId: string;
}) {
  return (
    <ReactFlowProvider>
      <Inner gNodes={nodes} gEdges={edges} rootId={rootId} />
    </ReactFlowProvider>
  );
}
