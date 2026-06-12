import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getPath } from "../api";
import type { PathResponse, SearchItem } from "../types";
import EntityPicker from "../components/EntityPicker";
import PathGraph from "../components/PathGraph";
import { Avatar } from "../ui";
import { IconRoute } from "../icons";

function refOf(it: SearchItem): string {
  return `${it.type}:${it.id}`;
}

export default function PathPage() {
  const [from, setFrom] = useState<SearchItem | null>(null);
  const [to, setTo] = useState<SearchItem | null>(null);
  const [res, setRes] = useState<PathResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  async function find() {
    if (!from || !to) return;
    const id = ++reqId.current; // faqat eng so'nggi so'rov natijasi qabul qilinadi
    setLoading(true);
    setError(null);
    setRes(null);
    try {
      const r = await getPath(refOf(from), refOf(to));
      if (id !== reqId.current) return; // eskirgan javob — e'tiborsiz qoldiramiz
      setRes(r);
    } catch {
      if (id !== reqId.current) return;
      setError("Tahlilni bajarib bo'lmadi. Backend ishlayaptimi?");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/">Qidiruv</Link> <span>/</span> Bog'lanish zanjiri
      </div>

      <div className="entity-head" style={{ alignItems: "center" }}>
        <Avatar type="address" name="route" size={56} />
        <div className="meta">
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconRoute size={22} /> Bog'lanish zanjiri
          </h1>
          <div className="entity-sub">
            <span>Ikki obyekt o'rtasidagi yashirin nazorat zanjirini toping — kim kim orqali bog'langan.</span>
          </div>
        </div>
      </div>

      <div className="card path-card">
        <div className="path-pickers">
          <EntityPicker label="Kimdan" selected={from} onPick={setFrom} />
          <EntityPicker label="Kimgacha" selected={to} onPick={setTo} />
          <button type="button" className="primary" disabled={!from || !to || loading} onClick={find}>
            {loading ? "Qidirilmoqda..." : "Zanjirni topish"}
          </button>
        </div>

        {error && <p className="red" style={{ marginTop: 16 }}>{error}</p>}

        {res && !res.found && (
          <p className="empty" style={{ marginTop: 16 }}>
            Bu ikki obyekt o'rtasida nazorat aloqalari bo'yicha zanjir topilmadi.
          </p>
        )}
      </div>

      {res && res.found && (
        <div className="card">
          <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
            {res.length === 0 ? "Bir xil obyekt." : `${res.length} qadamlik zanjir topildi`}
          </p>
          <PathGraph nodes={res.nodes} edges={res.edges} rootId={res.from} />
        </div>
      )}
    </div>
  );
}
