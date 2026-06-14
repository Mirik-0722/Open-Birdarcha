import type {
  CompanyCard,
  GraphResponse,
  PathResponse,
  PersonCard,
  SearchResponse,
} from "./types";
import { clearAuth, getToken } from "./auth";

async function getJSON<T>(url: string): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    // Token yaroqsiz/muddati o'tgan — tozalab login sahifasiga qaytaramiz.
    clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
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

export const getPath = (from: string, to: string) =>
  getJSON<PathResponse>(
    `/api/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );

export const getAffiliations = (node: string) =>
  getJSON<GraphResponse>(
    `/api/affiliations?node=${encodeURIComponent(node)}`
  );
