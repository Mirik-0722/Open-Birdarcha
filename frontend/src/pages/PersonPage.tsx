import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPerson } from "../api";
import type { PersonCard } from "../types";
import ConnectionsGraph from "../components/ConnectionsGraph";

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<PersonCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setCard(null);
    setError(null);
    getPerson(id)
      .then(setCard)
      .catch(() => setError("Shaxs topilmadi"));
  }, [id]);

  if (error) return <div className="page">{error}</div>;
  if (!card || !id) return <div className="page muted">Yuklanmoqda...</div>;

  return (
    <div className="page">
      <h1>{card.fullName}</h1>

      <div className="cols">
        <section>
          <h3>Ta'sischi bo'lgan firmalar</h3>
          <ul>
            {card.founderOf.length === 0 && <li className="muted">ma'lumot yo'q</li>}
            {card.founderOf.map((f, i) => (
              <li key={i}>
                <Link to={`/company/${f.id}`}>{f.label}</Link>
                {f.sharePercent != null && <> — {f.sharePercent}%</>}
                {!f.current && <span className="muted"> (sobiq)</span>}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Rahbar bo'lgan firmalar</h3>
          <ul>
            {card.directorOf.length === 0 && <li className="muted">ma'lumot yo'q</li>}
            {card.directorOf.map((d, i) => (
              <li key={i}>
                <Link to={`/company/${d.id}`}>{d.label}</Link>
                {d.position && <span className="muted"> · {d.position}</span>}
                {!d.current && <span className="muted"> (sobiq)</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h3>Aloqalar grafi</h3>
      <ConnectionsGraph nodeId={`person:${id}`} />
    </div>
  );
}
