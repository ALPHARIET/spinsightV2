import React, { useMemo, useRef, useState } from 'react';

export const SERIES = [
  { key: 'kejelasanKlaim', label: 'Klaim', color: '#B08A00' },
  { key: 'kekuatanAlasan', label: 'Alasan', color: '#1D3FCC' },
  { key: 'ketajamanBukti', label: 'Bukti', color: '#2E8B2E' },
];

const W = 640;
const H = 280;
const PAD = { l: 36, r: 64, t: 16, b: 34 };
const Y1 = 100;

const fmtDate = (s) => {
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export const ProgressChart = ({ sessions }) => {
  const [hi, setHi] = useState(null);
  const svgRef = useRef(null);
  const n = sessions.length;
  const lowest = Math.min(...sessions.flatMap((j) => SERIES.map((s) => j.dimensi[s.key])));
  const Y0 = Math.min(50, Math.floor(lowest / 10) * 10);
  const ticks = Array.from({ length: (Y1 - Y0) / 10 + 1 }, (_, i) => Y0 + i * 10);

  const x = (i) => PAD.l + (n <= 1 ? 0 : (i * (W - PAD.l - PAD.r)) / (n - 1));
  const y = (v) => PAD.t + ((Y1 - v) * (H - PAD.t - PAD.b)) / (Y1 - Y0);

  const paths = useMemo(
    () =>
      SERIES.map((s) => ({
        ...s,
        d: sessions.map((j, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(j.dimensi[s.key]).toFixed(1)}`).join(' '),
      })),
    [sessions]
  );

  const onMove = (e) => {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHi(best);
  };

  const last = sessions[n - 1];
  const endLabels = SERIES.map((s) => ({ ...s, v: last?.dimensi[s.key] ?? 0, yy: y(last?.dimensi[s.key] ?? 0) }))
    .sort((a, b) => a.yy - b.yy)
    .reduce((acc, l) => {
      const prev = acc[acc.length - 1];
      acc.push({ ...l, yy: prev && l.yy - prev.yy < 16 ? prev.yy + 16 : l.yy });
      return acc;
    }, []);

  const tipLeft = hi != null ? (x(hi) / W) * 100 : 0;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }} aria-hidden="true">
        {SERIES.map((s) => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--ink-2)' }}>
            <span style={{ width: 16, height: 2, background: s.color, borderRadius: 2 }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Perkembangan klaim, alasan, dan bukti selama ${n} sesi`}
        onMouseMove={onMove}
        onMouseLeave={() => setHi(null)}
        style={{ display: 'block', overflow: 'visible', touchAction: 'pan-y' }}
        onTouchStart={(e) => onMove(e.touches[0])}
        onTouchMove={(e) => onMove(e.touches[0])}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#EEF0F3" strokeWidth="1" />
            <text x={PAD.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#6B6F7E">{t}</text>
          </g>
        ))}
        {sessions.map((j, i) => (
          <text key={j.id} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6B6F7E">{fmtDate(j.tanggal)}</text>
        ))}

        {hi != null && <line x1={x(hi)} x2={x(hi)} y1={PAD.t} y2={H - PAD.b} stroke="#C7CAD5" strokeWidth="1" />}

        {paths.map((p) => (
          <path key={p.key} d={p.d} fill="none" stroke={p.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {SERIES.map((s) => {
          const i = hi ?? n - 1;
          const v = sessions[i]?.dimensi[s.key];
          if (v == null) return null;
          return <circle key={s.key} cx={x(i)} cy={y(v)} r="4" fill={s.color} stroke="#FFFFFF" strokeWidth="2" />;
        })}

        {hi == null &&
          endLabels.map((l) => (
            <text key={l.key} x={W - PAD.r + 10} y={l.yy} dominantBaseline="middle" fontSize="12" fill="#1C1C1E">
              {l.label} {l.v}
            </text>
          ))}
      </svg>

      {hi != null && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: 28,
            left: `${tipLeft}%`,
            transform: `translateX(${tipLeft > 60 ? 'calc(-100% - 12px)' : '12px'})`,
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-md)',
            padding: '0.6rem 0.8rem',
            fontSize: '0.8125rem',
            pointerEvents: 'none',
            minWidth: 170,
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{fmtDate(sessions[hi].tanggal)}</div>
          <div className="muted" style={{ marginBottom: 6, maxWidth: 220 }}>{sessions[hi].caseJudul}</div>
          {SERIES.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ color: 'var(--ink-2)' }}>{s.label}</span>
              <span style={{ marginLeft: 'auto', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{sessions[hi].dimensi[s.key]}</span>
            </div>
          ))}
        </div>
      )}

      <details style={{ marginTop: '0.75rem' }}>
        <summary className="muted" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Lihat sebagai tabel</summary>
        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>Tanggal</th>
                {SERIES.map((s) => <th key={s.key} style={{ padding: '0.4rem 0.5rem', fontWeight: 500, textAlign: 'right' }}>{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {sessions.map((j) => (
                <tr key={j.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '0.4rem 0.5rem' }}>{fmtDate(j.tanggal)}</td>
                  {SERIES.map((s) => <td key={s.key} style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{j.dimensi[s.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
