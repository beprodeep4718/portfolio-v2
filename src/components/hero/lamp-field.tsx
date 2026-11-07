"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/components/theme";

/** Lamp position in hero pixels, written by the hero every frame */
export type LampState = { x: number; y: number; size: number; ready: boolean };

const dustVertex = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform vec2 uSize;
uniform vec2 uLamp;
uniform float uRadius;
uniform float uBase;
uniform float uPixelRatio;
varying float vLight;
varying float vAlpha;

void main() {
  vec2 p = position.xy * uSize;
  p.x += sin(uTime * (0.12 + aSeed.x * 0.22) + aSeed.y * 6.2831) * 26.0;
  p.y += cos(uTime * (0.1 + aSeed.y * 0.18) + aSeed.z * 6.2831) * 18.0
       + sin(uTime * 0.05 + aSeed.x * 6.2831) * 34.0;

  float d = distance(p, uLamp);
  float light = exp(-(d * d) / (uRadius * uRadius));
  vLight = light;
  vAlpha = uBase * (0.35 + aSeed.z) + light * 0.95;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
  gl_PointSize = (1.2 + aSeed.x * 2.0 + light * 2.8) * uPixelRatio;
}
`;

const dustFragment = /* glsl */ `
uniform vec3 uLampColor;
uniform vec3 uDim;
varying float vLight;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  vec3 color = mix(uDim, uLampColor, clamp(vLight * 1.5, 0.0, 1.0));
  gl_FragColor = vec4(color, smoothstep(0.5, 0.0, d) * vAlpha);
}
`;

const haloVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const haloFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
uniform float uTime;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float flicker = 0.94 + 0.06 * sin(uTime * 9.0) * sin(uTime * 3.7 + 1.3);
  float a = pow(max(0.0, 1.0 - d), 2.4) * uStrength * flicker;
  gl_FragColor = vec4(uColor, a);
}
`;

/* Seeded generator so the dust field is identical on every render */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeDust(count: number) {
  const rand = mulberry32(1337);
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand() - 0.5;
    positions[i * 3 + 1] = rand() - 0.5;
    positions[i * 3 + 2] = 0;
    seeds[i * 3] = rand();
    seeds[i * 3 + 1] = rand();
    seeds[i * 3 + 2] = rand();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
  return g;
}

function Field({
  lamp,
  reducedMotion,
  dark,
}: {
  lamp: RefObject<LampState>;
  reducedMotion: boolean;
  dark: boolean;
}) {
  const { size } = useThree();
  const count = size.width < 768 ? 420 : 900;

  const geometry = useMemo(() => makeDust(count), [count]);

  const dustUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: new THREE.Vector2(1, 1) },
      uLamp: { value: new THREE.Vector2(-99999, -99999) },
      uRadius: { value: 240 },
      uBase: { value: 0.1 },
      uPixelRatio: { value: typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2) },
      uLampColor: { value: new THREE.Color("#ff7a1a") },
      uDim: { value: new THREE.Color("#9aa0aa") },
    }),
    [],
  );
  const haloUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#ff7a1a") },
      uStrength: { value: 0.22 },
      uTime: { value: 0 },
    }),
    [],
  );
  const palette = useMemo(
    () => ({ dimLight: new THREE.Color("#9aa0aa"), dimDark: new THREE.Color("#4f5664") }),
    [],
  );

  const dust = useRef<THREE.ShaderMaterial>(null);
  const halo = useRef<THREE.ShaderMaterial>(null);
  const haloMesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const d = dust.current;
    const h = halo.current;
    const mesh = haloMesh.current;
    if (!d || !h || !mesh) return;

    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    d.uniforms.uTime.value = t;
    h.uniforms.uTime.value = t;
    (d.uniforms.uSize.value as THREE.Vector2).set(size.width, size.height);
    d.uniforms.uRadius.value = Math.max(170, size.width * 0.17);
    d.uniforms.uBase.value = dark ? 0.14 : 0.1;
    (d.uniforms.uDim.value as THREE.Color).copy(dark ? palette.dimDark : palette.dimLight);
    h.uniforms.uStrength.value = dark ? 0.5 : 0.2;

    const L = lamp.current;
    if (L.ready) {
      const wx = L.x - size.width / 2;
      const wy = size.height / 2 - L.y;
      (d.uniforms.uLamp.value as THREE.Vector2).set(wx, wy);
      mesh.position.set(wx, wy, 0);
    }
    mesh.scale.setScalar(Math.max(460, size.width * 0.46));
  });

  const blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={1} near={0.1} far={100} />
      <mesh ref={haloMesh} position={[-99999, 0, -1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={halo}
          vertexShader={haloVertex}
          fragmentShader={haloFragment}
          uniforms={haloUniforms}
          transparent
          depthWrite={false}
          blending={blending}
        />
      </mesh>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={dust}
          vertexShader={dustVertex}
          fragmentShader={dustFragment}
          uniforms={dustUniforms}
          transparent
          depthWrite={false}
          blending={blending}
        />
      </points>
    </>
  );
}

export default function LampField({
  lamp,
  reducedMotion,
  running,
}: {
  lamp: RefObject<LampState>;
  reducedMotion: boolean;
  running: boolean;
}) {
  const dark = useTheme() === "dark";
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      frameloop={reducedMotion ? "demand" : running ? "always" : "never"}
      fallback={null}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Field lamp={lamp} reducedMotion={reducedMotion} dark={dark} />
    </Canvas>
  );
}
