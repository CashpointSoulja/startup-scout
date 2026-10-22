/**
 * Dot-matrix artwork drawn from math: concentric scope rings with a radar sweep.
 * Static SVG, so it costs no client JavaScript.
 */

function noise(i: number, j: number) {
  const n = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

type Props = {
  cols: number;
  rows: number;
  gap?: number;
  rings?: number[];
  sweep?: boolean;
  className?: string;
};

export function DotField({
  cols,
  rows,
  gap = 11,
  rings = [0.25, 0.55, 0.9],
  sweep = true,
  className
}: Props) {
  const dots: { x: number; y: number; r: number; o: number }[] = [];
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const max = Math.min(cx, cy);
  const sweepFrom = -Math.PI * 0.85;
  const sweepTo = -Math.PI * 0.35;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const dx = i - cx;
      const dy = j - cy;
      const d = Math.sqrt(dx * dx + dy * dy) / max;
      if (d > 1.08) continue;

      // closeness to the nearest ring, 0..1
      let ring = 0;
      for (const radius of rings) {
        ring = Math.max(ring, Math.exp(-((d - radius) ** 2) / 0.004));
      }

      // brighter wedge, fading clockwise like a radar trail
      let beam = 0;
      if (sweep && d < 0.95) {
        const angle = Math.atan2(dy, dx);
        if (angle > sweepFrom && angle < sweepTo) {
          beam = ((angle - sweepFrom) / (sweepTo - sweepFrom)) * (1 - d * 0.6);
        }
      }

      const centre = d < 0.07 ? 1 : 0;
      const value = Math.max(ring, beam * 0.85, centre);
      const grain = noise(i, j);
      if (value < 0.18 || grain > 0.35 + value) continue;

      const level = value > 0.7 ? 1 : value > 0.4 ? 0.7 : 0.45;
      dots.push({ x: i * gap + gap / 2, y: j * gap + gap / 2, r: gap * 0.36 * level, o: level });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cols * gap} ${rows * gap}`}
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      {dots.map((dot) => (
        <circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.r.toFixed(2)}
          opacity={dot.o}
        />
      ))}
    </svg>
  );
}
