import { Link } from "react-router-dom";
import type { AffiliationResult } from "../hooks";
import { riskLabel } from "../hooks";
import { Skeleton } from "../ui";

/**
 * Affillik guruhidagi asosiy nazoratchilar — kim 2+ firmani boshqaradi.
 * Ma'lumotni useAffiliation hook'idan prop sifatida oladi (bir marta yuklanadi).
 */
export default function AffiliationPanel({ affil }: { affil: AffiliationResult }) {
  const { controllers, groupSize, max, level, loading, error } = affil;

  if (error) return <p className="red">Affillik tahlilini yuklab bo'lmadi</p>;
  if (loading)
    return (
      <div className="skeleton-rows">
        <Skeleton h={64} r={10} />
        <Skeleton h={40} />
        <Skeleton h={40} />
      </div>
    );

  const summary =
    level === "high"
      ? "Bir shaxs/firma uchta yoki undan ko'p firmani boshqaradi."
      : level === "med"
      ? "Guruhda umumiy nazoratchilar bor."
      : "Umumiy nazoratchi aniqlanmadi.";

  return (
    <div className="affil">
      <div className={`risk-summary ${level}`}>
        <span className="gauge">{max || "—"}</span>
        <span>
          <b>{riskLabel(level)}.</b> {summary}
          <br />
          Bu obyekt {groupSize} ta tugundan iborat nazorat guruhiga kiradi.
        </span>
      </div>

      {controllers.length === 0 ? (
        <p className="empty">Bir nechta firmani boshqaradigan umumiy nazoratchi topilmadi.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nazoratchi</th>
              <th>Turi</th>
              <th>Firmalar</th>
            </tr>
          </thead>
          <tbody>
            {controllers.map((c) => {
              const id = c.ref.split(":")[1];
              const flag = c.companies >= 3;
              return (
                <tr key={c.ref}>
                  <td>
                    <Link to={`/${c.type}/${id}`}>{c.label}</Link>
                  </td>
                  <td className="muted">{c.type === "person" ? "shaxs" : "firma"}</td>
                  <td>
                    <span className={`ctrl-count ${flag ? "flag" : ""}`}>{c.companies}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
