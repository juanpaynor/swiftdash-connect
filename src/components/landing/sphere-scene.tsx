'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 1500;

// One neon colour per section
const SECTION_COLORS = [
  new THREE.Color('#00d4ff'), // 0 Hero     – neon cyan
  new THREE.Color('#00aaff'), // 1 About    – ice blue
  new THREE.Color('#8855ff'), // 2 Projects – electric violet
  new THREE.Color('#00ffcc'), // 3 Stack    – neon teal
  new THREE.Color('#ff44aa'), // 4 Contact  – neon pink
];

// ── Pre-compute the five shapes ────────────────────────────────────────────
function buildShapes(): Float32Array[] {
  // 0 ─ Fibonacci Sphere
  const sphere = new Float32Array(COUNT * 3);
  {
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const θ = ga * i;
      sphere[i * 3]     = Math.cos(θ) * r;
      sphere[i * 3 + 1] = y;
      sphere[i * 3 + 2] = Math.sin(θ) * r;
    }
  }

  // 1 ─ DNA Double Helix
  const dna = new Float32Array(COUNT * 3);
  {
    for (let i = 0; i < COUNT; i++) {
      const t = (i / COUNT) * Math.PI * 12;
      const strand = i % 2 === 0 ? 0 : Math.PI;
      dna[i * 3]     = Math.cos(t + strand) * 0.58;
      dna[i * 3 + 1] = (i / COUNT) * 2 - 1;
      dna[i * 3 + 2] = Math.sin(t + strand) * 0.58;
    }
  }

  // 2 ─ Cube (surface – 6 faces)
  const cube = new Float32Array(COUNT * 3);
  {
    for (let i = 0; i < COUNT; i++) {
      const face = i % 6;
      const s = i * 127.1;
      const u = Math.sin(s) * 0.5 + 0.5;
      const v = Math.cos(s * 1.7) * 0.5 + 0.5;
      const pu = u * 2 - 1;
      const pv = v * 2 - 1;
      const d = 0.9;
      switch (face) {
        case 0: cube[i*3]=d;  cube[i*3+1]=pu; cube[i*3+2]=pv; break;
        case 1: cube[i*3]=-d; cube[i*3+1]=pu; cube[i*3+2]=pv; break;
        case 2: cube[i*3]=pu; cube[i*3+1]=d;  cube[i*3+2]=pv; break;
        case 3: cube[i*3]=pu; cube[i*3+1]=-d; cube[i*3+2]=pv; break;
        case 4: cube[i*3]=pu; cube[i*3+1]=pv; cube[i*3+2]=d;  break;
        default: cube[i*3]=pu; cube[i*3+1]=pv; cube[i*3+2]=-d;
      }
    }
  }

  // 3 ─ Torus Ring
  const torus = new Float32Array(COUNT * 3);
  {
    const R = 0.72, r = 0.26;
    for (let i = 0; i < COUNT; i++) {
      const u = (i / COUNT) * Math.PI * 2;
      const v = (i * 11.71) % (Math.PI * 2);
      torus[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u);
      torus[i * 3 + 1] = r * Math.sin(v);
      torus[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
    }
  }

  // 4 ─ Inward Vortex Spiral
  const vortex = new Float32Array(COUNT * 3);
  {
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      const angle = t * Math.PI * 18;
      const rad = (1 - t) * 0.9;
      vortex[i * 3]     = Math.cos(angle) * rad;
      vortex[i * 3 + 1] = t * 2 - 1;
      vortex[i * 3 + 2] = Math.sin(angle) * rad;
    }
  }

  return [sphere, dna, cube, torus, vortex];
}

// ── Particle mesh ──────────────────────────────────────────────────────────
function SphereParticles({
  scrollRef,
  sectionRef,
}: {
  scrollRef: React.MutableRefObject<number>;
  sectionRef: React.MutableRefObject<number>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  const timeRef    = useRef(0);
  const prevSec    = useRef(-1);
  const morphT     = useRef(1);
  const fromBuf    = useRef<Float32Array | null>(null);

  const shapes = useMemo(() => buildShapes(), []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(shapes[0].slice(), 3));
    return g;
  }, [shapes]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t   = timeRef.current;
    const sec = Math.min(sectionRef.current, shapes.length - 1);
    const mat = pointsRef.current.material as THREE.PointsMaterial;

    // ── Trigger morph when section changes ─────────────────────────────
    if (sec !== prevSec.current) {
      const attr = geo.attributes.position as THREE.BufferAttribute;
      fromBuf.current = (attr.array as Float32Array).slice();
      prevSec.current = sec;
      morphT.current  = 0;
    }

    // ── Advance morph progress (ease-in-out quad) ───────────────────────
    if (morphT.current < 1) morphT.current = Math.min(morphT.current + delta * 1.1, 1);
    const mp     = morphT.current;
    const eased  = mp < 0.5 ? 2 * mp * mp : -1 + (4 - 2 * mp) * mp;

    const toPos   = shapes[sec];
    const fromPos = fromBuf.current ?? toPos;

    // ── Write morphed + breathing positions ────────────────────────────
    const attr = geo.attributes.position as THREE.BufferAttribute;
    const arr  = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const si      = i * 3;
      const breathe = Math.sin(t * 1.1 + i * 0.07) * 0.008;
      arr[si]     = fromPos[si]     + (toPos[si]     - fromPos[si])     * eased + breathe;
      arr[si + 1] = fromPos[si + 1] + (toPos[si + 1] - fromPos[si + 1]) * eased + breathe * 0.5;
      arr[si + 2] = fromPos[si + 2] + (toPos[si + 2] - fromPos[si + 2]) * eased + breathe * 0.8;
    }
    attr.needsUpdate = true;

    // ── Smoothly lerp particle colour to the section's colour ──────────
    mat.color.lerp(SECTION_COLORS[sec], 0.06);

    // ── Position: hero = center+large, sections = right beside content ──
    const inHero   = sec === 0;
    // viewport.width < 7.5 world units ≈ mobile portrait
    const isMobile = viewport.width < 7.5;
    const tx = inHero
      ? 0
      : isMobile
        ? viewport.width / 2 - 0.28          // small corner on mobile
        : viewport.width * 0.27;              // right column beside content
    const ty = inHero ? 0 : isMobile ? viewport.height / 2 - 0.28 : 0;
    const ts = inHero ? 1.5 : isMobile ? 0.22 : 0.8;

    const k  = 0.07;
    pointsRef.current.position.x += (tx - pointsRef.current.position.x) * k;
    pointsRef.current.position.y += (ty - pointsRef.current.position.y) * k;
    const cs = pointsRef.current.scale.x;
    pointsRef.current.scale.setScalar(cs + (ts - cs) * k);

    // ── Rotation ────────────────────────────────────────────────────────
    pointsRef.current.rotation.y += delta * (inHero ? 0.12 : 0.45);
    pointsRef.current.rotation.x  = Math.sin(t * 0.3) * 0.12;
  });

  return (
    <points ref={pointsRef} geometry={geo} scale={[1.5, 1.5, 1.5]}>
      <pointsMaterial
        color="#00d4ff"
        size={0.022}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ── Canvas wrapper ─────────────────────────────────────────────────────────
export default function SphereScene({
  scrollRef,
  sectionRef,
}: {
  scrollRef: React.MutableRefObject<number>;
  sectionRef: React.MutableRefObject<number>;
}) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <SphereParticles scrollRef={scrollRef} sectionRef={sectionRef} />
      </Canvas>
    </div>
  );
}
