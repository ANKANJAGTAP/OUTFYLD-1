'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';

type GroupProps = ThreeElements['group'];

/**
 * Kit objects — primitives-built (no downloaded assets), styled in the
 * Night Match grammar: dark carbon/willow materials for one floodlight key
 * + lime rim to catch. Each object is a self-contained group ~1 unit tall,
 * origin at its base, built for the kit-rack set piece.
 * Poly budget: all three together are well under 5k triangles.
 */

export function CricketBat(props: GroupProps) {
  const blade = useMemo(() => {
    // Willow blade profile — rounded rectangle, extruded with a bevel that
    // fakes the spine curve.
    const s = new THREE.Shape();
    const w = 0.115, h = 0.62, r = 0.05;
    s.moveTo(-w + r, 0);
    s.lineTo(w - r, 0);
    s.quadraticCurveTo(w, 0, w, r);
    s.lineTo(w, h - r * 0.6);
    s.quadraticCurveTo(w, h, w - r * 0.6, h);
    s.lineTo(-w + r * 0.6, h);
    s.quadraticCurveTo(-w, h, -w, h - r * 0.6);
    s.lineTo(-w, r);
    s.quadraticCurveTo(-w, 0, -w + r, 0);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.028,
      bevelSize: 0.02,
      bevelSegments: 3,
      curveSegments: 10,
    });
    geo.translate(0, 0, -0.0275);
    return geo;
  }, []);

  return (
    <group {...props}>
      {/* blade */}
      <mesh geometry={blade} castShadow>
        <meshStandardMaterial color={'#d9d2ba'} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* splice / shoulder */}
      <mesh position={[0, 0.665, 0]}>
        <cylinderGeometry args={[0.032, 0.058, 0.1, 10]} />
        <meshStandardMaterial color={'#c9c2a8'} roughness={0.6} />
      </mesh>
      {/* handle — dark grip */}
      <mesh position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.03, 0.032, 0.3, 10]} />
        <meshStandardMaterial color={'#10231b'} roughness={0.85} />
      </mesh>
      {/* lime grip rings */}
      {[0.78, 0.87, 0.96].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.0325, 0.0325, 0.016, 10]} />
          <meshStandardMaterial
            color={'#c8f135'}
            emissive={'#c8f135'}
            emissiveIntensity={0.35}
            roughness={0.5}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function BadmintonRacquet(props: GroupProps) {
  const strings = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(238,246,236,0.85)';
    ctx.lineWidth = 2;
    for (let i = 12; i < 256; i += 21) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
    }
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }, []);

  return (
    <group {...props}>
      {/* head — carbon ellipse */}
      <group position={[0, 0.78, 0]} scale={[1, 1.22, 1]}>
        <mesh>
          <torusGeometry args={[0.205, 0.016, 10, 40]} />
          <meshStandardMaterial color={'#131a16'} roughness={0.35} metalness={0.55} />
        </mesh>
        {/* string bed */}
        <mesh>
          <circleGeometry args={[0.195, 32]} />
          <meshBasicMaterial
            map={strings}
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* T-joint */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.024, 0.08, 8]} />
        <meshStandardMaterial color={'#131a16'} roughness={0.4} metalness={0.5} />
      </mesh>
      {/* shaft */}
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.014, 0.016, 0.28, 8]} />
        <meshStandardMaterial color={'#1a231e'} roughness={0.35} metalness={0.6} />
      </mesh>
      {/* handle with lime grip tape */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.026, 0.028, 0.2, 10]} />
        <meshStandardMaterial color={'#10231b'} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.205, 0]}>
        <cylinderGeometry args={[0.029, 0.029, 0.018, 10]} />
        <meshStandardMaterial
          color={'#c8f135'}
          emissive={'#c8f135'}
          emissiveIntensity={0.35}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function Football(props: GroupProps) {
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.235, 1), 1),
    []
  );
  return (
    <group {...props}>
      <group position={[0, 0.235, 0]}>
        {/* stylized low-poly ball — flat-shaded chalk panels */}
        <mesh castShadow>
          <icosahedronGeometry args={[0.235, 1]} />
          <meshStandardMaterial color={'#dfe5dc'} roughness={0.5} flatShading />
        </mesh>
        {/* dark panel seams */}
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={'#0c1410'} />
        </lineSegments>
      </group>
    </group>
  );
}
