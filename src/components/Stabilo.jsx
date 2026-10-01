import React from 'react';
import { segmentArgument, segmentsFromQuotes, PART_META } from '../lib/argument';

export const StabiloLegend = ({ has, style }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', fontSize: '0.875rem', fontWeight: 500, ...style }}>
    {['klaim', 'alasan', 'bukti'].map((k) => (
      <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', opacity: has && !has[k] ? 0.45 : 1 }}>
        <span className="legend-swatch" style={{ background: `var(--${k})` }} />
        {PART_META[k].label}
        {has && !has[k] && <span style={{ fontWeight: 400, color: 'var(--muted)' }}>· belum ada</span>}
      </span>
    ))}
  </div>
);

export const StabiloText = ({ text, kutipan = null, size = '1.125rem', lineHeight = 1.85, animate = false }) => {
  const { segments, raw } = kutipan ? segmentsFromQuotes(text, kutipan) : segmentArgument(text);
  let n = 0;
  return (
    <p style={{ fontSize: size, lineHeight, color: 'var(--ink)', whiteSpace: raw ? 'pre-wrap' : undefined }}>
      {segments.map((s, i) => (
        <React.Fragment key={i}>
          {s.type ? (
            <mark
              className={`hl hl-${s.type} ${animate ? 'hl-anim' : ''}`}
              style={animate ? { animationDelay: `${0.25 + n++ * 0.35}s` } : undefined}
              title={PART_META[s.type].label}
            >
              {s.text}
            </mark>
          ) : (
            <span>{s.text}</span>
          )}{raw ? '' : ' '}
        </React.Fragment>
      ))}
    </p>
  );
};
