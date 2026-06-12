import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPerson } from "../api";
import type { LinkItem, PersonCard } from "../types";
import ConnectionsGraph from "../components/ConnectionsGraph";
import { Avatar, formatDate } from "../ui";
import { IconBuilding, IconUser, IconUsers } from "../icons";

function CompaniesTable({ rows, showShare }: { rows: LinkItem[]; showShare?: boolean }) {
  if (rows.length === 0) return <p className="empty">Ma'lumot yo'q</p>;
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Kompaniya</th>
          {showShare ? <th>Ulush</th> : <th>Lavozim</th>}
          <th>Davr</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={r.current ? "" : "former"}>
            <td>
              <span className="cell-name">
                <Avatar type="company" name={r.label} size={28} />
                <Link to={`/company/${r.id}`}>{r.label}</Link>
                {!r.current && <span className="tag-former">sobiq</span>}
              </span>
            </td>
            <td>
              {showShare ? (
                r.sharePercent != null ? (
                  <span className="share-bar">
                    <span className="track">
                      <span className="fill" style={{ width: `${r.sharePercent}%` }} />
                    </span>
                    <span className="pct">{r.sharePercent}%</span>
                  </span>
                ) : (
                  <span className="muted">—</span>
                )
              ) : (
                <span>{r.position ?? "—"}</span>
              )}
            </td>
            <td className="muted">
              {formatDate(r.dateFrom) ?? "—"}
              {r.dateTo ? ` – ${formatDate(r.dateTo)}` : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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

  if (error) return <div className="page"><p className="red">{error}</p></div>;
  if (!card || !id) return <div className="page muted">Yuklanmoqda...</div>;

  const activeFounder = card.founderOf.filter((f) => f.current).length;
  const activeDirector = card.directorOf.filter((d) => d.current).length;

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/">Qidiruv</Link> <span>/</span> Shaxs
      </div>

      <div className="entity-head">
        <Avatar type="person" name={card.fullName} size={56} />
        <div className="meta">
          <div className="entity-title-row">
            <h1>{card.fullName}</h1>
          </div>
          <div className="entity-sub">
            <span><IconUsers size={15} /> Ta'sischi: <b>{card.founderOf.length}</b> firmada</span>
            <span><IconUser size={15} /> Rahbar: <b>{card.directorOf.length}</b> firmada</span>
          </div>
        </div>
      </div>

      <div className="entity-grid">
        <div>
          <div className="card">
            <div className="card-head">
              <h3><IconUsers size={17} /> Ta'sischi bo'lgan firmalar</h3>
              <span className="count-badge">{card.founderOf.length}</span>
            </div>
            <CompaniesTable rows={card.founderOf} showShare />
          </div>

          <div className="card">
            <div className="card-head">
              <h3><IconBuilding size={17} /> Rahbar bo'lgan firmalar</h3>
              <span className="count-badge">{card.directorOf.length}</span>
            </div>
            <CompaniesTable rows={card.directorOf} />
          </div>
        </div>

        <aside>
          <div className="card">
            <h3>Asosiy ma'lumotlar</h3>
            <div className="facts">
              <div className="fact">
                <span className="fact-ico"><IconUsers size={17} /></span>
                <span className="fact-body"><span className="k">Hozir ta'sischi</span><span className="v">{activeFounder} firmada</span></span>
              </div>
              <div className="fact">
                <span className="fact-ico"><IconUser size={17} /></span>
                <span className="fact-body"><span className="k">Hozir rahbar</span><span className="v">{activeDirector} firmada</span></span>
              </div>
              <div className="fact">
                <span className="fact-ico"><IconBuilding size={17} /></span>
                <span className="fact-body"><span className="k">Jami aloqalar</span><span className="v">{card.founderOf.length + card.directorOf.length}</span></span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="card">
        <h3>Bog'lanishlar xaritasi</h3>
        <ConnectionsGraph nodeId={`person:${id}`} />
      </div>
    </div>
  );
}
