'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** One cell on the stadium screen: big seven-seg value + mono label. */
export interface ScoreCell {
  label: string;
  value: number;
  decimals?: number;
}

/**
 * Scoreboard3D — an information-bearing set piece, not a prop.
 * A slightly-tilted stadium scoreboard panel whose screen face renders any
 * four REAL stats (platform totals on the homepage, the player's season on
 * the dashboard) as glowing lime seven-segment digits on a CanvasTexture.
 * Behaviour:
 *  - powers on with the floodlight-buzz language when scrolled in (once),
 *    digits roll up once, then HOLD (the sanctioned odometer exception)
 *  - idle: faint screen flicker + scanline shimmer
 *  - pointer tilts the panel a few degrees (damped)
 *  - scrolling past scrubs a subtle rotation (bidirectional)
 *  - IntersectionObserver pauses the frameloop off-screen
 * Desktop-only — mobile and reduced-motion keep the flat odometer band
 * (guaranteed readable at 390px; the same numbers, accessible as real text).
 */

const LIME = '#c8f135';
const CHALK = '#9aa79f';

//            A  B  C  D  E  F  G
const SEG: Record<string, [number, number, number, number, number, number, number]> = {
  '0': [1, 1, 1, 1, 1, 1, 0],
  '1': [0, 1, 1, 0, 0, 0, 0],
  '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1],
  '4': [0, 1, 1, 0, 0, 1, 1],
  '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1],
  '7': [1, 1, 1, 0, 0, 0, 0],
  '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1],
};

function seg(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  // roundRect is supported in every browser that runs this canvas (Chromium/FF/Safari 16+)
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Draw one seven-segment digit; returns advance width. */
function drawDigit(
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  y: number,
  h: number,
  color: string,
  alpha: number
) {
  const t = h * 0.14; // segment thickness
  const w = h * 0.58;
  if (ch === '.') {
    ctx.shadowColor = color;
    ctx.shadowBlur = t;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    seg(ctx, x, y + h - t, t * 1.1, t * 1.1, t * 0.3);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    return t * 2.2;
  }
  const on = SEG[ch];
  if (!on) return w + h * 0.16; // space / unknown → gap
  const half = (h - 3 * t) / 2;
  const rects: [number, number, number, number][] = [
    [x + t * 0.9, y, w - 1.8 * t, t], // A
    [x + w - t, y + t * 0.8, t, half + t * 0.4], // B
    [x + w - t, y + h / 2 + t * 0.1, t, half + t * 0.4], // C
    [x + t * 0.9, y + h - t, w - 1.8 * t, t], // D
    [x, y + h / 2 + t * 0.1, t, half + t * 0.4], // E
    [x, y + t * 0.8, t, half + t * 0.4], // F
    [x + t * 0.9, y + (h - t) / 2, w - 1.8 * t, t], // G
  ];
  for (let i = 0; i < 7; i++) {
    const lit = on[i] === 1;
    ctx.shadowColor = lit ? color : 'transparent';
    ctx.shadowBlur = lit ? t * 1.1 : 0;
    ctx.globalAlpha = lit ? alpha : 0.07;
    ctx.fillStyle = color;
    seg(ctx, rects[i][0], rects[i][1], rects[i][2], rects[i][3], t * 0.28);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  return w + h * 0.16;
}

function drawValue(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  h: number,
  color: string,
  alpha: number
) {
  let cx = x;
  for (const ch of text) cx += drawDigit(ctx, ch, cx, y, h, color, alpha);
  return cx - x;
}

const W = 1536;
const H = 768;

const CELL_POS = [
  { x: 110, y: 105 },
  { x: 880, y: 105 },
  { x: 110, y: 455 },
  { x: 880, y: 455 },
];

function drawScreen(canvas: HTMLCanvasElement, cellTexts: { label: string; text: string }[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);

  // screen base
  ctx.fillStyle = '#07100c';
  ctx.fillRect(0, 0, W, H);

  const cells = cellTexts.slice(0, 4).map((c, i) => ({ ...c, ...CELL_POS[i] }));

  const dh = 160; // digit height
  for (const c of cells) {
    drawValue(ctx, c.text, c.x, c.y, dh, LIME, 0.95);
    ctx.shadowBlur = 0;
    ctx.fillStyle = CHALK;
    ctx.font = '600 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    try {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '7px';
    } catch {
      /* older engines: no letterSpacing — acceptable */
    }
    ctx.fillText(c.label, c.x + 4, c.y + dh + 62);
  }

  // hairline inner border
  ctx.strokeStyle = 'rgba(200,241,53,0.09)';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);

  // soft top sheen
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  g.addColorStop(0, 'rgba(226,240,214,0.05)');
  g.addColorStop(1, 'rgba(226,240,214,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.5);
}

/** Format a cell's value at a given roll progress (eased 0..1). */
function cellText(cell: ScoreCell, eased: number): { label: string; text: string } {
  const v = cell.value * eased;
  return {
    label: cell.label,
    text: cell.decimals ? v.toFixed(cell.decimals) : String(Math.round(v)),
  };
}

function Panel({
  cells,
  pointer,
  scrub,
  power,
}: {
  cells: ScoreCell[];
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  scrub: React.MutableRefObject<number>;
  power: React.MutableRefObject<{ started: boolean; t0: number; done: boolean }>;
}) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    drawScreen(c, cells.map((cell) => cellText(cell, 0))); // dark until power-on
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    return { canvas: c, texture: tx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;

    // damped pointer tilt + scrubbed rotation as you scroll past
    const targetY = pointer.current.x * 0.08 + (scrub.current - 0.5) * 0.16;
    const targetX = -0.07 + pointer.current.y * -0.05;
    g.rotation.y += (targetY - g.rotation.y) * 0.06;
    g.rotation.x += (targetX - g.rotation.x) * 0.06;

    const p = power.current;
    if (!p.started) {
      m.emissiveIntensity = 0.04; // dark screen pre-power-on
      return;
    }
    const el = (t - p.t0) / 1.5;
    if (el < 1) {
      // digits roll up once (eased), buzz on the same floodlight curve
      const eased = 1 - Math.pow(1 - Math.min(el, 1), 4);
      drawScreen(canvas, cells.map((cell) => cellText(cell, eased)));
      texture.needsUpdate = true;
      m.emissiveIntensity =
        el < 0.1 ? 4 * el : el < 0.16 ? 0.12 : 0.12 + (el - 0.16) * (1.08 / 0.84);
    } else {
      if (!p.done) {
        drawScreen(canvas, cells.map((cell) => cellText(cell, 1))); // final values — hold
        texture.needsUpdate = true;
        p.done = true;
      }
      // idle: faint flicker + scanline shimmer
      m.emissiveIntensity =
        1.18 + 0.045 * Math.sin(t * 9.3) * Math.sin(t * 1.7) - (Math.sin(t * 0.31) > 0.9995 ? 0.18 : 0);
      texture.offset.y = 0.0012 * Math.sin(t * 0.8);
    }
  });

  return (
    <group ref={group} rotation={[-0.07, 0, 0]}>
      {/* dark stadium frame */}
      <mesh>
        <boxGeometry args={[4.3, 2.2, 0.14]} />
        <meshStandardMaterial color={'#141e19'} roughness={0.5} metalness={0.35} />
      </mesh>
      {/* mounting struts */}
      <mesh position={[-1.5, -1.45, -0.05]}>
        <cylinderGeometry args={[0.035, 0.045, 1.1, 8]} />
        <meshStandardMaterial color={'#0c1512'} roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[1.5, -1.45, -0.05]}>
        <cylinderGeometry args={[0.035, 0.045, 1.1, 8]} />
        <meshStandardMaterial color={'#0c1512'} roughness={0.8} metalness={0.3} />
      </mesh>
      {/* screen face — emissive canvas texture */}
      <mesh position={[0, 0, 0.075]}>
        <planeGeometry args={[4.02, 1.96]} />
        <meshStandardMaterial
          ref={mat}
          color={'#000000'}
          emissive={'#ffffff'}
          emissiveMap={texture}
          emissiveIntensity={0.04}
          roughness={0.9}
          toneMapped={false}
        />
      </mesh>
      {/* lime service stripe under the screen */}
      <mesh position={[-1.72, -0.99, 0.075]}>
        <planeGeometry args={[0.5, 0.035]} />
        <meshStandardMaterial
          color={LIME}
          emissive={LIME}
          emissiveIntensity={0.7}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function Scoreboard3D({
  cells,
  onReady,
}: {
  cells: ScoreCell[];
  onReady?: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');
  const pointer = useRef({ x: 0, y: 0 });
  const scrub = useRef(0.5);
  const power = useRef({ started: false, t0: 0, done: false });

  // pause the loop off-screen
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setFrameloop(e.isIntersecting ? 'always' : 'never'),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // scrubbed pass-rotation + one-shot power-on trigger
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            scrub.current = self.progress;
          },
        });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 72%',
          once: true, // power on ONCE, digits roll then hold
          onEnter: () => {
            power.current.started = true;
            power.current.t0 = performance.now() / 1000;
            // t0 must be in canvas clock space — set on next frame instead
            power.current.t0 = -1;
          },
        });
      }, el);
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="h-full w-full cursor-default"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      }}
      onPointerLeave={() => {
        pointer.current.x = 0;
        pointer.current.y = 0;
      }}
    >
      <Canvas
        dpr={[1, 1.75]}
        frameloop={frameloop}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.05, 3.1], fov: 34 }}
        onCreated={() => onReady?.()}
      >
        <ambientLight intensity={0.22} />
        {/* floodlight key from top-front + lime rim from behind-left */}
        <spotLight position={[2.5, 4, 4]} angle={0.7} penumbra={1} intensity={60} color={'#e8f2d8'} />
        <directionalLight position={[-4, -1, -3]} intensity={1.1} color={LIME} />
        <PanelClock cells={cells} pointer={pointer} scrub={scrub} power={power} />
      </Canvas>
    </div>
  );
}

/** Bridges wall-clock power-on trigger into the R3F clock domain. */
function PanelClock(props: {
  cells: ScoreCell[];
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  scrub: React.MutableRefObject<number>;
  power: React.MutableRefObject<{ started: boolean; t0: number; done: boolean }>;
}) {
  useFrame(({ clock }) => {
    const p = props.power.current;
    if (p.started && p.t0 === -1) p.t0 = clock.elapsedTime; // first frame after trigger
  });
  return <Panel {...props} />;
}
