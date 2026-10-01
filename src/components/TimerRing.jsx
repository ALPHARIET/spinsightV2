import React from 'react';

const R = 88;
const C = 2 * Math.PI * R;

export const fmtWaktu = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

export const TimerRing = ({ left, total, size = 168 }) => {
  const hot = left <= 15;
  return (
    <div className="timer-ring" data-hot={hot} role="timer" aria-label={`${left} detik tersisa`} style={{ width: size }}>
      <svg viewBox="0 0 200 200">
        <circle className="track" cx="100" cy="100" r={R} fill="none" strokeWidth="10" />
        <circle
          className="prog"
          cx="100"
          cy="100"
          r={R}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - left / total)}
        />
      </svg>
      <div className="center">
        <div>
          <div className={`timer-num ${hot ? 'is-hot' : ''}`} style={{ fontSize: '2.75rem' }}>{fmtWaktu(left)}</div>
          <div className="muted" style={{ fontSize: '0.8125rem' }}>tersisa</div>
        </div>
      </div>
    </div>
  );
};
