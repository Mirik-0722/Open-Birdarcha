import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCompany } from "../api";
import type { CompanyCard, LinkItem } from "../types";
import ConnectionsGraph from "../components/ConnectionsGraph";
import { Avatar, StatusPill, formatCapital, formatDate } from "../ui";
import {
  IconCalendar,
  IconId,
  IconPin,
  IconShield,
  IconUser,
  IconUsers,
  IconWallet,
} from "../icons";

function PeopleTable({ rows, showShare }: { rows: LinkItem[]; showShare?: boolean }) {
  if (rows.length === 0) return <p className="empty">Ma'lumot yo'q</p>;
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Nomi</th>
          {showShare ? <th>Ulush</th> : <th>Lavozim</th>}
          <th>Davr</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={r.current ? "" : "former"}>
            <td>
              <span className="cell-name">
                <Avatar type={r.type} name={r.label} size={28} />
                <Link to={`/${r.type}/${r.id}`}>{r.label}</Link>
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

  if (error) return <div className="page"><p className="red">{error}</p></div>;
  if (!card || !id) return <div className="page muted">Yuklanmoqda...</div>;

  const currentDirector = card.directors.find((d) => d.current);

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/">Qidiruv</Link> <span>/</span> Kompaniya
      </div>

      <div className="entity-head">
        <Avatar type="company" name={card.name} size={56} />
        <div className="meta">
          <div className="entity-title-row">
            <h1>{card.name}</h1>
            <StatusPill status={card.status} />
          </div>
          <div className="entity-sub">
            <span><IconId size={15} /> STIR: <b>{card.stir}</b></span>
            {card.regDate && <span><IconCalendar size={15} /> Ro'yxatdan: <b>{formatDate(card.regDate)}</b></span>}
            {card.statusDate && card.status === "liquidated" && (
              <span>Tugatilgan: <b>{formatDate(card.statusDate)}</b></span>
            )}
          </div>
        </div>
      </div>

      <div className="entity-grid">
        <div>
          <div className="card">
            <div className="card-head">
              <h3><IconUsers size={17} /> Ta'sischilar</h3>
              <span className="count-badge">{card.founders.length}</span>
            </div>
            <PeopleTable rows={card.founders} showShare />
          </div>

          <div className="card">
            <div className="card-head">
              <h3><IconUser size={17} /> Rahbarlar</h3>
              <span className="count-badge">{card.directors.length}</span>
            </div>
            <PeopleTable rows={card.directors} />
          </div>
        </div>

        <aside>
          <div className="card">
            <h3>Asosiy ma'lumotlar</h3>
            <div className="facts">
              <div className="fact">
                <span className="fact-ico"><IconShield size={17} /></span>
                <span className="fact-body"><span className="k">Holati</span><span className="v"><StatusPill status={card.status} /></span></span>
              </div>
              <div className="fact">
                <span className="fact-ico"><IconId size={17} /></span>
                <span className="fact-body"><span className="k">STIR</span><span className="v">{card.stir}</span></span>
              </div>
              {card.regDate && (
                <div className="fact">
                  <span className="fact-ico"><IconCalendar size={17} /></span>
                  <span className="fact-body"><span className="k">Ro'yxat sanasi</span><span className="v">{formatDate(card.regDate)}</span></span>
                </div>
              )}
              {formatCapital(card.capital) && (
                <div className="fact">
                  <span className="fact-ico"><IconWallet size={17} /></span>
                  <span className="fact-body"><span className="k">Ustav kapitali</span><span className="v">{formatCapital(card.capital)}</span></span>
                </div>
              )}
              <div className="fact">
                <span className="fact-ico"><IconUsers size={17} /></span>
                <span className="fact-body"><span className="k">Ta'sischilar</span><span className="v">{card.founders.length} ta</span></span>
              </div>
              {currentDirector && (
                <div className="fact">
                  <span className="fact-ico"><IconUser size={17} /></span>
                  <span className="fact-body"><span className="k">Rahbar</span><span className="v"><Link to={`/person/${currentDirector.id}`}>{currentDirector.label}</Link></span></span>
                </div>
              )}
            </div>
          </div>

          {card.address && (
            <div className="card">
              <div className="card-head"><h3><IconPin size={17} /> Manzil</h3></div>
              <p className="muted" style={{ margin: 0 }}>{card.address}</p>
            </div>
          )}
        </aside>
      </div>

      <div className="card">
        <h3>Bog'lanishlar xaritasi</h3>
        <ConnectionsGraph nodeId={`company:${id}`} />
      </div>
    </div>
  );
}
