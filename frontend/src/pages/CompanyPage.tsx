import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCompany } from "../api";
import type { CompanyCard } from "../types";
import ConnectionsGraph from "../components/ConnectionsGraph";

const STATUS_UZ: Record<string, string> = {
  active: "faoliyatda",
  liquidated: "tugatilgan",
  reorganizing: "qayta tashkil etilmoqda",
  bankrupt: "bankrot",
};

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<CompanyCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setCard(null);
    setError(null);
    getCompany(id)
      .then(setCard)
      .catch(() => setError("Kompaniya topilmadi"));
  }, [id]);

  if (error) return <div className="page">{error}</div>;
  if (!card || !id) return <div className="page muted">Yuklanmoqda...</div>;

  return (
    <div className="page">
      <h1>{card.name}</h1>
      <p>
        STIR: {card.stir}
        {" · "}holati:{" "}
        <b className={card.status === "liquidated" ? "red" : ""}>
          {STATUS_UZ[card.status] ?? card.status}
        </b>
        {card.regDate && <> · ro'yxatdan o'tgan: {card.regDate}</>}
      </p>
      {card.address && <p className="muted">Manzil: {card.address}</p>}

      <div className="cols">
        <section>
          <h3>Ta'sischilar</h3>
          <ul>
            {card.founders.length === 0 && <li className="muted">ma'lumot yo'q</li>}
            {card.founders.map((f, i) => (
              <li key={i}>
                <Link to={`/${f.type}/${f.id}`}>{f.label}</Link>
                {f.sharePercent != null && <> — {f.sharePercent}%</>}
                {!f.current && <span className="muted"> (sobiq)</span>}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Rahbarlar</h3>
          <ul>
            {card.directors.length === 0 && <li className="muted">ma'lumot yo'q</li>}
            {card.directors.map((d, i) => (
              <li key={i}>
                <Link to={`/person/${d.id}`}>{d.label}</Link>
                {d.position && <span className="muted"> · {d.position}</span>}
                {!d.current && <span className="muted"> (sobiq)</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h3>Aloqalar grafi</h3>
      <ConnectionsGraph nodeId={`company:${id}`} />
    </div>
  );
}
