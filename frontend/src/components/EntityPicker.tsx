import { useState } from "react";
import { search } from "../api";
import type { SearchItem } from "../types";
import { Avatar } from "../ui";

/**
 * Qidiruv orqali bitta obyektni (firma/shaxs) tanlash.
 */
export default function EntityPicker({
  label,
  selected,
  onPick,
}: {
  label: string;
  selected: SearchItem | null;
  onPick: (item: SearchItem | null) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(false);
    try {
      setItems((await search(q)).results);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (selected) {
    return (
      <div className="picker filled">
        <span className="picker-label">{label}</span>
        <div className="picker-row">
          <b>
            <Avatar type={selected.type} name={selected.label} size={28} />
            {selected.label}
            <span className="muted">{selected.type === "company" ? " · firma" : " · shaxs"}</span>
          </b>
          <button type="button" className="link-btn" onClick={() => onPick(null)}>
            o'zgartirish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="picker">
      <span className="picker-label">{label}</span>
      <form onSubmit={run} className="picker-form">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="firma yoki shaxs nomi"
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : "qidir"}
        </button>
      </form>
      {items && (
        <ul className="picker-results">
          {items.length === 0 && (
            <li className="muted" style={{ padding: "6px 10px" }}>
              {error ? "Qidiruv xatosi — backend ishlayaptimi?" : "topilmadi"}
            </li>
          )}
          {items.map((it) => (
            <li key={`${it.type}:${it.id}`}>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  onPick(it);
                  setItems(null);
                  setQ("");
                }}
              >
                <Avatar type={it.type} name={it.label} size={26} />
                {it.label}
                <span className="muted"> · {it.type === "company" ? "firma" : "shaxs"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
