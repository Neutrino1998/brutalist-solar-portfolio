import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ModuleId } from '../types';
import { PLANETS } from '../data';

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
const SUN_WELL_DEPTH = 7.2;

function getWellDepthAt(x: number, z: number, planetPositions: readonly THREE.Vector3[]) {
  let depth = SUN_WELL_DEPTH * Math.exp(-(x * x + z * z) * 0.018);

  planetPositions.forEach((position, index) => {
    const dx = x - position.x;
    const dz = z - position.z;
    const size = PLANETS[index].size;
    depth += size * 2.45 * Math.exp(-(dx * dx + dz * dz) * 0.12);
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

function Sun() {
  const coreRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const sunY = GRID_BASE_Y - SUN_WELL_DEPTH + SUN_RADIUS * 0.74;
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
    <group position={[0, sunY, 0]}>
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

      <Html position={[0, SUN_RADIUS + 1.1, 0]} center distanceFactor={18} zIndexRange={[8, 0]}>
        <div className="pointer-events-none flex items-center gap-2 whitespace-nowrap text-[#DED8C4]">
          <span className="grid h-7 w-7 rotate-45 place-items-center bg-[#DED8C4] text-[#121212]">
            <span className="-rotate-45 text-[9px] font-black">00</span>
          </span>
          <span>
            <span className="block text-[8px] font-black uppercase tracking-[0.22em] text-[#BE2E21]">Primary core</span>
            <span className="block text-sm font-black italic uppercase leading-none">Solar node</span>
          </span>
        </div>
      </Html>
    </group>
  );
}

interface OrbitalSystemProps extends CanvasSceneProps {}

function OrbitalSystem({
  activeModule,
  focusedModule,
  setActiveModule,
  setFocusedModule,
}: OrbitalSystemProps) {
  const { size } = useThree();
  const gridRef = useRef<THREE.PlaneGeometry>(null);
  const planetGroups = useRef<(THREE.Group | null)[]>([]);
  const planetMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const planetPositions = useRef(PLANETS.map(() => new THREE.Vector3()));
  const hoveredModule = useRef<ModuleId | null>(null);
  const lastNearest = useRef<ModuleId | null>(null);
  const orbitScale = useMemo(() => THREE.MathUtils.clamp(size.width / 820, 0.55, 1), [size.width]);
  const orbitLineObjects = useMemo(() => PLANETS.map(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array((ORBIT_SEGMENTS + 1) * 3), 3),
    );
    const material = new THREE.LineBasicMaterial({
      color: '#625F57',
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    return line;
  }), []);
  const gridMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#333333') },
      uOpacity: { value: 0.72 },
      uFadeStart: { value: 29 },
      uFadeEnd: { value: 39 },
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

  useEffect(() => () => {
    orbitLineObjects.forEach((line) => {
      line.geometry.dispose();
      (line.material as THREE.LineBasicMaterial).dispose();
    });
  }, [orbitLineObjects]);

  useFrame(({ camera, clock }, delta) => {
    const elapsed = clock.getElapsedTime();

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
      position.y = GRID_BASE_Y - getWellDepthAt(position.x, position.z, planetPositions.current) + planet.size * 0.72;

      planetGroups.current[index]?.position.copy(position);
      const planetMesh = planetMeshes.current[index];
      if (planetMesh) {
        planetMesh.rotation.x += delta * (0.28 + index * 0.03);
        planetMesh.rotation.y += delta * (0.42 + index * 0.04);
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
      const orbitLine = orbitLineObjects[orbitIndex];
      const positions = orbitLine.geometry.getAttribute('position') as THREE.BufferAttribute;
      const material = orbitLine.material as THREE.LineBasicMaterial;
      const radius = planet.radius * orbitScale;

      for (let pointIndex = 0; pointIndex <= ORBIT_SEGMENTS; pointIndex += 1) {
        const angle = (pointIndex / ORBIT_SEGMENTS) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = GRID_BASE_Y - getWellDepthAt(x, z, planetPositions.current) + planet.size * 0.72;
        positions.setXYZ(pointIndex, x, y, z);
      }

      positions.needsUpdate = true;
      material.color.set(focusedModule === planet.id ? '#DED8C4' : '#625F57');
      material.opacity = focusedModule === planet.id ? 0.62 : 0.2;
    });

    if (!activeModule && !hoveredModule.current) {
      let nearestId = PLANETS[0].id;
      let nearestDistance = Number.POSITIVE_INFINITY;

      planetPositions.current.forEach((position, index) => {
        const distance = camera.position.distanceToSquared(position);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = PLANETS[index].id;
        }
      });

      if (nearestId !== lastNearest.current) {
        lastNearest.current = nearestId;
        setFocusedModule(nearestId);
      }
    }
  });

  const focusPlanet = (id: ModuleId) => {
    hoveredModule.current = id;
    lastNearest.current = null;
    setFocusedModule(id);
    document.body.style.cursor = 'pointer';
  };

  const releasePlanet = () => {
    hoveredModule.current = null;
    lastNearest.current = null;
    document.body.style.cursor = 'auto';
  };

  return (
    <group>
      <mesh rotation={[GRID_ROTATION_X, 0, 0]} position={[0, GRID_BASE_Y, 0]}>
        <planeGeometry ref={gridRef} args={[80, 80, 72, 72]} />
        <primitive object={gridMaterial} attach="material" />
      </mesh>

      {PLANETS.map((planet, index) => (
        <primitive key={`orbit-${planet.id}`} object={orbitLineObjects[index]} />
      ))}

      {PLANETS.map((planet, index) => {
        const isFocused = focusedModule === planet.id;
        const isActive = activeModule === planet.id;

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
            <mesh ref={(element) => { planetMeshes.current[index] = element; }} scale={isFocused || isActive ? 1.13 : 1}>
              <icosahedronGeometry args={[planet.size, index === 1 ? 1 : 0]} />
              <meshStandardMaterial
                color={planet.color}
                emissive={planet.id === 'projects' ? '#4F0D09' : planet.color}
                emissiveIntensity={isFocused || isActive ? (planet.id === 'projects' ? 0.65 : 1.1) : 0.28}
                roughness={0.48}
                metalness={0.08}
              />
            </mesh>

            <mesh scale={1.9}>
              <sphereGeometry args={[planet.size, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {(isFocused || isActive) && (
              <>
                <mesh rotation={[Math.PI / 2.6, 0, index * 0.7]}>
                  <torusGeometry args={[planet.size * 1.58, 0.035, 8, 72]} />
                  <meshBasicMaterial color="#DED8C4" transparent opacity={0.82} depthWrite={false} />
                </mesh>
                <mesh scale={1.42} rotation={[0, index * 0.6, 0]}>
                  <icosahedronGeometry args={[planet.size, 1]} />
                  <meshBasicMaterial color="#DED8C4" wireframe transparent opacity={0.32} depthWrite={false} />
                </mesh>
                <pointLight color={planet.color} intensity={32} distance={9} decay={2} />
              </>
            )}

            <Html position={[0, planet.size + 1.35, 0]} center distanceFactor={18} zIndexRange={[7, 0]}>
              <div className={`pointer-events-none flex items-center gap-2 whitespace-nowrap transition-opacity ${isFocused || isActive ? 'opacity-100' : 'opacity-50'}`}>
                <span className={`grid h-7 w-7 rotate-45 place-items-center border ${isFocused || isActive ? 'border-[#DED8C4] bg-[#DED8C4] text-[#121212]' : 'border-[#DED8C4]/60 bg-[#121212]/70 text-[#DED8C4]'}`}>
                  <span className="-rotate-45 text-[9px] font-black">{planet.index}</span>
                </span>
                <span>
                  <span className="block text-[7px] font-black uppercase tracking-[0.2em] text-[#BE2E21]">{planet.systemLabel}</span>
                  <span className="block text-xs font-black italic uppercase leading-none text-[#DED8C4]">{planet.subtitle}</span>
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function CanvasScene(props: CanvasSceneProps) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 28, 43], fov: 44 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <ResponsiveCamera />
        <fog attach="fog" args={['#121212', 42, 105]} />

        <ambientLight intensity={0.72} color="#DED8C4" />
        <directionalLight position={[14, 24, 18]} intensity={2.2} color="#FFF2CE" />
        <directionalLight position={[-16, 9, -20]} intensity={1.1} color="#BE2E21" />

        <OrbitControls
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

        <OrbitalSystem {...props} />
        <Sun />
      </Canvas>
    </div>
  );
}
