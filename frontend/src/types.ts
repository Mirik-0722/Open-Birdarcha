// Backend JSON formatlariga mos tiplar.
// Graf node/edge "data" maydonlari snake_case (texnik yo'riqnomadagi formatga mos),
// kartochka maydonlari camelCase (Java record nomlaridan keladi).

export interface GNode {
  id: string; // "company:UUID" | "person:UUID" | "address:UUID"
  type: string;
  label: string;
  data?: Record<string, any>;
}

export interface GEdge {
  id: string;
  source: string;
  target: string;
  type: string; // FOUNDER | DIRECTOR | REGISTERED_AT
  data?: Record<string, any>;
}

export interface GraphResponse {
  root: string;
  nodes: GNode[];
  edges: GEdge[];
  meta?: {
    depth: number;
    truncated?: boolean;
    collapsed?: Record<string, number>;
  };
}

export interface SearchItem {
  id: string;
  type: string; // company | person
  label: string;
  stir?: string | null;
  status?: string | null;
}

export interface SearchResponse {
  results: SearchItem[];
}

export interface LinkItem {
  id: string;
  type: string;
  label: string;
  sharePercent?: number | null;
  position?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  current: boolean;
}

export interface CompanyCard {
  id: string;
  stir: string;
  name: string;
  status: string;
  statusDate?: string | null;
  regDate?: string | null;
  capital?: number | null;
  address?: string | null;
  founders: LinkItem[];
  directors: LinkItem[];
}

export interface PersonCard {
  id: string;
  fullName: string;
  founderOf: LinkItem[];
  directorOf: LinkItem[];
}
