let ctx = null;
let master = null;
let noise = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

const rand = (a, b) => a + Math.random() * (b - a);

function burst(t, { freq, q = 1.2, gain, dur, type = 'bandpass' }) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.4);
  src.stop(t + dur + 0.02);
}

function tone(t, { freq, to, gain, dur, attack = 0.004, type = 'sine' }) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function play(muted, fn) {
  if (muted) return;
  try {
    if (!audio()) return;
    fn(ctx.currentTime);
  } catch {}
}

export const ratchet = (muted) =>
  play(muted, (t) => {
    burst(t, { freq: rand(1500, 1900), q: 2, gain: 2.4, dur: 0.02 });
    tone(t, { freq: 260, to: 180, gain: 0.22, dur: 0.035 });
  });

export const clunk = (muted) =>
  play(muted, (t) => {
    tone(t, { freq: 150, to: 52, gain: 0.5, dur: 0.24 });
    burst(t, { freq: 700, q: 0.7, gain: 0.9, dur: 0.07, type: 'lowpass' });
    burst(t + 0.012, { freq: 2400, q: 1.5, gain: 1.2, dur: 0.025 });
  });

export const tick = (muted) =>
  play(muted, (t) => {
    burst(t, { freq: rand(2800, 3600), q: 1.4, gain: rand(1.6, 2.1), dur: 0.014 });
    tone(t, { freq: rand(1700, 1900), gain: 0.06, dur: 0.02 });
  });

export const ding = (muted) =>
  play(muted, (t) => {
    burst(t, { freq: 2600, q: 1.5, gain: 0.3, dur: 0.015 });
    [[880, 0.02], [1318.5, 0.11]].forEach(([f, d]) => {
      tone(t + d, { freq: f, gain: 0.22, dur: 0.9, attack: 0.006 });
      tone(t + d, { freq: f * 2.76, gain: 0.04, dur: 0.35, attack: 0.004 });
    });
  });
