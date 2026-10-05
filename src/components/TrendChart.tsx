import type { TrendPoint } from '../lib/dashboardApi';

/** Petit graphique en ligne, en SVG pur (pas de dépendance externe). */
export default function TrendChart({ data }: { data: TrendPoint[] }) {
  const width = 600;
  const height = 200;
  const padding = 28;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padding + i * step,
    y: height - padding - (d.value / max) * (height - padding * 2),
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const lastX = points[points.length - 1]?.x ?? padding;
  const areaD = `${pathD} L${lastX},${height - padding} L${padding},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full">
      <path d={areaD} fill="rgba(249,115,22,0.12)" stroke="none" />
      <path d={pathD} fill="none" stroke="#f97316" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#f97316" />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={height - 6} textAnchor="middle" fontSize={11} fill="#a3a3a3">
          {p.label}
        </text>
      ))}
    </svg>
  );
}
