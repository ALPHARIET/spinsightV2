import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { clunk, ding, ratchet, tick } from '../lib/sfx';

const ROW = 96;
const LOOPS = 6;
const SPIN_MS = 3200;

const PULL = 180;
const TRIGGER = 120;
const NOTCH = 30;

const Lever = forwardRef(function Lever({ disabled, muted, onPull }, ref) {
  const reduce = useReducedMotion();
  const angle = useMotionValue(0);
  const pivotRef = useRef(null);
  const drag = useRef(null);
  const anim = useRef(null);
  const pulling = useRef(false);
  const [held, setHeld] = useState(false);

  const to = (value, opts) => {
    anim.current?.stop();
    anim.current = animate(angle, value, reduce ? { duration: 0 } : opts);
    return anim.current;
  };
  const springBack = () => to(0, { type: 'spring', stiffness: 300, damping: 9, mass: 0.8 });

  const pull = () => {
    if (disabled || drag.current || pulling.current) return;
    pulling.current = true;
    to(PULL, { duration: 0.28, ease: [0.5, 0, 0.9, 0.6] }).then(() => {
      pulling.current = false;
      onPull();
      springBack();
    });
  };
  useImperativeHandle(ref, () => ({ pull }));
  useEffect(() => () => anim.current?.stop(), []);

  const pointerAngle = (e) => {
    const r = pivotRef.current.getBoundingClientRect();
    return (Math.atan2(e.clientX - (r.left + r.width / 2), r.top + r.height / 2 - e.clientY) * 180) / Math.PI;
  };

  const onDown = (e) => {
    if (disabled || pulling.current) return;
    anim.current?.stop();
    drag.current = { last: pointerAngle(e), moved: false, notch: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setHeld(true);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const a = pointerAngle(e);
    let delta = a - d.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.last = a;
    const next = Math.max(0, Math.min(PULL, angle.get() + delta));
    if (next > 4) d.moved = true;
    const notch = Math.floor(next / NOTCH);
    if (notch > d.notch) ratchet(muted);
    d.notch = notch;
    angle.set(next);
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setHeld(false);
    if (!d.moved) return pull();
    if (angle.get() >= TRIGGER) onPull();
    springBack();
  };
  const onCancel = () => {
    drag.current = null;
    setHeld(false);
    springBack();
  };

  return (
    <div
      className="lever"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Tarik tuas untuk memutar"
      aria-disabled={disabled}
      data-held={held}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pull(); } }}
    >
      <motion.span className="lever-arm" style={{ rotate: angle }}>
        <span className="lever-stick" />
        <span className="lever-knob"><i /><i /><i /></span>
      </motion.span>
      <span className="lever-base" ref={pivotRef} />
    </div>
  );
});

export const SlotReel = forwardRef(function SlotReel(
  { items = [], landedId = null, locked = false, muted = false, onSpinStart, onLand, compact = false },
  ref
) {
  const n = items.length;
  const landedIdx = Math.max(0, items.findIndex((it) => it.id === landedId));
  const [pos, setPos] = useState(n ? landedIdx + n * 2 : 0);
  const [spinning, setSpinning] = useState(false);
  const stripRef = useRef(null);
  const leverRef = useRef(null);
  const rafRef = useRef(0);
  const lastRow = useRef(-1);
  const busy = useRef(false);
  const lastTick = useRef(0);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    if (!busy.current && n) setPos(landedIdx + n * 2);
  }, [n, landedId]);

  const canSpin = !locked && !spinning && n > 0;

  const watch = (now) => {
    const el = stripRef.current;
    if (el) {
      const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
      const y = m ? parseFloat(m[1].split(',')[5]) : 0;
      const row = Math.round(-y / ROW);
      if (row !== lastRow.current && now - lastTick.current > 28) {
        lastRow.current = row;
        lastTick.current = now;
        tick(mutedRef.current);
        if (navigator.vibrate) {
          try { navigator.vibrate(3); } catch {}
        }
      }
    }
    rafRef.current = requestAnimationFrame(watch);
  };

  const spin = () => {
    if (!canSpin || busy.current) return;
    busy.current = true;
    clunk(mutedRef.current);
    const target = Math.floor(Math.random() * n);
    const item = items[target];
    onSpinStart && onSpinStart(item);
    const base = pos % n;
    const next = n * (LOOPS - 1) + target;
    setPos(base);
    lastRow.current = -1;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setSpinning(true);
        setPos(next);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(watch);
      })
    );
    window.setTimeout(() => {
      cancelAnimationFrame(rafRef.current);
      setSpinning(false);
      setPos(target + n * 2);
      busy.current = false;
      ding(mutedRef.current);
      onLand && onLand(item);
    }, SPIN_MS + 120);
  };

  useImperativeHandle(ref, () => ({
    spin: () => (leverRef.current ? leverRef.current.pull() : spin()),
  }));
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const strip = [];
  for (let l = 0; l < LOOPS + 2; l++) items.forEach((it, i) => strip.push({ ...it, _k: `${l}-${i}` }));

  const rows = compact ? 3 : 5;
  const H = ROW * rows;
  const offset = -(pos * ROW) + (H - ROW) / 2;

  return (
    <div className={`reel ${compact ? 'reel-compact' : ''}`} data-locked={locked} data-spinning={spinning}>
      <div className="reel-window" style={{ height: H }} aria-live="polite">
        <div className="reel-rule" style={{ top: (H - ROW) / 2 }} />
        <div className="reel-rule" style={{ top: (H + ROW) / 2 }} />
        <div
          ref={stripRef}
          className="reel-strip"
          style={{
            transform: `translateY(${offset}px)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.75, 0.1, 1)` : 'none',
          }}
        >
          {strip.map((it, idx) => {
            const dist = Math.abs(idx - pos);
            return (
              <div
                key={it._k}
                className="reel-row"
                data-center={!spinning && dist === 0}
                data-near={!spinning && dist === 1}
                style={{ height: ROW }}
                aria-hidden={dist !== 0}
              >
                <span>{it.label}</span>
              </div>
            );
          })}
        </div>
        {n === 0 && <div className="reel-empty">Belum ada topik di materi ini.</div>}
      </div>

      <Lever ref={leverRef} disabled={!canSpin} muted={muted} onPull={spin} />
    </div>
  );
});
