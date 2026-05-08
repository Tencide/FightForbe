/**
 * Lightweight inline-SVG charts — no runtime deps.
 * Designed for the FightForge dark theme.
 */

function buildPath(points, w, h, padX, padY) {
  if (points.length === 0) return '';
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const mapped = points.map((p) => ({
    x: padX + ((p.x - minX) / rangeX) * innerW,
    y: padY + innerH - ((p.y - minY) / rangeY) * innerH,
    raw: p,
  }));
  const line = mapped
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L ${mapped[mapped.length - 1].x.toFixed(1)} ${(h - padY).toFixed(
    1
  )} L ${mapped[0].x.toFixed(1)} ${(h - padY).toFixed(1)} Z`;
  return { line, area, mapped };
}

/**
 * <Sparkline values={[1,2,3]} />
 * Compact trend display.
 */
export function Sparkline({ values = [], width = 120, height = 32, color = '#f4b942' }) {
  if (!values.length) {
    return (
      <svg width={width} height={height} aria-hidden="true">
        <line
          x1="2"
          x2={width - 2}
          y1={height / 2}
          y2={height / 2}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />
      </svg>
    );
  }
  const pts = values.map((v, i) => ({ x: i, y: Number(v) || 0 }));
  const built = buildPath(pts, width, height, 2, 4);
  const id = `spark-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={built.area} fill={`url(#${id})`} />
      <path d={built.line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * <LineChart series={[{label, color, data: [{x,y}, ...]}]} />
 * Multi-series line chart with subtle grid.
 */
export function LineChart({ series = [], width = 640, height = 260, yLabel, xLabels }) {
  const allPts = series.flatMap((s) => s.data || []);
  if (!allPts.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.85rem',
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-lg)',
        }}
      >
        No data to plot yet
      </div>
    );
  }

  const padX = 36;
  const padY = 22;
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const mapPoint = (p) => ({
    x: padX + ((p.x - minX) / rangeX) * innerW,
    y: padY + innerH - ((p.y - minY) / rangeY) * innerH,
  });

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minY + (rangeY * i) / yTicks);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          width: '100%',
          height,
          display: 'block',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
        }}
      >
        {yTickValues.map((v, i) => {
          const y = padY + innerH - ((v - minY) / rangeY) * innerH;
          return (
            <g key={`g-${i}`}>
              <line
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
              <text
                x={padX - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-dim)"
              >
                {Math.round(v * 10) / 10}
              </text>
            </g>
          );
        })}

        {xLabels && xLabels.length
          ? xLabels.map((label, i) => {
              const t = i / Math.max(xLabels.length - 1, 1);
              const x = padX + innerW * t;
              return (
                <text
                  key={`xl-${i}`}
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-dim)"
                >
                  {label}
                </text>
              );
            })
          : null}

        {series.map((s, sidx) => {
          if (!s.data || !s.data.length) return null;
          const mapped = s.data.map(mapPoint);
          const line = mapped
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(' ');
          const color = s.color || ['#f4b942', '#38bdf8', '#a78bfa', '#4ade80'][sidx % 4];
          const gid = `lc-${sidx}-${color.replace('#', '')}`;
          const area = `${line} L ${mapped[mapped.length - 1].x.toFixed(1)} ${
            padY + innerH
          } L ${mapped[0].x.toFixed(1)} ${padY + innerH} Z`;
          return (
            <g key={s.label || sidx}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${gid})`} />
              <path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {mapped.map((p, i) => (
                <circle
                  key={`c-${sidx}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill="var(--bg-0)"
                  stroke={color}
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}

        {yLabel ? (
          <text
            x={padX - 28}
            y={padY - 6}
            fontSize="10"
            fill="var(--text-dim)"
            transform={`rotate(0 ${padX - 28} ${padY - 6})`}
          >
            {yLabel}
          </text>
        ) : null}
      </svg>

      {series.length > 1 ? (
        <div
          style={{
            display: 'flex',
            gap: 'var(--s-4)',
            flexWrap: 'wrap',
            marginTop: 'var(--s-3)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          {series.map((s, i) => (
            <span key={s.label || i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: s.color || ['#f4b942', '#38bdf8', '#a78bfa', '#4ade80'][i % 4],
                  display: 'inline-block',
                }}
              />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
