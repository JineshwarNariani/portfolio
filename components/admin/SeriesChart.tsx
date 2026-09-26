import { formatBucket } from "@/lib/analytics/format";

/** Minimal SVG bars: visits per bucket, with resume clicks as a gold tick. No chart library. */
export function SeriesChart({ points, hourly }: { points: { at: string; visits: number; resume: number }[]; hourly: boolean }) {
  if (points.length === 0) return <p className="admin-muted">No visits in this range yet.</p>;
  const max = Math.max(1, ...points.map((p) => p.visits));
  const w = 100 / points.length;
  const labelEvery = Math.ceil(points.length / 8);
  return (
    <figure className="admin-chart">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="Visits over time">
        {points.map((p, i) => {
          const h = (p.visits / max) * 36;
          return (
            <g key={p.at}>
              <rect x={i * w + w * 0.15} y={38 - h} width={w * 0.7} height={h} className="admin-bar">
                <title>{`${formatBucket(p.at, hourly)}: ${p.visits} visits, ${p.resume} resume clicks`}</title>
              </rect>
              {p.resume > 0 && <rect x={i * w + w * 0.15} y={38 - (p.resume / max) * 36} width={w * 0.7} height={0.5} className="admin-bar-accent" />}
            </g>
          );
        })}
      </svg>
      <figcaption>
        {points.map((p, i) => (
          <span key={p.at} style={{ width: `${w}%` }}>
            {i % labelEvery === 0 ? formatBucket(p.at, hourly) : ""}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
