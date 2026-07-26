import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { ModuleId } from '../types';
import { PLANETS } from '../data';
import { decodeSignalFrame } from '../utils';

interface CanvasSceneProps {
  activeModule: ModuleId | null;
  focusedModule: ModuleId;
  setActiveModule: (id: ModuleId | null) => void;
  setFocusedModule: (id: ModuleId) => void;
}

const GRID_BASE_Y = -2;
const GRID_ROTATION_X = Math.PI / 2;
const ORBIT_SEGMENTS = 160;
const SUN_RADIUS = 3.35;
const SUN_CENTER_DEPTH = 4.72;
const SUN_GRID_CLEARANCE = 0.5;
const SUN_CENTER_Y = GRID_BASE_Y - SUN_CENTER_DEPTH;
const SUN_WELL_DEPTH = SUN_CENTER_DEPTH + SUN_RADIUS + SUN_GRID_CLEARANCE;
const BASE_CAMERA_DISTANCE = 54;
const BASE_FOG_NEAR = 42;
const BASE_FOG_FAR = 105;
const GRID_SIZE = 96;
const GRID_SEGMENTS = 86;
const GRID_FADE_END_LIMIT = GRID_SIZE / 2 - 0.5;
const GRID_FADE_WIDTH = 12;
const GRID_ORBIT_PADDING = 3;
const ORBIT_LINE_GRID_CLEARANCE = 0.12;
const RING_GRID_CLEARANCE_FACTOR = 0.35;
const GRID_RENDER_ORDER = 0;
const RING_RENDER_ORDER = 2;
const PLANET_FRAME_PADDING = 1.22;
const SELECTION_FRAME_JOIN_OVERLAP = 4;
const SELECTION_FRAME_Z_INDEX_RANGE: [number, number] = [7, 7];
const ASTEROID_COUNT = 220;
const ASTEROID_BELT_INNER_RADIUS = 15.4;
const ASTEROID_BELT_OUTER_RADIUS = 18.1;
const COMET_SEMI_MAJOR_AXIS = 25;
const COMET_ECCENTRICITY = 0.8;
const COMET_MAJOR_AXIS_TILT = -0.28;
const COMET_ORBIT_AZIMUTH = -0.42;
const COMET_MEAN_MOTION = 0.045;
const COMET_GLOW_RENDER_ORDER = 3;
const COMET_OUTER_TAIL_RENDER_ORDER = 4;
const COMET_INNER_TAIL_RENDER_ORDER = 5;
const COMET_UP = new THREE.Vector3(0, 1, 0);
const COMET_ORBIT_Y_AXIS = new THREE.Vector3(0, 1, 0);
const COMET_ORBIT_Z_AXIS = new THREE.Vector3(0, 0, 1);
const SUN_POSITION = new THREE.Vector3(0, SUN_CENTER_Y, 0);

const GAS_GIANT_VERTEX_SHADER = `
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vLocalPosition = position;
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GAS_GIANT_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uCloudColor;
  uniform vec3 uSunPosition;

  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 sphere = normalize(vLocalPosition);
    float longitude = atan(sphere.z, sphere.x);
    float latitude = sphere.y;

    float drift = sin(longitude * 2.0 + uTime * 0.04) * 0.018;
    float bands = 0.5 + 0.5 * sin((latitude + drift) * 10.0);
    bands = smoothstep(0.24, 0.82, bands);

    vec3 atmosphere = mix(uBaseColor, uCloudColor, bands * 0.06);

    vec3 normal = normalize(vWorldNormal);
    vec3 lightDirection = normalize(uSunPosition - vWorldPosition);
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float light = 0.5 + diffuse * 0.64;

    gl_FragColor = vec4(atmosphere * light, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface AsteroidDatum {
  angle: number;
  radius: number;
  height: number;
  scale: number;
  stretch: number;
  rotation: [number, number, number];
  speed: number;
}

function seededNoise(index: number, channel: number) {
  const value = Math.sin((index + 1) * (12.9898 + channel * 31.731)) * 43758.5453;
  return value - Math.floor(value);
}

function getCometOrbitPosition(
  angle: number,
  orbitScale: number,
  target: THREE.Vector3,
) {
  const semiMajorAxis = COMET_SEMI_MAJOR_AXIS * Math.max(orbitScale, 0.72);
  const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - COMET_ECCENTRICITY ** 2);

  target.set(
    semiMajorAxis * (Math.cos(angle) - COMET_ECCENTRICITY),
    0,
    semiMinorAxis * Math.sin(angle),
  );
  target.applyAxisAngle(COMET_ORBIT_Z_AXIS, COMET_MAJOR_AXIS_TILT);
  target.applyAxisAngle(COMET_ORBIT_Y_AXIS, COMET_ORBIT_AZIMUTH);
  target.y += SUN_CENTER_Y;

  return target;
}

function solveCometEccentricAnomaly(meanAnomaly: number) {
  let eccentricAnomaly = meanAnomaly;

  for (let iteration = 0; iteration < 5; iteration += 1) {
    eccentricAnomaly -= (
      eccentricAnomaly
      - COMET_ECCENTRICITY * Math.sin(eccentricAnomaly)
      - meanAnomaly
    ) / (1 - COMET_ECCENTRICITY * Math.cos(eccentricAnomaly));
  }

  return eccentricAnomaly;
}

function getPlanetCenterOffset(size: number, hasRings = false) {
  const ringClearance = hasRings ? size * RING_GRID_CLEARANCE_FACTOR : 0;
  return size + 0.14 + size * 0.04 + ringClearance;
}

function getWellDepthAt(x: number, z: number, planetPositions: readonly THREE.Vector3[]) {
  let depth = SUN_WELL_DEPTH * Math.exp(-(x * x + z * z) * 0.018);

  planetPositions.forEach((position, index) => {
    const dx = x - position.x;
    const dz = z - position.z;
    const planet = PLANETS[index];
    const isGasGiant = planet.planetClass === 'gas-giant';
    const wellDepth = planet.size * (isGasGiant ? 3.2 : 2.5);
    const wellRadius = planet.size * (isGasGiant ? 2 : 1.75) + 0.55;
    depth += wellDepth * Math.exp(-(dx * dx + dz * dz) / (2 * wellRadius * wellRadius));
  });

  return depth;
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const compact = size.width < 640;
    camera.position.set(0, compact ? 42 : 28, compact ? 64 : 43);
    camera.lookAt(compact ? 0 : 3, -3.5, 0);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = compact ? 50 : 44;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width]);

  return null;
}

function CameraDirector({
  activeModule,
  planetPositions,
  controlsRef,
}: {
  activeModule: ModuleId | null;
  planetPositions: React.MutableRefObject<THREE.Vector3[]>;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera, size } = useThree();
  const homePosition = useRef(new THREE.Vector3(0, 28, 43));
  const homeTarget = useRef(new THREE.Vector3(0, -3.5, 0));
  const homeFov = useRef(44);
  const wasActive = useRef(false);
  const returningHome = useRef(false);
  const viewOffsetX = useRef(0);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => {
    if (camera instanceof THREE.PerspectiveCamera) camera.clearViewOffset();
    if (controlsRef.current) controlsRef.current.enabled = true;
  }, [camera]);

  useEffect(() => {
    const controls = controlsRef.current;

    if (activeModule) {
      if (controls) controls.enabled = false;
      returningHome.current = false;
    } else if (!activeModule && wasActive.current) {
      const compactHome = size.width < 640;
      homePosition.current.set(0, compactHome ? 42 : 28, compactHome ? 64 : 43);
      homeTarget.current.set(0, -3.5, 0);
      homeFov.current = compactHome ? 50 : 44;
      returningHome.current = true;
      if (controls) controls.enabled = false;
    } else if (controls && !returningHome.current) {
      controls.enabled = true;
    }

    wasActive.current = Boolean(activeModule);
  }, [activeModule, controlsRef, size.width]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (activeModule) {
      controls.enabled = false;
      const planetIndex = PLANETS.findIndex((planet) => planet.id === activeModule);
      if (planetIndex < 0) return;

      const planet = PLANETS[planetIndex];
      const position = planetPositions.current[planetIndex];
      const visualRadius = planet.size * (planet.hasRings ? 1.92 : 1);
      const compact = size.width < 768;
      const focusDistance = 8 + visualRadius * 4;
      const easing = 1 - Math.exp(-delta * 2.8);

      desiredPosition.set(
        position.x,
        position.y + focusDistance * (compact ? 0.63 : 0.52),
        position.z + focusDistance * (compact ? 0.92 : 0.84),
      );
      desiredTarget.set(
        position.x,
        position.y - (compact ? focusDistance * 0.08 : 0),
        position.z,
      );

      camera.position.lerp(desiredPosition, easing);
      controls.target.lerp(desiredTarget, easing);

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, compact ? 43 : 38, easing);
        viewOffsetX.current = THREE.MathUtils.lerp(
          viewOffsetX.current,
          size.width * (compact ? 0.1 : 0.18),
          easing,
        );
        camera.setViewOffset(
          size.width,
          size.height,
          viewOffsetX.current,
          0,
          size.width,
          size.height,
        );
      }
      camera.lookAt(controls.target);

      return;
    }

    if (!returningHome.current) {
      controls.enabled = true;
      return;
    }

    controls.enabled = false;
    const easing = 1 - Math.exp(-delta * 3.4);
    camera.position.lerp(homePosition.current, easing);
    controls.target.lerp(homeTarget.current, easing);

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, homeFov.current, easing);
      viewOffsetX.current = THREE.MathUtils.lerp(viewOffsetX.current, 0, easing);
      camera.setViewOffset(
        size.width,
        size.height,
        viewOffsetX.current,
        0,
        size.width,
        size.height,
      );
    }
    camera.lookAt(controls.target);

    if (
      camera.position.distanceToSquared(homePosition.current) < 0.002
      && controls.target.distanceToSquared(homeTarget.current) < 0.002
    ) {
      camera.position.copy(homePosition.current);
      controls.target.copy(homeTarget.current);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = homeFov.current;
        viewOffsetX.current = 0;
        camera.clearViewOffset();
      }
      camera.lookAt(homeTarget.current);
      returningHome.current = false;
      controls.enabled = true;
    }
  });

  return null;
}

function AdaptiveFog() {
  const { camera, scene } = useThree();

  useFrame(() => {
    const fog = scene.fog;
    if (!(fog instanceof THREE.Fog)) return;

    const distanceToOrbitCenter = Math.sqrt(
      camera.position.x * camera.position.x
      + (camera.position.y + 3.5) * (camera.position.y + 3.5)
      + camera.position.z * camera.position.z,
    );
    const zoomDelta = Math.max(0, distanceToOrbitCenter - BASE_CAMERA_DISTANCE);

    fog.near = BASE_FOG_NEAR + zoomDelta * 0.84;
    fog.far = BASE_FOG_FAR + zoomDelta * 1.36;
  });

  return null;
}

interface SelectionFrameProps {
  visualRadius: number;
  index: string;
  systemLabel: string;
  subtitle: string;
  selected: boolean;
}

const selectionFrameScreenPosition = new THREE.Vector3();

function calculatePixelAlignedPosition(
  element: THREE.Object3D,
  camera: THREE.Camera,
  size: { width: number; height: number },
) {
  selectionFrameScreenPosition.setFromMatrixPosition(element.matrixWorld).project(camera);
  const pixelRatio = window.devicePixelRatio || 1;
  const x = (selectionFrameScreenPosition.x * 0.5 + 0.5) * size.width;
  const y = (-selectionFrameScreenPosition.y * 0.5 + 0.5) * size.height;

  return [
    Math.round(x * pixelRatio) / pixelRatio,
    Math.round(y * pixelRatio) / pixelRatio,
  ];
}

function SignalLabelCopy({
  selected,
  meta,
  title,
}: {
  selected: boolean;
  meta: string;
  title: string;
}) {
  const [decoded, setDecoded] = useState({ meta, title });

  useEffect(() => {
    const target = { meta, title };

    if (!selected || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDecoded(target);
      return undefined;
    }

    setDecoded({ meta: '#', title: '#' });
    let animationFrame = 0;
    const decodeTimer = window.setTimeout(() => {
      const startedAt = window.performance.now();

      const update = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / 340);
        const tick = Math.floor(progress * 9);
        setDecoded({
          meta: decodeSignalFrame(meta, progress, tick),
          title: decodeSignalFrame(title, progress, tick + 4),
        });

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(update);
        }
      };

      animationFrame = window.requestAnimationFrame(update);
    }, 300);

    return () => {
      window.clearTimeout(decodeTimer);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [meta, selected, title]);

  return (
    <>
      <span className="planet-selection__meta block text-[10px] font-black uppercase tracking-[0.2em] text-[#121212]">
        {decoded.meta}
      </span>
      <span className="planet-selection__title mt-1 block text-xl font-black italic uppercase leading-none text-[#121212]">
        {decoded.title}
      </span>
    </>
  );
}

function SelectionFrame({
  visualRadius,
  index,
  systemLabel,
  subtitle,
  selected,
}: SelectionFrameProps) {
  const { camera, viewport } = useThree();
  const anchorRef = useRef<THREE.Group>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const connectorRef = useRef<HTMLSpanElement>(null);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const lastFrameSize = useRef(0);

  useFrame(() => {
    const anchor = anchorRef.current;
    const root = rootRef.current;
    const frame = frameRef.current;
    const connector = connectorRef.current;
    if (!anchor || !root || !frame || !connector) return;

    anchor.getWorldPosition(worldPosition);
    const viewportAtPlanet = viewport.getCurrentViewport(camera, worldPosition);
    const pixelRatio = window.devicePixelRatio || 1;
    const frameSize = 2 * visualRadius * viewportAtPlanet.factor * PLANET_FRAME_PADDING;

    if (Math.abs(frameSize - lastFrameSize.current) < 0.05) return;

    frame.style.width = `${frameSize}px`;
    frame.style.height = `${frameSize}px`;
    frame.style.left = `${-frameSize / 2}px`;
    frame.style.top = `${-frameSize / 2}px`;
    root.style.opacity = '1';
    const rawConnectorOffset = frameSize / Math.SQRT2 - SELECTION_FRAME_JOIN_OVERLAP;
    const connectorOffset = Math.round(rawConnectorOffset * pixelRatio) / pixelRatio;
    connector.style.left = `${connectorOffset}px`;
    lastFrameSize.current = frameSize;
  });

  return (
    <group ref={anchorRef}>
      <Html
        wrapperClass="pointer-events-none"
        position={[0, 0, 0]}
        calculatePosition={calculatePixelAlignedPosition}
        zIndexRange={selected ? [8, 8] : SELECTION_FRAME_Z_INDEX_RANGE}
      >
        <div
          ref={rootRef}
          className="planet-selection pointer-events-none relative h-0 w-0 opacity-0"
          data-selected={selected}
          aria-hidden="true"
        >
          <span ref={frameRef} className="planet-selection__frame absolute border-2 border-[#DED8C4]" />
          <span
            ref={connectorRef}
            className="planet-selection__connector absolute flex items-center whitespace-nowrap"
          >
            <span className="planet-selection__line h-0.5 w-8" />
            <span className="planet-selection__label border-l-2 border-[#DED8C4]">
              <span className="planet-selection__label-base">
                <span className="planet-selection__meta block text-[10px] font-black uppercase tracking-[0.2em] text-[#BE2E21]">
                  {index} / {systemLabel}
                </span>
                <span className="planet-selection__title mt-1 block text-xl font-black italic uppercase leading-none text-[#DED8C4]">
                  {subtitle}
                </span>
              </span>
              <span className="planet-selection__label-active absolute inset-0 block" aria-hidden="true">
                <SignalLabelCopy
                  selected={selected}
                  meta={`${index} / ${systemLabel}`}
                  title={subtitle}
                />
              </span>
            </span>
          </span>
        </div>
      </Html>
    </group>
  );
}

function Sun() {
  const coreRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');

    if (context) {
      const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255, 233, 160, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 132, 56, 0.72)');
      gradient.addColorStop(0.52, 'rgba(190, 46, 33, 0.24)');
      gradient.addColorStop(1, 'rgba(190, 46, 33, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  useFrame(({ clock }, delta) => {
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.3) * 0.025;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.12;
      coreRef.current.scale.setScalar(pulse);
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z -= delta * 0.08;
      coronaRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 0.8) * 0.035);
    }
  });

  return (
    <group position={[0, SUN_CENTER_Y, 0]}>
      <pointLight color="#FF6A2D" intensity={950} distance={58} decay={2} />

      <sprite scale={[16, 16, 1]} renderOrder={-1}>
        <spriteMaterial
          map={glowTexture}
          color="#FFFFFF"
          transparent
          opacity={0.86}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[SUN_RADIUS, 5]} />
        <meshStandardMaterial
          color="#FFD86A"
          emissive="#FF3D16"
          emissiveIntensity={3.8}
          roughness={0.72}
          metalness={0}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={coronaRef} scale={1.28}>
        <icosahedronGeometry args={[SUN_RADIUS, 3]} />
        <meshBasicMaterial
          color="#FF5A24"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <mesh scale={1.62}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#BE2E21"
          transparent
          opacity={0.055}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

    </group>
  );
}

function AsteroidBelt({
  orbitScale,
  planetPositions,
}: {
  orbitScale: number;
  planetPositions: React.MutableRefObject<THREE.Vector3[]>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const asteroids = useMemo<AsteroidDatum[]>(() => (
    Array.from({ length: ASTEROID_COUNT }, (_, index) => ({
      angle: seededNoise(index, 0) * Math.PI * 2,
      radius: THREE.MathUtils.lerp(
        ASTEROID_BELT_INNER_RADIUS,
        ASTEROID_BELT_OUTER_RADIUS,
        seededNoise(index, 1),
      ),
      height: THREE.MathUtils.lerp(-0.18, 0.28, seededNoise(index, 2)),
      scale: THREE.MathUtils.lerp(0.045, 0.15, Math.pow(seededNoise(index, 3), 1.7)),
      stretch: THREE.MathUtils.lerp(0.7, 1.65, seededNoise(index, 4)),
      rotation: [
        seededNoise(index, 5) * Math.PI,
        seededNoise(index, 6) * Math.PI,
        seededNoise(index, 7) * Math.PI,
      ],
      speed: THREE.MathUtils.lerp(0.002, 0.006, seededNoise(index, 8)),
    }))
  ), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    asteroids.forEach((_, index) => {
      const tone = seededNoise(index, 9) > 0.72 ? '#B85A3C' : '#77736A';
      mesh.setColorAt(index, new THREE.Color(tone));
    });

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [asteroids]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();
    asteroids.forEach((asteroid, index) => {
      const angle = asteroid.angle + elapsed * asteroid.speed;
      const x = Math.cos(angle) * asteroid.radius * orbitScale;
      const z = Math.sin(angle) * asteroid.radius * orbitScale;

      dummy.position.set(
        x,
        GRID_BASE_Y - getWellDepthAt(x, z, planetPositions.current) + asteroid.height,
        z,
      );
      dummy.rotation.set(
        asteroid.rotation[0] + elapsed * asteroid.speed * 6,
        asteroid.rotation[1] + elapsed * asteroid.speed * 4,
        asteroid.rotation[2],
      );
      dummy.scale.set(
        asteroid.scale * asteroid.stretch,
        asteroid.scale,
        asteroid.scale / asteroid.stretch,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ASTEROID_COUNT]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#9A9485" roughness={0.9} metalness={0.02} flatShading />
    </instancedMesh>
  );
}

function Comet({ orbitScale }: { orbitScale: number }) {
  const cometRef = useRef<THREE.Group>(null);
  const outerTailRef = useRef<THREE.Mesh>(null);
  const innerTailRef = useRef<THREE.Mesh>(null);
  const meanAnomalyRef = useRef(Math.PI * 0.82);
  const position = useMemo(() => new THREE.Vector3(), []);
  const tailDirection = useMemo(() => new THREE.Vector3(), []);
  const orbitLine = useMemo(() => {
    const points = Array.from({ length: ORBIT_SEGMENTS }, (_, index) => (
      getCometOrbitPosition(
        (index / ORBIT_SEGMENTS) * Math.PI * 2,
        orbitScale,
        new THREE.Vector3(),
      )
    ));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: '#77736A',
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    });
    const line = new THREE.LineLoop(geometry, material);
    line.frustumCulled = false;
    return line;
  }, [orbitScale]);

  useEffect(() => () => {
    orbitLine.geometry.dispose();
    (orbitLine.material as THREE.Material).dispose();
  }, [orbitLine]);

  useFrame((_, delta) => {
    const comet = cometRef.current;
    if (!comet) return;

    meanAnomalyRef.current = (
      meanAnomalyRef.current + delta * COMET_MEAN_MOTION
    ) % (Math.PI * 2);
    const eccentricAnomaly = solveCometEccentricAnomaly(meanAnomalyRef.current);
    getCometOrbitPosition(eccentricAnomaly, orbitScale, position);
    const furthestDistance = COMET_SEMI_MAJOR_AXIS
      * (1 + COMET_ECCENTRICITY)
      * Math.max(orbitScale, 0.72);
    const distanceToSun = position.distanceTo(SUN_POSITION);
    const proximity = 1 - THREE.MathUtils.clamp(distanceToSun / furthestDistance, 0, 1);

    comet.position.copy(position);
    tailDirection.copy(position).sub(SUN_POSITION).normalize();
    comet.quaternion.setFromUnitVectors(COMET_UP, tailDirection);

    const outerTailLength = 2.4 + proximity * 3.2;
    if (outerTailRef.current) {
      outerTailRef.current.position.y = outerTailLength / 2;
      outerTailRef.current.scale.set(1, outerTailLength, 1);
    }

    const innerTailLength = outerTailLength * 0.68;
    if (innerTailRef.current) {
      innerTailRef.current.position.y = innerTailLength / 2;
      innerTailRef.current.scale.set(1, innerTailLength, 1);
    }
  });

  return (
    <>
      <primitive object={orbitLine} />
      <group ref={cometRef}>
        <pointLight color="#D5EEF0" intensity={18} distance={7} decay={2} />

        <mesh>
          <icosahedronGeometry args={[0.24, 2]} />
          <meshBasicMaterial color="#F2F0E7" toneMapped={false} />
        </mesh>
        <mesh scale={2.1} renderOrder={COMET_GLOW_RENDER_ORDER}>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshBasicMaterial
            color="#BFDDE0"
            transparent
            opacity={0.13}
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            stencilWrite
            stencilRef={1}
            stencilFunc={THREE.AlwaysStencilFunc}
            stencilFail={THREE.KeepStencilOp}
            stencilZFail={THREE.ReplaceStencilOp}
            stencilZPass={THREE.ReplaceStencilOp}
          />
        </mesh>

        <mesh ref={outerTailRef} renderOrder={COMET_OUTER_TAIL_RENDER_ORDER}>
          <coneGeometry args={[0.42, 1, 12, 1, true]} />
          <meshBasicMaterial
            color="#A9C8CB"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            stencilWrite
            stencilRef={1}
            stencilFunc={THREE.NotEqualStencilFunc}
            stencilFail={THREE.KeepStencilOp}
            stencilZFail={THREE.KeepStencilOp}
            stencilZPass={THREE.KeepStencilOp}
          />
        </mesh>
        <mesh ref={innerTailRef} renderOrder={COMET_INNER_TAIL_RENDER_ORDER}>
          <coneGeometry args={[0.18, 1, 10, 1, true]} />
          <meshBasicMaterial
            color="#E5E1D4"
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            stencilWrite
            stencilRef={1}
            stencilFunc={THREE.NotEqualStencilFunc}
            stencilFail={THREE.KeepStencilOp}
            stencilZFail={THREE.KeepStencilOp}
            stencilZPass={THREE.KeepStencilOp}
          />
        </mesh>
      </group>
    </>
  );
}

function GasGiant({
  color,
  detail,
  size,
}: {
  color: string;
  detail: 0 | 1 | 2;
  size: number;
}) {
  const material = useMemo(() => {
    const baseColor = new THREE.Color(color);

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: baseColor },
        uCloudColor: {
          value: baseColor.clone().lerp(new THREE.Color('#FFF0C9'), 0.5),
        },
        uSunPosition: { value: SUN_POSITION },
      },
      vertexShader: GAS_GIANT_VERTEX_SHADER,
      fragmentShader: GAS_GIANT_FRAGMENT_SHADER,
    });
  }, [color]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh>
      <icosahedronGeometry args={[size, detail]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

const PLANET_RING_BANDS = [
  {
    innerScale: 1.28,
    outerScale: 1.46,
    color: '#756D5F',
    opacity: 0.34,
  },
  {
    innerScale: 1.51,
    outerScale: 1.72,
    color: '#C1B69C',
    opacity: 0.36,
  },
  {
    innerScale: 1.77,
    outerScale: 1.92,
    color: '#918878',
    opacity: 0.24,
  },
] as const;
const RING_SHADOW_COLOR_SCALE = 0.46;
const RING_SHADOW_SOLID_HALF_WIDTH = 0.78;
const RING_SHADOW_SOFT_HALF_WIDTH = 1.06;

interface PlanetRingBandProps {
  size: number;
  innerScale: number;
  outerScale: number;
  color: string;
  opacity: number;
}

function PlanetRingBand({
  size,
  innerScale,
  outerScale,
  color,
  opacity,
}: PlanetRingBandProps) {
  const geometry = useMemo(() => {
    const ringGeometry = new THREE.RingGeometry(
      size * innerScale,
      size * outerScale,
      256,
      4,
    );
    const positions = ringGeometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const baseColor = new THREE.Color(color);
    const shadowColor = baseColor.clone().multiplyScalar(RING_SHADOW_COLOR_SCALE);
    const vertexColor = new THREE.Color();

    for (let index = 0; index < positions.count; index += 1) {
      const distanceBehindPlanet = positions.getX(index);
      const distanceFromShadowAxis = Math.abs(positions.getY(index));
      const behindPlanet = THREE.MathUtils.smoothstep(
        distanceBehindPlanet,
        0,
        size * 0.16,
      );
      const insideShadow = 1 - THREE.MathUtils.smoothstep(
        distanceFromShadowAxis,
        size * RING_SHADOW_SOLID_HALF_WIDTH,
        size * RING_SHADOW_SOFT_HALF_WIDTH,
      );
      const shadowAmount = behindPlanet * insideShadow;

      vertexColor.copy(baseColor).lerp(shadowColor, shadowAmount);
      vertexColor.toArray(colors, index * 3);
    }

    ringGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3),
    );
    return ringGeometry;
  }, [color, innerScale, outerScale, size]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function PlanetRing({ size }: { size: number }) {
  const ringBandsRef = useRef<THREE.Group>(null);
  const sunInRingSpace = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const ringBands = ringBandsRef.current;
    const ringPlane = ringBands?.parent;
    if (!ringBands || !ringPlane) return;

    sunInRingSpace.copy(SUN_POSITION);
    ringPlane.worldToLocal(sunInRingSpace);
    ringBands.rotation.z = Math.atan2(sunInRingSpace.y, sunInRingSpace.x) + Math.PI;
  });

  return (
    <group
      rotation={[Math.PI / 2, 0, 0]}
      renderOrder={RING_RENDER_ORDER}
    >
      <group ref={ringBandsRef} renderOrder={RING_RENDER_ORDER}>
        {PLANET_RING_BANDS.map((band, index) => (
          <PlanetRingBand
            key={`ring-band-${index}`}
            size={size}
            innerScale={band.innerScale}
            outerScale={band.outerScale}
            color={band.color}
            opacity={band.opacity}
          />
        ))}
      </group>
    </group>
  );
}

interface OrbitalSystemProps extends CanvasSceneProps {
  planetPositions: React.MutableRefObject<THREE.Vector3[]>;
}

function OrbitalSystem({
  activeModule,
  focusedModule,
  setActiveModule,
  setFocusedModule,
  planetPositions,
}: OrbitalSystemProps) {
  const { size } = useThree();
  const gridRef = useRef<THREE.PlaneGeometry>(null);
  const planetGroups = useRef<(THREE.Group | null)[]>([]);
  const planetSpinGroups = useRef<(THREE.Group | null)[]>([]);
  const orbitalTime = useRef(0);
  const orbitScale = useMemo(() => THREE.MathUtils.clamp(size.width / 820, 0.55, 1), [size.width]);
  const gridFadeRange = useMemo(() => {
    const orbitalEnvelope = Math.max(...PLANETS.map((planet) => (
      planet.radius * orbitScale
      + planet.size
        * (planet.hasRings ? 1.92 : 1)
    )));
    const start = Math.min(
      orbitalEnvelope + GRID_ORBIT_PADDING,
      GRID_FADE_END_LIMIT - GRID_FADE_WIDTH,
    );

    return { start, end: start + GRID_FADE_WIDTH };
  }, [orbitScale]);
  const orbitLines = useMemo(() => PLANETS.map(() => {
    const positions = new Float32Array((ORBIT_SEGMENTS + 1) * 3);
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    const material = new LineMaterial({
      color: '#2D2C29',
      linewidth: 1,
      worldUnits: false,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      alphaToCoverage: true,
    });
    const line = new Line2(geometry, material);
    line.frustumCulled = false;
    line.renderOrder = GRID_RENDER_ORDER + 1;
    return { line, positions };
  }), []);
  const gridMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#333333') },
      uOpacity: { value: 0.72 },
      uFadeStart: { value: gridFadeRange.start },
      uFadeEnd: { value: gridFadeRange.end },
    },
    vertexShader: `
      varying float vRadius;

      void main() {
        vRadius = length(position.xy);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uFadeStart;
      uniform float uFadeEnd;
      varying float vRadius;

      void main() {
        float radialFade = 1.0 - smoothstep(uFadeStart, uFadeEnd, vRadius);
        if (radialFade <= 0.01) discard;
        gl_FragColor = vec4(uColor, uOpacity * radialFade);
      }
    `,
    transparent: true,
    wireframe: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  useEffect(() => () => {
    document.body.style.cursor = 'auto';
  }, []);

  useEffect(() => () => gridMaterial.dispose(), [gridMaterial]);

  useEffect(() => {
    gridMaterial.uniforms.uFadeStart.value = gridFadeRange.start;
    gridMaterial.uniforms.uFadeEnd.value = gridFadeRange.end;
  }, [gridFadeRange, gridMaterial]);

  useEffect(() => () => {
    orbitLines.forEach(({ line }) => {
      line.geometry.dispose();
      line.material.dispose();
    });
  }, [orbitLines]);

  useFrame((_, delta) => {
    orbitalTime.current += delta * (activeModule ? 0.08 : 1);
    const elapsed = orbitalTime.current;

    PLANETS.forEach((planet, index) => {
      const angle = elapsed * planet.speed + index * Math.PI * 0.7;
      const radius = planet.radius * orbitScale;
      planetPositions.current[index].set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      );
    });

    PLANETS.forEach((planet, index) => {
      const position = planetPositions.current[index];
      position.y = GRID_BASE_Y
        - getWellDepthAt(position.x, position.z, planetPositions.current)
        + getPlanetCenterOffset(planet.size, planet.hasRings);

      planetGroups.current[index]?.position.copy(position);
      const spinGroup = planetSpinGroups.current[index];
      if (spinGroup) {
        if (planet.planetClass === 'gas-giant') {
          spinGroup.rotation.y += delta * (0.16 + index * 0.02);
        } else {
          spinGroup.rotation.x += delta * (0.18 + index * 0.025);
          spinGroup.rotation.y += delta * (0.34 + index * 0.035);
        }
      }
    });

    const grid = gridRef.current;
    if (grid) {
      const positions = grid.attributes.position;
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        const z = positions.getY(index);
        // With a +90° X rotation, local Y maps directly to world Z and
        // positive local Z maps downward in world Y.
        positions.setZ(index, getWellDepthAt(x, z, planetPositions.current));
      }
      positions.needsUpdate = true;
    }

    PLANETS.forEach((planet, orbitIndex) => {
      const { line: orbitLine, positions } = orbitLines[orbitIndex];
      const material = orbitLine.material;
      const radius = planet.radius * orbitScale;
      const isOrbitSelected = activeModule
        ? activeModule === planet.id
        : focusedModule === planet.id;

      for (let pointIndex = 0; pointIndex <= ORBIT_SEGMENTS; pointIndex += 1) {
        const angle = (pointIndex / ORBIT_SEGMENTS) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = GRID_BASE_Y
          - getWellDepthAt(x, z, planetPositions.current)
          + ORBIT_LINE_GRID_CLEARANCE;
        const positionIndex = pointIndex * 3;
        positions[positionIndex] = x;
        positions[positionIndex + 1] = y;
        positions[positionIndex + 2] = z;
      }

      orbitLine.geometry.setPositions(positions);
      material.color.set(isOrbitSelected ? '#55524C' : '#2D2C29');
      material.linewidth = isOrbitSelected ? 2.5 : 1;
      orbitLine.renderOrder = GRID_RENDER_ORDER + 1;
    });

  });

  const focusPlanet = (id: ModuleId) => {
    setFocusedModule(id);
    document.body.style.cursor = 'pointer';
  };

  const releasePlanet = () => {
    document.body.style.cursor = 'auto';
  };

  return (
    <group>
      <mesh
        rotation={[GRID_ROTATION_X, 0, 0]}
        position={[0, GRID_BASE_Y, 0]}
        renderOrder={GRID_RENDER_ORDER}
      >
        <planeGeometry ref={gridRef} args={[GRID_SIZE, GRID_SIZE, GRID_SEGMENTS, GRID_SEGMENTS]} />
        <primitive object={gridMaterial} attach="material" />
      </mesh>

      {PLANETS.map((planet, index) => (
        <primitive key={`orbit-${planet.id}`} object={orbitLines[index].line} />
      ))}

      <AsteroidBelt orbitScale={orbitScale} planetPositions={planetPositions} />
      <Comet orbitScale={orbitScale} />

      {PLANETS.map((planet, index) => {
        const isFocused = focusedModule === planet.id;
        const isActive = activeModule === planet.id;
        const isSelected = activeModule ? isActive : isFocused;
        const visualRadius = planet.size * (planet.hasRings ? 1.92 : 1);

        return (
          <group
            key={planet.id}
            ref={(element) => {
              planetGroups.current[index] = element;
            }}
            onClick={(event) => {
              event.stopPropagation();
              setFocusedModule(planet.id);
              setActiveModule(isActive ? null : planet.id);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              focusPlanet(planet.id);
            }}
            onPointerOut={(event) => {
              event.stopPropagation();
              releasePlanet();
            }}
          >
            <group
              rotation={[
                0,
                0,
                planet.planetClass === 'gas-giant' ? (index % 2 === 0 ? -0.12 : 0.16) : 0,
              ]}
            >
              <group
                ref={(element) => { planetSpinGroups.current[index] = element; }}
              >
                {planet.planetClass === 'gas-giant' ? (
                  <GasGiant
                    color={planet.color}
                    detail={planet.geometryDetail}
                    size={planet.size}
                  />
                ) : (
                  <mesh>
                    <icosahedronGeometry args={[planet.size, planet.geometryDetail]} />
                    <meshStandardMaterial
                      color={planet.color}
                      emissive={planet.id === 'projects' ? '#4F0D09' : planet.color}
                      emissiveIntensity={0.18}
                      roughness={0.86}
                      metalness={0.03}
                      flatShading
                    />
                  </mesh>
                )}
              </group>

              {planet.hasRings && <PlanetRing size={planet.size} />}
            </group>

            <mesh scale={1.9}>
              <sphereGeometry args={[planet.size, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <SelectionFrame
              visualRadius={visualRadius}
              index={planet.index}
              systemLabel={planet.systemLabel}
              subtitle={planet.subtitle}
              selected={isSelected}
            />
          </group>
        );
      })}
    </group>
  );
}

export default function CanvasScene(props: CanvasSceneProps) {
  const dismissActiveModule = () => props.setActiveModule(null);
  const planetPositions = useRef(PLANETS.map(() => new THREE.Vector3()));
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 28, 43], fov: 44 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, stencil: true }}
        onPointerMissed={dismissActiveModule}
      >
        <ResponsiveCamera />
        <fog attach="fog" args={['#121212', BASE_FOG_NEAR, BASE_FOG_FAR]} />
        <AdaptiveFog />

        <ambientLight intensity={0.72} color="#DED8C4" />
        <directionalLight position={[14, 24, 18]} intensity={2.2} color="#FFF2CE" />
        <directionalLight position={[-16, 9, -20]} intensity={1.1} color="#BE2E21" />

        <OrbitControls
          ref={controlsRef}
          target={[0, -3.5, 0]}
          enableZoom
          enablePan={false}
          enableDamping
          dampingFactor={0.055}
          zoomSpeed={0.7}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.12}
          minDistance={18}
          maxDistance={110}
        />

        <CameraDirector
          activeModule={props.activeModule}
          planetPositions={planetPositions}
          controlsRef={controlsRef}
        />

        <group
          onClick={(event) => {
            event.stopPropagation();
            dismissActiveModule();
          }}
        >
          <OrbitalSystem {...props} planetPositions={planetPositions} />
          <Sun />
        </group>
      </Canvas>
    </div>
  );
}
