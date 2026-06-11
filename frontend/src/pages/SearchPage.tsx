import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { search } from "../api";
import type { SearchItem } from "../types";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setItems((await search(q)).results);
    } catch {
      setError("Qidiruv ishlamadi. Backend ishlayaptimi?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Aloqalar grafi</h1>
      <p className="muted">
        Kompaniya nomi, STIR yoki shaxs ismi bo'yicha qidiring
      </p>
      <form onSubmit={onSubmit} className="search-form">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Masalan: Rustexkompani"
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : "Qidirish"}
        </button>
      </form>
      {error && <p className="red">{error}</p>}
      {items && (
        <ul className="results">
          {items.length === 0 && <li className="muted">Hech narsa topilmadi</li>}
          {items.map((it) => (
            <li key={`${it.type}:${it.id}`}>
              <Link to={`/${it.type}/${it.id}`}>{it.label}</Link>
              {it.stir && <span className="muted"> · STIR {it.stir}</span>}
              {it.status === "liquidated" && (
                <span className="badge-red">tugatilgan</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
