export type Datum = { label: string; value: number };

export function BarChart({
  data,
  format = (v: number) => String(v),
  height = 160,
}: {
  data: Datum[];
  format?: (v: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height: height + 40 }}>
      {data.map((d) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-semibold text-ink/60">{d.value > 0 ? format(d.value) : ""}</span>
          <div
            className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-accent-deep to-accent"
            style={{ height: Math.max(3, (d.value / max) * height), opacity: d.value > 0 ? 1 : 0.25 }}
            title={`${d.label}: ${format(d.value)}`}
          />
          <span className="w-full truncate text-center text-[10px] text-ink/50">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HBars({
  data,
  format = (v: number) => String(v),
}: {
  data: Datum[];
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium">{d.label}</span>
            <span className="text-ink/60">{format(d.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LineChart({
  data,
  unit = "",
}: {
  data: Datum[];
  unit?: string;
}) {
  if (data.length === 0) return null;
  const W = 600;
  const H = 180;
  const pad = 28;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = data.length === 1 ? W / 2 : pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.value - min) / span) * (H - pad * 2);
    return { x, y, ...d };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Progress chart">
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="5" fill="var(--ink)" />
          <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">
            {p.value}
            {unit}
          </text>
          <text x={p.x} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--ink)" opacity="0.5">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
