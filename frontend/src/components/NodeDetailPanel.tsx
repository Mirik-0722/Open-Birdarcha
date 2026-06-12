import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCompany, getPerson } from "../api";
import type { CompanyCard, LinkItem, PersonCard } from "../types";
import { Avatar, Skeleton, StatusPill } from "../ui";

export interface Selected {
  ref: string; // "company:UUID" | "person:UUID" | "address:UUID"
  label: string;
  type: string;
}

function RelRow({
  item,
  refType,
  onOpen,
}: {
  item: LinkItem;
  refType: string; // bu element qaysi tur tugun: company | person
  onOpen: (ref: string) => void;
}) {
  const ref = `${refType}:${item.id}`;
  return (
    <button type="button" className="gp-rel" onClick={() => onOpen(ref)} title="Grafda ochish">
      <Avatar type={refType} name={item.label} size={26} />
      <span className="gp-rel-name">{item.label}</span>
      {item.sharePercent != null && <span className="gp-rel-share">{item.sharePercent}%</span>}
      {item.position && <span className="muted gp-rel-pos">{item.position}</span>}
      {!item.current && <span className="tag-former">sobiq</span>}
    </button>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="gp-section">
      <div className="gp-section-head">
        {title} <span className="count-badge">{count}</span>
      </div>
      {count === 0 ? <p className="empty" style={{ padding: "4px 0" }}>Ma'lumot yo'q</p> : children}
    </div>
  );
}

/**
 * Grafda tanlangan tugun haqida ma'lumot + aloqador firma/ta'sischilar.
 * Aloqadagi birortasini bosish onOpen orqali uni xuddi shu grafga qo'shadi.
 */
export default function NodeDetailPanel({
  sel,
  onOpen,
  onClose,
}: {
  sel: Selected;
  onOpen: (ref: string) => void;
  onClose: () => void;
}) {
  const id = sel.ref.split(":")[1];
  const [company, setCompany] = useState<CompanyCard | null>(null);
  const [person, setPerson] = useState<PersonCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setCompany(null);
    setPerson(null);
    const p =
      sel.type === "company"
        ? getCompany(id).then((d) => alive && setCompany(d))
        : sel.type === "person"
        ? getPerson(id).then((d) => alive && setPerson(d))
        : Promise.resolve();
    p.catch(() => {}).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [sel.ref, sel.type, id]);

  return (
    <div className="graph-panel">
      <div className="gp-head">
        <Avatar type={sel.type} name={sel.label} size={40} />
        <div className="gp-head-meta">
          <div className="gp-name">{sel.label}</div>
          <div className="gp-type">
            {sel.type === "company" ? "Kompaniya" : sel.type === "person" ? "Shaxs" : "Manzil"}
            {company && <StatusPill status={company.status} />}
          </div>
        </div>
        <button className="gp-close" onClick={onClose} title="Yopish">×</button>
      </div>

      {(sel.type === "company" || sel.type === "person") && (
        <Link className="gp-open" to={`/${sel.type}/${id}`}>
          To'liq sahifani ochish ↗
        </Link>
      )}

      <div className="gp-body">
        {loading && (
          <div className="skeleton-rows" style={{ marginTop: 10 }}>
            <Skeleton h={34} /><Skeleton h={34} /><Skeleton h={34} />
          </div>
        )}

        {!loading && company && (
          <>
            {company.stir && <div className="gp-fact"><span className="muted">STIR</span><b>{company.stir}</b></div>}
            {company.address && <div className="gp-fact"><span className="muted">Manzil</span><span className="gp-addr">{company.address}</span></div>}
            <Section title="Ta'sischilar" count={company.founders.length}>
              {company.founders.map((f, i) => (
                <RelRow key={i} item={f} refType={f.type} onOpen={onOpen} />
              ))}
            </Section>
            <Section title="Rahbarlar" count={company.directors.length}>
              {company.directors.map((d, i) => (
                <RelRow key={i} item={d} refType="person" onOpen={onOpen} />
              ))}
            </Section>
          </>
        )}

        {!loading && person && (
          <>
            <Section title="Ta'sischi bo'lgan firmalar" count={person.founderOf.length}>
              {person.founderOf.map((f, i) => (
                <RelRow key={i} item={f} refType="company" onOpen={onOpen} />
              ))}
            </Section>
            <Section title="Rahbar bo'lgan firmalar" count={person.directorOf.length}>
              {person.directorOf.map((d, i) => (
                <RelRow key={i} item={d} refType="company" onOpen={onOpen} />
              ))}
            </Section>
          </>
        )}

        {!loading && sel.type === "address" && (
          <p className="muted" style={{ marginTop: 10 }}>
            Shu manzildagi firmalar grafga qo'shildi. Ularning birini bosib davom eting.
          </p>
        )}
      </div>
    </div>
  );
}
