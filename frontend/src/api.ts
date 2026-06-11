import type {
  CompanyCard,
  GraphResponse,
  PersonCard,
  SearchResponse,
} from "./types";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const search = (q: string) =>
  getJSON<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`);

export const getCompany = (id: string) =>
  getJSON<CompanyCard>(`/api/company/${id}`);

export const getPerson = (id: string) =>
  getJSON<PersonCard>(`/api/person/${id}`);

export const getGraph = (node: string, depth = 2) =>
  getJSON<GraphResponse>(
    `/api/graph?node=${encodeURIComponent(node)}&depth=${depth}`
  );

export const expandNode = (node: string) =>
  getJSON<GraphResponse>(`/api/graph/expand?node=${encodeURIComponent(node)}`);
