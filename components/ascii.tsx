'use client';

import { createElement, useEffect, useRef, useState } from 'react';

/**
 * Animated ASCII and dot-matrix pieces. Each one draws on a canvas, pauses when
 * off screen, and holds a single still frame when the visitor prefers reduced motion.
 */

const RAMP = ' .:-=+*#%@';
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=-/<>[]';
const TAU = Math.PI * 2;
const FRAME_MS = 1000 / 30;

function hash(i: number, j: number, k = 0) {
  const n = Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Runs draw(t) on a canvas sized to its box, at 30 fps while visible
 */
function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: string, mono: string) => void
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;
    let last = 0;
    let visible = false;
    let color = getComputedStyle(canvas).color;
    // canvas fonts can't read CSS variables, so resolve the Geist Mono family once
    const mono = getComputedStyle(canvas).getPropertyValue('--font-geist-mono').trim() || 'ui-monospace, monospace';
    const still = reducedMotion();
    const start = performance.now();

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { width, height };
    };
    let box = size();

    const paint = (now: number) => {
      ctx.clearRect(0, 0, box.width, box.height);
      drawRef.current(ctx, box.width, box.height, still ? 2.2 : (now - start) / 1000, color, mono);
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      paint(now);
    };

    const play = () => {
      if (still || !visible || frame) return;
      frame = requestAnimationFrame(loop);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else pause();
    });
    seen.observe(canvas);

    const resized = new ResizeObserver(() => {
      box = size();
      paint(performance.now());
    });
    resized.observe(canvas);

    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const recolor = () => {
      color = getComputedStyle(canvas).color;
      paint(performance.now());
    };
    scheme.addEventListener('change', recolor);

    paint(performance.now());
    return () => {
      pause();
      seen.disconnect();
      resized.disconnect();
      scheme.removeEventListener('change', recolor);
    };
  }, []);

  return ref;
}

/**
 * Radar: three rings that breathe, a ping that travels outward, a rotating sweep
 * with a fading trail, and blips that flash as the sweep passes them.
 */
function radarValue(i: number, j: number, cols: number, rows: number, t: number) {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const dx = (i - cx) / cx;
  const dy = (j - cy) / cy;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > 1.04) return 0;

  let ring = 0;
  for (const [k, radius] of [0.3, 0.62, 0.95].entries()) {
    const breathe = 0.72 + 0.28 * Math.sin(t * 1.4 - k * 1.6);
    ring = Math.max(ring, Math.exp(-((d - radius) ** 2) / 0.0035) * breathe);
  }

  const pingRadius = (t * 0.32) % 1.3;
  const ping = Math.exp(-((d - pingRadius) ** 2) / 0.002) * Math.max(0, 1 - pingRadius) * 0.9;

  const angle = Math.atan2(dy, dx);
  const behind = (((t * 1.1 - angle) % TAU) + TAU) % TAU;
  const beam = behind < 1.6 && d < 0.97 ? (1 - behind / 1.6) ** 1.6 * (1 - d * 0.35) : 0;

  let blip = 0;
  if (hash(i, j) > 0.985 && d > 0.15 && d < 0.92) {
    blip = behind < 0.9 ? 1 - behind / 0.9 : 0;
  }

  const centre = d < 0.06 ? 0.85 + 0.15 * Math.sin(t * 4) : 0;
  const flicker = hash(i, j, Math.floor(t * 10)) * 0.12;
  return Math.min(1, Math.max(ring, ping, beam * 0.9, blip, centre) + (ring > 0.2 ? flicker : 0));
}

type RadarProps = {
  mode?: 'dots' | 'ascii';
  cols: number;
  rows: number;
  className?: string;
};

export function Radar({ mode = 'dots', cols, rows, className }: RadarProps) {
  const ref = useCanvas((ctx, w, h, t, color, mono) => {
    const cw = w / cols;
    const ch = h / rows;
    ctx.fillStyle = color;
    if (mode === 'ascii') {
      ctx.font = `${Math.floor(ch * 0.95)}px ${mono}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const v = radarValue(i, j, cols, rows, t);
        if (v < 0.12) continue;
        const x = i * cw + cw / 2;
        const y = j * ch + ch / 2;
        ctx.globalAlpha = 0.3 + v * 0.7;
        if (mode === 'ascii') {
          ctx.fillText(RAMP[Math.min(RAMP.length - 1, Math.ceil(v * (RAMP.length - 1)))], x, y);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, Math.min(cw, ch) * 0.42 * (0.45 + v * 0.55), 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  });

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}

/**
 * A field of characters drifting in slow waves, for backgrounds
 */
export function AsciiField({ cell = 14, className }: { cell?: number; className?: string }) {
  const ref = useCanvas((ctx, w, h, t, color, mono) => {
    const cols = Math.ceil(w / (cell * 0.62));
    const rows = Math.ceil(h / cell);
    const cw = w / cols;
    ctx.fillStyle = color;
    ctx.font = `${cell * 0.9}px ${mono}`;
    ctx.textBaseline = 'top';
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const wave =
          Math.sin(i * 0.11 + t * 0.7 + Math.sin(j * 0.17 + t * 0.35) * 2.2) *
          Math.cos(j * 0.09 - t * 0.4);
        const v = (wave + 1) / 2;
        const grain = hash(i, j, Math.floor(t * 3));
        if (v < 0.35 || grain > 0.55 + v * 0.4) continue;
        ctx.globalAlpha = v * 0.9;
        ctx.fillText(RAMP[Math.ceil(v * (RAMP.length - 1))], i * cw, j * cell);
      }
    }
    ctx.globalAlpha = 1;
  });

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}

/**
 * Text that decodes from random glyphs when it scrolls into view.
 * Screen readers get the real text; the animated letters are hidden from them.
 */
export function Scramble({
  text,
  as = 'span',
  className,
  duration = 700,
  hover = false
}: {
  text: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'dd';
  className?: string;
  duration?: number;
  hover?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const el = ref.current!;
    if (reducedMotion()) {
      setShown(text);
      return;
    }
    let frame = 0;

    const run = () => {
      cancelAnimationFrame(frame);
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const out = [...text]
          .map((c, i) => {
            if (!/[A-Za-z0-9]/.test(c)) return c;
            const settleAt = 0.25 + (i / text.length) * 0.75;
            return p >= settleAt ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('');
        setShown(out);
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        run();
        seen.disconnect();
      },
      { threshold: 0.6 }
    );
    seen.observe(el);

    const target = hover ? (el.closest('a, button') as HTMLElement | null) ?? el : null;
    target?.addEventListener('mouseenter', run);

    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      target?.removeEventListener('mouseenter', run);
    };
  }, [text, duration, hover]);

  return createElement(
    as,
    { ref, className, 'aria-label': text },
    <span aria-hidden="true">{shown}</span>
  );
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Braille spinner for running states
 */
export function AsciiSpinner({ className }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return;
    const timer = setInterval(() => setI((n) => (n + 1) % SPINNER.length), 80);
    return () => clearInterval(timer);
  }, []);
  return (
    <span aria-hidden="true" className={`font-mono ${className ?? ''}`}>
      {SPINNER[i]}
    </span>
  );
}
