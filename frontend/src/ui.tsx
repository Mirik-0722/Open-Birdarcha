// Umumiy UI komponentlari va yordamchilar.
import { IconBuilding, IconShield, IconUser } from "./icons";
import type { RiskLevel } from "./hooks";
import { riskLabel } from "./hooks";

export const STATUS_UZ: Record<string, string> = {
  active: "Faoliyatda",
  liquidated: "Tugatilgan",
  reorganizing: "Qayta tashkil etilmoqda",
  bankrupt: "Bankrot",
};

export function StatusPill({ status }: { status: string }) {
  const label = STATUS_UZ[status] ?? status;
  return (
    <span className={`pill ${status}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

/** Firma/shaxs uchun rangli monogram avatar. */
export function Avatar({
  type,
  name,
  size = 48,
}: {
  type: string;
  name: string;
  size?: number;
}) {
  return (
    <span
      className={`avatar ${type}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
      aria-label={name}
    >
      {type === "person" ? <IconUser size={size * 0.5} /> : <IconBuilding size={size * 0.5} />}
    </span>
  );
}

/** "10-soniya qoidasi" — sarlavhada ko'rinadigan risk chipi. */
export function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  return (
    <span className={`risk-badge ${level}`} title="Affillik xavfi">
      <IconShield size={14} />
      {riskLabel(level)}
      {score > 0 && <b>{score}</b>}
    </span>
  );
}

export function Skeleton({ w, h = 16, r = 6 }: { w?: number | string; h?: number; r?: number }) {
  return (
    <span
      className="skeleton"
      style={{ width: w ?? "100%", height: h, borderRadius: r, display: "inline-block" }}
    />
  );
}

export function formatCapital(v?: number | null): string | null {
  if (v == null) return null;
  return new Intl.NumberFormat("ru-RU").format(v) + " so'm";
}

export function formatDate(d?: string | null): string | null {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}.${m}.${y}`;
}
