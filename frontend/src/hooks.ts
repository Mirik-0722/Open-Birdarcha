import { useEffect, useState } from "react";
import { getAffiliations } from "./api";
import type { Controller } from "./types";

export type RiskLevel = "high" | "med" | "low";

export interface AffiliationResult {
  controllers: Controller[];
  groupSize: number;
  max: number;
  level: RiskLevel;
  loading: boolean;
  error: boolean;
}

export function riskLabel(level: RiskLevel): string {
  return level === "high" ? "Yuqori xavf" : level === "med" ? "O'rta xavf" : "Past xavf";
}

/** Tugunning affillik guruhi + nazoratchilarini bir marta yuklaydi. */
export function useAffiliation(node: string): AffiliationResult {
  const [state, setState] = useState<{
    controllers: Controller[];
    groupSize: number;
    loading: boolean;
    error: boolean;
  }>({ controllers: [], groupSize: 0, loading: true, error: false });

  useEffect(() => {
    let alive = true;
    setState({ controllers: [], groupSize: 0, loading: true, error: false });
    getAffiliations(node)
      .then((g) => {
        if (!alive) return;
        setState({
          controllers: g.meta?.controllers ?? [],
          groupSize: g.meta?.groupSize ?? g.nodes.length,
          loading: false,
          error: false,
        });
      })
      .catch(() => alive && setState({ controllers: [], groupSize: 0, loading: false, error: true }));
    return () => {
      alive = false;
    };
  }, [node]);

  const max = state.controllers.reduce((m, c) => Math.max(m, c.companies), 0);
  const level: RiskLevel = max >= 3 ? "high" : state.controllers.length > 0 ? "med" : "low";
  return { ...state, max, level };
}
