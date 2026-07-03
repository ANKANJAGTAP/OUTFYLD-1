'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { heroScroll } from './heroScroll';

/**
 * KickoffScene — real-time floodlit pitch corner.
 * Silhouette + haze + one raking key light, not a detailed stadium.
 * Budget: primitives only (<2k tris), DPR clamped [1,2], one real light.
 *
 * Idle life (time-based, independent of scroll; parent pauses the loop
 * off-screen via the frameloop prop):
 *  - floodlight breathing ±3.5% over ~5s + slow positional drift, which
 *    also shifts the wet-pitch specular streak
 *  - god-ray sway + opacity drift, fog near-plane drift (haze breathing)
 *  - gentle camera sway layered under the damped pointer parallax
 *  - heroScroll.p (pinned scrub timeline) pushes the camera ~6% toward
 *    the pitch and back, both scroll directions
 */

const LIGHT_POS = new THREE.Vector3(6.5, 9, 3);
const TARGET = new THREE.Vector3(0, 0, 0);

function Breathe() {
  const spot = useRef<THREE.SpotLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const s = spot.current;
    if (!s) return;
    // ±3.5% breathing over ~5s
    s.intensity = 220 * (1 + 0.035 * Math.sin((t * Math.PI * 2) / 5));
    // slow drift — moves the specular streak on the wet pitch
    s.position.x = LIGHT_POS.x + 0.35 * Math.sin(t * 0.11);
    s.position.z = LIGHT_POS.z + 0.3 * Math.cos(t * 0.09);
  });
  return (
    <spotLight
      ref={spot}
      position={LIGHT_POS.toArray()}
      angle={0.55}
      penumbra={1}
      intensity={220}
      distance={45}
      color={'#e8f2d8'}
      target-position={[0, 0, 0]}
    />
  );
}

function FogDrift() {
  const scene = useThree((s) => s.scene);
  useFrame(({ clock }) => {
    const f = scene.fog as THREE.Fog | null;
    if (f) f.near = 7 + Math.sin(clock.elapsedTime * 0.15) * 0.7;
  });
  return null;
}

function GodRay() {
  // A soft additive cone standing in for volumetric scatter from the pylon head.
  const grp = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const { position, quaternion, height } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(LIGHT_POS, TARGET); // points up toward light
    const h = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    const mid = new THREE.Vector3().addVectors(LIGHT_POS, TARGET).multiplyScalar(0.5);
    return { position: mid, quaternion: q, height: h };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (mat.current) mat.current.opacity = 0.05 * (1 + 0.28 * Math.sin(t * 0.23 + 1));
    if (grp.current) grp.current.rotation.z = 0.015 * Math.sin(t * 0.07);
  });

  return (
    <group ref={grp}>
      <mesh position={position} quaternion={quaternion}>
        <coneGeometry args={[2.4, height, 24, 1, true]} />
        <meshBasicMaterial
          ref={mat}
          color={'#e6f2d8'}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Pylon() {
  return (
    <group position={[7, 0, 2.2]}>
      {/* mast */}
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 9, 8]} />
        <meshStandardMaterial color={'#0c1512'} roughness={0.9} metalness={0.2} />
      </mesh>
      {/* light head */}
      <mesh position={[-0.25, 8.9, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.25]} />
        <meshStandardMaterial
          color={'#e6f2d8'}
          emissive={'#e6f2d8'}
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function CornerFlag() {
  // Small lime corner flag in the lower-right foreground — balances the
  // left-weighted headline and echoes the brand accent without fighting type.
  return (
    <group position={[3.1, 0, 4.6]} rotation={[0, -0.45, 0]}>
      {/* pole */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 1.1, 6]} />
        <meshStandardMaterial color={'#c3ccc4'} roughness={0.6} />
      </mesh>
      {/* lime flag */}
      <mesh position={[0.2, 0.92, 0]}>
        <planeGeometry args={[0.38, 0.24]} />
        <meshStandardMaterial
          color={'#c8f135'}
          emissive={'#c8f135'}
          emissiveIntensity={0.45}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Rig() {
  const base = useRef({ x: 0, y: 1.4, z: 8.5 });
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // gentle time-based sway layered under the damped pointer parallax
    const swayX = 0.12 * Math.sin(t * 0.13);
    const swayY = 0.05 * Math.sin(t * 0.17 + 2);
    const px = state.pointer.x;
    const py = state.pointer.y;
    // pinned scrub timeline pushes ~6% toward the pitch (and back)
    const z = base.current.z - heroScroll.p * 0.51;
    state.camera.position.x +=
      (base.current.x + px * 0.6 + swayX - state.camera.position.x) * 0.04;
    state.camera.position.y +=
      (base.current.y + py * 0.3 + swayY - state.camera.position.y) * 0.04;
    state.camera.position.z += (z - state.camera.position.z) * 0.06;
    state.camera.lookAt(0, 0.7 - heroScroll.p * 0.25, 0);
  });
  return null;
}

export default function KickoffScene({
  onReady,
  frameloop = 'always',
}: {
  onReady?: () => void;
  frameloop?: 'always' | 'never';
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={frameloop}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.4, 8.5], fov: 40, near: 0.1, far: 60 }}
      onCreated={() => onReady?.()}
    >
      <fog attach="fog" args={['#080b0a', 7, 24]} />
      <ambientLight intensity={0.06} />
      <Breathe />
      <FogDrift />

      {/* wet-pitch ground — low roughness catches the specular streak */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={'#0a130f'} roughness={0.36} metalness={0.6} />
      </mesh>

      <GodRay />
      <Pylon />
      <CornerFlag />
      <Rig />
    </Canvas>
  );
}
