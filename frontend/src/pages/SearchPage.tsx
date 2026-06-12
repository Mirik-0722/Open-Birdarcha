import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { search } from "../api";
import type { SearchItem } from "../types";
import { Avatar, Skeleton, StatusPill } from "../ui";
import { IconSearch } from "../icons";

const EXAMPLES = ["Rustexkompani", "Texno Imkon", "Lukaxin", "Rahimov"];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQ(urlQ);
    if (!urlQ.trim()) {
      setItems(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    search(urlQ)
      .then((r) => alive && setItems(r.results))
      .catch(() => alive && setError("Qidiruv ishlamadi. Backend ishlayaptimi?"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [urlQ]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setParams({ q: q.trim() });
  }

  const inResults = items !== null || loading;

  if (!inResults) {
    return (
      <div className="page">
        <div className="hero">
          <h1>
            Kim kimni <span className="accent">boshqaradi?</span>
          </h1>
          <p className="lead">
            Firma yoki shaxsni qidiring — uning egalari, rahbarlari va yashirin
            egalik zanjirlarini bir qarashda bog'lanishlar xaritasida oching.
          </p>
          <form onSubmit={onSubmit} className="hero-search">
            <span className="lead-ico"><IconSearch size={20} /></span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Firma nomi, STIR yoki shaxs ismi"
            />
            <button type="submit">Qidirish</button>
          </form>
          <div className="example-chips">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="chip" onClick={() => setParams({ q: ex })}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <form onSubmit={onSubmit} className="search-compact">
        <span className="lead-ico"><IconSearch size={18} /></span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Firma nomi, STIR yoki shaxs ismi"
        />
        <button type="submit">Qidirish</button>
      </form>

      {error && <p className="red">{error}</p>}

      {loading && (
        <div className="results">
          {[0, 1, 2].map((i) => (
            <div key={i} className="result-card">
              <Skeleton w={48} h={48} r={12} />
              <span className="result-main">
                <Skeleton w={220} h={16} />
                <div style={{ marginTop: 8 }}>
                  <Skeleton w={120} h={12} />
                </div>
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && items && (
        <>
          <p className="muted" style={{ marginBottom: 14 }}>
            {items.length} ta natija topildi
          </p>
          <div className="results">
            {items.length === 0 && (
              <div className="result-card">
                <span className="muted">Hech narsa topilmadi</span>
              </div>
            )}
            {items.map((it) => (
              <Link key={`${it.type}:${it.id}`} to={`/${it.type}/${it.id}`} className="result-card">
                <Avatar type={it.type} name={it.label} size={48} />
                <span className="result-main">
                  <span className="title">{it.label}</span>
                  <span className="result-meta">
                    <span>{it.type === "company" ? "Kompaniya" : "Shaxs"}</span>
                    {it.stir && (
                      <>
                        <span className="sep" />
                        <span>STIR {it.stir}</span>
                      </>
                    )}
                  </span>
                </span>
                {it.status && <StatusPill status={it.status} />}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
