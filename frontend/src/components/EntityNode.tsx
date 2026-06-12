import { memo } from "react";
import { Handle, Position } from "reactflow";
import { useNavigate } from "react-router-dom";

export interface EntityNodeData {
  label: string;
  type: string; // company | person
  status?: string;
  url: string;
  parents: number; // egasi — uni ta'sis etgan/boshqaradiganlar (ta'sischi/rahbar)
  children: number; // u ta'sischi/rahbar bo'lgan firmalar
  isRoot: boolean;
  selected?: boolean;
}

/** rusprofile uslubidagi kartochka-tugun. */
function EntityNode({ data }: { data: EntityNodeData }) {
  const navigate = useNavigate();
  const liq = data.status === "liquidated";
  const reorg = data.status === "reorganizing" || data.status === "bankrupt";

  return (
    <div
      className={[
        "rfc",
        data.type,
        data.isRoot ? "root" : "",
        liq ? "liq" : "",
        data.selected ? "sel" : "",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Left} className="rfh" isConnectable={false} />
      <Handle type="source" position={Position.Right} className="rfh" isConnectable={false} />

      <div className="rfc-row">
        <span className="rfc-name">{data.label}</span>
        {(liq || reorg) && <span className="rfc-warn" title="E'tibor">!</span>}
      </div>

      {liq && <div className="rfc-liq">TASHKILOT TUGATILGAN</div>}
      {reorg && <div className="rfc-reorg">{data.status === "bankrupt" ? "BANKROT" : "QAYTA TASHKIL ETILMOQDA"}</div>}

      {(data.parents > 0 || data.children > 0) && (
        <div className="rfc-meta">
          {data.parents > 0 && (
            <span className="rfc-chip ota" title="Egasi — uni ta'sis etgan yoki boshqaradigan shaxs/firmalar">
              ↑ {data.parents} egasi
            </span>
          )}
          {data.children > 0 && (
            <span className="rfc-chip bola" title="U ta'sis etgan yoki boshqaradigan firmalar">
              ↓ {data.children} firma
            </span>
          )}
        </div>
      )}

      {!data.isRoot && (
        <button
          className="rfc-link nodrag"
          onClick={(e) => {
            e.stopPropagation();
            navigate(data.url);
          }}
        >
          {data.type === "company" ? "Kompaniya sahifasi" : "Shaxs sahifasi"} →
        </button>
      )}
    </div>
  );
}

export default memo(EntityNode);
