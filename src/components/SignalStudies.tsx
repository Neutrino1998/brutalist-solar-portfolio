import { useEffect, useRef } from 'react';

type StudyKind = 'lissajous' | 'harmonics' | 'lorenz';

const STUDIES: Array<{ kind: StudyKind; label: string }> = [
  { kind: 'lissajous', label: '01 / LISSAJOUS' },
  { kind: 'harmonics', label: '02 / HARMONICS' },
  { kind: 'lorenz', label: '03 / LORENZ ATTRACTOR' },
];

const INK = 'rgba(222, 216, 196, 0.72)';
const INK_FAINT = 'rgba(222, 216, 196, 0.11)';
const SIGNAL = 'rgba(190, 46, 33, 0.88)';

type LorenzPoint = { x: number; y: number; z: number };

const LORENZ_POINTS: LorenzPoint[] = (() => {
  const points: LorenzPoint[] = [];
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const step = 0.006;
  let x = 0.1;
  let y = 0;
  let z = 0;

  for (let index = 0; index < 2700; index += 1) {
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;
    x += dx * step;
    y += dy * step;
    z += dz * step;

    if (index >= 500) {
      points.push({ x: x / 21, y: y / 29, z: (z - 25) / 24 });
    }
  }

  return points;
})();

function drawGuides(context: CanvasRenderingContext2D, width: number, height: number) {
  context.beginPath();
  context.moveTo(width * 0.12, height * 0.5);
  context.lineTo(width * 0.88, height * 0.5);
  context.moveTo(width * 0.5, height * 0.18);
  context.lineTo(width * 0.5, height * 0.88);
  context.strokeStyle = INK_FAINT;
  context.lineWidth = 0.65;
  context.stroke();
}

function drawLissajous(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  const centerX = width * 0.5;
  const centerY = height * 0.54;
  const radiusX = width * 0.31;
  const radiusY = height * 0.29;
  const animatedPhase = time * 0.00012;

  context.beginPath();
  for (let index = 0; index <= 420; index += 1) {
    const angle = (index / 420) * Math.PI * 2;
    const x = centerX + radiusX * Math.sin(3 * angle + Math.PI / 2 + animatedPhase);
    const y = centerY + radiusY * Math.sin(2 * angle);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.strokeStyle = INK;
  context.lineWidth = 1;
  context.stroke();

  const markerAngle = (time * 0.00028) % (Math.PI * 2);
  const markerX = centerX + radiusX * Math.sin(
    3 * markerAngle + Math.PI / 2 + animatedPhase,
  );
  const markerY = centerY + radiusY * Math.sin(2 * markerAngle);
  context.beginPath();
  context.arc(markerX, markerY, 2.15, 0, Math.PI * 2);
  context.fillStyle = SIGNAL;
  context.fill();
}

function drawHarmonics(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  const startX = width * 0.1;
  const plotWidth = width * 0.8;
  const centerY = height * 0.54;
  const phase = time * 0.00016;

  [
    { frequency: 2, amplitude: height * 0.16, phase: phase, color: INK, lineWidth: 1 },
    {
      frequency: 5,
      amplitude: height * 0.095,
      phase: -phase * 1.4 + 0.7,
      color: SIGNAL,
      lineWidth: 0.9,
    },
  ].forEach((wave) => {
    context.beginPath();
    for (let index = 0; index <= 260; index += 1) {
      const progress = index / 260;
      const x = startX + plotWidth * progress;
      const y = centerY + wave.amplitude * Math.sin(
        progress * Math.PI * 2 * wave.frequency + wave.phase,
      );
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = wave.color;
    context.lineWidth = wave.lineWidth;
    context.stroke();
  });
}

function drawLorenzAttractor(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  const centerX = width * 0.5;
  const centerY = height * 0.56;
  const rotation = 0.2 + Math.sin(time * 0.00009) * 0.34;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);

  const project = (point: LorenzPoint) => {
    const horizontal = point.x * cosine - point.y * sine;
    const depth = point.x * sine + point.y * cosine;
    return {
      x: centerX + horizontal * width * 0.3,
      y: centerY + (point.z + depth * 0.08) * height * 0.29,
    };
  };

  context.beginPath();
  LORENZ_POINTS.forEach((point, index) => {
    const projected = project(point);
    if (index === 0) context.moveTo(projected.x, projected.y);
    else context.lineTo(projected.x, projected.y);
  });
  context.strokeStyle = 'rgba(222, 216, 196, 0.58)';
  context.lineWidth = 0.75;
  context.stroke();

  const markerIndex = Math.floor(time * 0.045) % LORENZ_POINTS.length;
  const tailStart = Math.max(0, markerIndex - 70);
  context.beginPath();
  for (let index = tailStart; index <= markerIndex; index += 1) {
    const projected = project(LORENZ_POINTS[index]);
    if (index === tailStart) context.moveTo(projected.x, projected.y);
    else context.lineTo(projected.x, projected.y);
  }
  context.strokeStyle = 'rgba(190, 46, 33, 0.58)';
  context.lineWidth = 1.05;
  context.stroke();

  const marker = project(LORENZ_POINTS[markerIndex]);
  context.beginPath();
  context.arc(marker.x, marker.y, 2.15, 0, Math.PI * 2);
  context.fillStyle = SIGNAL;
  context.fill();
}

function SignalStudy({ kind, label }: { kind: StudyKind; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrame = 0;

    const draw = (time: number) => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * pixelRatio);
      const pixelHeight = Math.round(height * pixelRatio);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      drawGuides(context, width, height);

      if (kind === 'lissajous') drawLissajous(context, width, height, time);
      if (kind === 'harmonics') drawHarmonics(context, width, height, time);
      if (kind === 'lorenz') drawLorenzAttractor(context, width, height, time);

      if (!reduceMotion) animationFrame = window.requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (reduceMotion) draw(0);
    });

    resizeObserver.observe(canvas);
    draw(0);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [kind]);

  return (
    <figure className="signal-study">
      <figcaption className="signal-study__label">{label}</figcaption>
      <canvas ref={canvasRef} aria-hidden="true" />
    </figure>
  );
}

export default function SignalStudies() {
  return (
    <div className="signal-studies" aria-label="Signal studies">
      {STUDIES.map((study) => (
        <SignalStudy key={study.kind} {...study} />
      ))}
    </div>
  );
}
