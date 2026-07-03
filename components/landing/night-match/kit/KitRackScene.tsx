'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SportRackItem } from '@/lib/turfs';
import { CricketBat, BadmintonRacquet, Football } from './KitObjects';

/**
 * KitRackScene — the 3D object IS the interface.
 * Three kit pieces on a stadium shelf; each carries real Mongo data.
 * Hover (fine pointer) or tap (coarse) selects: the object lifts and turns
 * to the user, the spotlight snaps to it, an info plate (HTML, site type
 * system) shows sport / turf count / starting price; the others dim to
 * silhouette. Click (or second tap) navigates to /browse?sport=X.
 * Idle: breathing key light; scrolling past scrubs a slow parade rotation.
 * Reduced motion: states snap (no lerps), light static, plates still work.
 */

const X_POS = [-1.15, 0, 1.15];

function Item({
  item,
  x,
  selected,
  anySelected,
  reduce,
  coarse,
  onSelect,
  onNavigate,
  children,
}: {
  item: SportRackItem;
  x: number;
  selected: boolean;
  anySelected: boolean;
  reduce: boolean;
  coarse: boolean;
  onSelect: (s: boolean) => void;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const dim = useRef(1);
  const mats = useRef<{ m: THREE.MeshStandardMaterial; c: THREE.Color; e: number }[]>([]);

  // collect materials once for silhouette dimming
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    const list: { m: THREE.MeshStandardMaterial; c: THREE.Color; e: number }[] = [];
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        const m = mesh.material as THREE.MeshStandardMaterial;
        list.push({ m, c: m.color.clone(), e: m.emissiveIntensity });
      }
    });
    mats.current = list;
  }, []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const k = reduce ? 1 : 0.09; // reduced motion: snap
    const lift = selected ? 0.2 : 0;
    const rotY = selected ? 0.38 : 0;
    const scale = selected ? 1.06 : 1;
    g.position.y += (lift - g.position.y) * k;
    g.rotation.y += (rotY - g.rotation.y) * k;
    g.scale.setScalar(g.scale.x + (scale - g.scale.x) * k);

    const dimTarget = anySelected && !selected ? 0.16 : 1;
    if (Math.abs(dim.current - dimTarget) > 0.004) {
      dim.current += (dimTarget - dim.current) * (reduce ? 1 : 0.1);
      for (const { m, c, e } of mats.current) {
        m.color.copy(c).multiplyScalar(dim.current);
        m.emissiveIntensity = e * dim.current;
      }
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <group
        ref={group}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!coarse) {
            onSelect(true);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          if (!coarse) {
            onSelect(false);
            document.body.style.cursor = '';
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (coarse && !selected) onSelect(true); // first tap selects
          else onNavigate(); // click / second tap navigates
        }}
      >
        {children}
      </group>

      {selected && (
        <Html center position={[0, 1.5, 0]} zIndexRange={[30, 0]}>
          <button
            data-testid={`kit-plate-${item.sport.toLowerCase()}`}
            onClick={onNavigate}
            className="pointer-events-auto block w-max cursor-pointer border border-flood-500/40 bg-pitch-700/95 px-5 py-4 text-left shadow-flood backdrop-blur-sm"
          >
            <span className="block font-display text-2xl uppercase leading-none tracking-tight text-chalk-100">
              {item.sport}
            </span>
            <span className="mt-2 block font-mono text-[0.7rem] uppercase tracking-[0.18em] text-chalk-400">
              {item.count > 0 ? (
                <>
                  {item.count} {item.count === 1 ? 'turf' : 'turfs'}
                  {item.fromPrice ? ` — from ₹${item.fromPrice}/hr` : ''}
                </>
              ) : (
                'Coming soon'
              )}
            </span>
            <span className="mt-2 block font-mono text-[0.7rem] uppercase tracking-[0.18em] text-flood-500">
              View turfs →
            </span>
          </button>
        </Html>
      )}
    </group>
  );
}

function Lights({ selectedX, reduce }: { selectedX: number | null; reduce: boolean }) {
  const key = useRef<THREE.SpotLight>(null);
  const snap = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (key.current && !reduce) {
      key.current.intensity = 150 * (1 + 0.05 * Math.sin((t * Math.PI * 2) / 4.6));
    }
    if (snap.current) {
      const on = selectedX !== null;
      const k = reduce ? 1 : 0.12;
      target.position.x += ((selectedX ?? 0) - target.position.x) * k;
      target.position.y = 0.5;
      snap.current.intensity += ((on ? 130 : 0) - snap.current.intensity) * k;
    }
  });

  return (
    <>
      <ambientLight intensity={0.12} />
      <spotLight
        ref={key}
        position={[2.5, 5, 3.5]}
        angle={0.65}
        penumbra={1}
        intensity={150}
        color={'#e8f2d8'}
      />
      <directionalLight position={[-4, 1.5, -3]} intensity={2.0} color={'#c8f135'} />
      {/* snap spotlight — jumps to the selected object */}
      <primitive object={target} />
      <spotLight
        ref={snap}
        position={[0, 4.2, 2.2]}
        angle={0.32}
        penumbra={0.8}
        intensity={0}
        color={'#eef6ec'}
        target={target}
      />
    </>
  );
}

function Rack({
  items,
  scrub,
  reduce,
  coarse,
  onNavigate,
}: {
  items: SportRackItem[];
  scrub: React.MutableRefObject<number>;
  reduce: boolean;
  coarse: boolean;
  onNavigate: (sport: string) => void;
}) {
  const rack = useRef<THREE.Group>(null);
  const [sel, setSel] = useState<number | null>(null);

  useFrame(() => {
    const g = rack.current;
    if (!g || reduce) return;
    // slow parade rotation scrubbed to scroll (bidirectional)
    const target = (scrub.current - 0.5) * 0.45;
    g.rotation.y += (target - g.rotation.y) * 0.07;
  });

  const comps = [CricketBat, BadmintonRacquet, Football];

  return (
    <group ref={rack} onPointerMissed={() => setSel(null)}>
      {/* backdrop + shelf */}
      <mesh position={[0, 0.6, -0.75]}>
        <planeGeometry args={[7, 3.4]} />
        <meshStandardMaterial color={'#0a0f0c'} roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[3.6, 0.09, 0.95]} />
        <meshStandardMaterial color={'#141e19'} roughness={0.5} metalness={0.35} />
      </mesh>
      <mesh position={[0, -0.125, 0.42]}>
        <boxGeometry args={[3.6, 0.06, 0.06]} />
        <meshStandardMaterial color={'#0c1512'} roughness={0.7} />
      </mesh>

      <Lights selectedX={sel === null ? null : X_POS[sel]} reduce={reduce} />

      {items.map((item, i) => {
        const Comp = comps[i];
        return (
          <Item
            key={item.sport}
            item={item}
            x={X_POS[i]}
            selected={sel === i}
            anySelected={sel !== null}
            reduce={reduce}
            coarse={coarse}
            onSelect={(s) => setSel(s ? i : sel === i ? null : sel)}
            onNavigate={() => onNavigate(item.sport)}
          >
            <Comp rotation={[0, i === 0 ? 0.35 : i === 1 ? -0.2 : 0, 0]} />
          </Item>
        );
      })}
    </group>
  );
}

export default function KitRackScene({
  items,
  scrub,
  frameloop,
  reduce,
  onReady,
}: {
  items: SportRackItem[];
  scrub: React.MutableRefObject<number>;
  frameloop: 'always' | 'never';
  reduce: boolean;
  onReady?: () => void;
}) {
  const router = useRouter();
  const coarse = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  );

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={reduce ? 'demand' : frameloop}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.95, 3.4], fov: 38 }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0.5, 0);
        onReady?.();
      }}
    >
      <Rack
        items={items}
        scrub={scrub}
        reduce={reduce}
        coarse={coarse}
        onNavigate={(sport) => router.push(`/browse?sport=${encodeURIComponent(sport)}`)}
      />
    </Canvas>
  );
}
