import { useRef, memo, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useGame } from '@/context';
import {
  SimpleGateType,
  GateData,
  GATE_CONFIGS,
  GATE_WIDTH,
  GATE_HEIGHT,
} from './types';
import { GROUND_Y } from '../../Player';

const PILLAR_WIDTH = 0.5;
const PILLAR_DEPTH = 0.5;

// New tighter, organic formation constants (must match ArmyFollowers.tsx)
const SOLDIERS_PER_ROW = 3;
const SPACING_X = 0.8; // Reduced from 1.2 - much tighter
const SPACING_Z = 1.0; // Reduced from 1.5 - closer together
const BACK_OFFSET = -1.5; // Closer to player

// Seeded random for consistent randomization per soldier
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Pre-computed triggered state colors
const TRIGGERED_COLORS = {
  pillar: new THREE.Color('#333333'),
  pillarEmissive: new THREE.Color('#111111'),
  pillarCap: new THREE.Color('#222222'),
  portal: new THREE.Color('#222222'),
  portalEmissive: new THREE.Color('#111111'),
  ring: new THREE.Color('#444444'),
  ringEmissive: new THREE.Color('#222222'),
  ground: new THREE.Color('#333333'),
  text: '#666666',
};

function getArmyPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; z: number } {
  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;

  // Base position in tighter grid
  const baseXOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const baseZOffset = BACK_OFFSET - row * SPACING_Z;

  // Add seeded random offsets for organic feel (must match ArmyFollowers.tsx)
  const seedX = index * 7 + 13;
  const seedZ = index * 11 + 17;
  const randomXOffset = (seededRandom(seedX) - 0.5) * 0.6; // ±0.3 units
  const randomZOffset = (seededRandom(seedZ) - 0.5) * 0.4; // ±0.2 units

  // Soldiers closer to front are more centered, back rows spread wider
  const rowSpreadMultiplier = 1 + row * 0.1;
  const adjustedXOffset = baseXOffset * rowSpreadMultiplier;

  return {
    x: playerX + adjustedXOffset + randomXOffset,
    z: playerZ + baseZOffset + randomZOffset,
  };
}

interface GateProps {
  gateId: string;
  gateType: SimpleGateType;
  gateX: number;
  gateZ: number;
  onTrigger: (gateId: string, gateType: SimpleGateType) => void;
  armySize: number;
  playerX: number;
  playerZ: number;
  status: string;
}

// Use primitive props to ensure memo works correctly
const SingleGate = memo(function SingleGate({
  gateId,
  gateType,
  gateX,
  gateZ,
  onTrigger,
  armySize,
  playerX,
  playerZ,
  status
}: GateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isTriggeredRef = useRef(false);

  // Refs for all meshes to mutate materials directly
  const leftPillarRef = useRef<THREE.Mesh>(null);
  const rightPillarRef = useRef<THREE.Mesh>(null);
  const leftCapBottomRef = useRef<THREE.Mesh>(null);
  const leftCapTopRef = useRef<THREE.Mesh>(null);
  const rightCapBottomRef = useRef<THREE.Mesh>(null);
  const rightCapTopRef = useRef<THREE.Mesh>(null);
  const portalRef = useRef<THREE.Mesh>(null);
  const glowPlane1Ref = useRef<THREE.Mesh>(null);
  const glowPlane2Ref = useRef<THREE.Mesh>(null);
  const groundPlaneRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);
  const light3Ref = useRef<THREE.PointLight>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);

  const config = GATE_CONFIGS[gateType];
  const triggeredOpacity = 0.25;
  const baseY = GROUND_Y;
  const halfWidth = GATE_WIDTH / 2;
  const pillarX = halfWidth - PILLAR_WIDTH / 2;

  // Create materials ONCE with empty dependency - never recreate
  const materials = useMemo(() => {
    const baseColor = new THREE.Color(config.color);

    return {
      pillar: new THREE.MeshStandardMaterial({
        color: baseColor.clone(),
        emissive: baseColor.clone(),
        emissiveIntensity: config.emissiveIntensity * 0.5,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true,
        opacity: 1,
      }),
      pillarCap: new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 1,
      }),
      portal: new THREE.MeshStandardMaterial({
        color: baseColor.clone(),
        emissive: baseColor.clone(),
        emissiveIntensity: config.emissiveIntensity * 0.3,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      }),
      ring: new THREE.MeshStandardMaterial({
        color: baseColor.clone(),
        emissive: baseColor.clone(),
        emissiveIntensity: config.emissiveIntensity,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 1,
      }),
      glowPlane: new THREE.MeshBasicMaterial({
        color: baseColor.clone(),
        transparent: true,
        opacity: 0.1,
      }),
      groundPlane: new THREE.MeshBasicMaterial({
        color: baseColor.clone(),
        transparent: true,
        opacity: 0.35,
      }),
      // Store original values for restoration if needed
      _originalColor: baseColor.clone(),
      _originalEmissiveIntensity: config.emissiveIntensity,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - materials created once per gate instance

  // Set initial colors based on config (runs once after mount)
  useEffect(() => {
    const baseColor = new THREE.Color(config.color);
    materials.pillar.color.copy(baseColor);
    materials.pillar.emissive.copy(baseColor);
    materials.portal.color.copy(baseColor);
    materials.portal.emissive.copy(baseColor);
    materials.ring.color.copy(baseColor);
    materials.ring.emissive.copy(baseColor);
    materials.glowPlane.color.copy(baseColor);
    materials.groundPlane.color.copy(baseColor);
    materials._originalColor.copy(baseColor);
    materials._originalEmissiveIntensity = config.emissiveIntensity;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.color, config.emissiveIntensity]);

  useFrame((state) => {
    if (!groupRef.current || status !== 'playing') return;

    // Check collision only if not triggered
    if (!isTriggeredRef.current) {
      const checkCollision = (posX: number, posZ: number): boolean => {
        const distX = Math.abs(posX - gateX);
        const distZ = Math.abs(posZ - gateZ);
        return distX < GATE_WIDTH / 2 && distZ < 1.5;
      };

      let triggered = false;

      if (checkCollision(playerX, playerZ)) {
        triggered = true;
      } else {
        for (let i = 0; i < armySize; i++) {
          const soldierPos = getArmyPosition(i, playerX, playerZ);
          if (checkCollision(soldierPos.x, soldierPos.z)) {
            triggered = true;
            break;
          }
        }
      }

      if (triggered) {
        isTriggeredRef.current = true;

        // Mutate materials directly - no React re-render, no material swap
        // This is the key fix: mutate existing materials instead of swapping
        materials.pillar.color.copy(TRIGGERED_COLORS.pillar);
        materials.pillar.emissive.copy(TRIGGERED_COLORS.pillarEmissive);
        materials.pillar.emissiveIntensity = 0.1;
        materials.pillar.opacity = triggeredOpacity;

        materials.pillarCap.color.copy(TRIGGERED_COLORS.pillarCap);
        materials.pillarCap.opacity = triggeredOpacity;

        materials.portal.color.copy(TRIGGERED_COLORS.portal);
        materials.portal.emissive.copy(TRIGGERED_COLORS.portalEmissive);
        materials.portal.emissiveIntensity = 0.05;
        materials.portal.opacity = 0.1;

        materials.ring.color.copy(TRIGGERED_COLORS.ring);
        materials.ring.emissive.copy(TRIGGERED_COLORS.ringEmissive);
        materials.ring.emissiveIntensity = 0.1;
        materials.ring.opacity = triggeredOpacity;

        materials.glowPlane.opacity = 0; // Hide glow planes
        materials.groundPlane.color.copy(TRIGGERED_COLORS.ground);
        materials.groundPlane.opacity = 0.1;

        // Dim lights instead of removing them
        if (light1Ref.current) light1Ref.current.intensity = 0;
        if (light2Ref.current) light2Ref.current.intensity = 0;
        if (light3Ref.current) light3Ref.current.intensity = 0;

        // Update text via ref if available
        if (textRef.current) {
          textRef.current.color = TRIGGERED_COLORS.text;
          textRef.current.fillOpacity = triggeredOpacity;
        }

        // Trigger callback
        onTrigger(gateId, gateType);
        return;
      }

      // Animate when not triggered
      const time = state.clock.elapsedTime;
      const pulse = 0.35 + Math.sin(time * 2.5) * 0.15;
      materials.portal.opacity = pulse;

      const glow = materials._originalEmissiveIntensity * 0.5 + Math.sin(time * 3) * 0.2;
      materials.pillar.emissiveIntensity = glow;
    }
  });

  return (
    <group ref={groupRef} position={[gateX, 0, gateZ]}>
      {/* Left pillar group */}
      <group position={[-pillarX, baseY, 0]}>
        <mesh
          ref={leftPillarRef}
          position={[0, GATE_HEIGHT / 2, 0]}
          material={materials.pillar}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, PILLAR_DEPTH]} />
        </mesh>

        <mesh ref={leftCapBottomRef} position={[0, 0.1, 0]} material={materials.pillarCap}>
          <boxGeometry args={[PILLAR_WIDTH + 0.2, 0.2, PILLAR_DEPTH + 0.2]} />
        </mesh>

        <mesh ref={leftCapTopRef} position={[0, GATE_HEIGHT + 0.1, 0]} material={materials.pillarCap}>
          <boxGeometry args={[PILLAR_WIDTH + 0.2, 0.2, PILLAR_DEPTH + 0.2]} />
        </mesh>

        {[0.25, 0.5, 0.75].map((heightRatio, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) ringRefs.current[i] = el; }}
            position={[0, GATE_HEIGHT * heightRatio, PILLAR_DEPTH / 2 + 0.05]}
            material={materials.ring}
          >
            <boxGeometry args={[PILLAR_WIDTH - 0.1, 0.15, 0.1]} />
          </mesh>
        ))}
      </group>

      {/* Right pillar group */}
      <group position={[pillarX, baseY, 0]}>
        <mesh
          ref={rightPillarRef}
          position={[0, GATE_HEIGHT / 2, 0]}
          material={materials.pillar}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, PILLAR_DEPTH]} />
        </mesh>

        <mesh ref={rightCapBottomRef} position={[0, 0.1, 0]} material={materials.pillarCap}>
          <boxGeometry args={[PILLAR_WIDTH + 0.2, 0.2, PILLAR_DEPTH + 0.2]} />
        </mesh>

        <mesh ref={rightCapTopRef} position={[0, GATE_HEIGHT + 0.1, 0]} material={materials.pillarCap}>
          <boxGeometry args={[PILLAR_WIDTH + 0.2, 0.2, PILLAR_DEPTH + 0.2]} />
        </mesh>

        {[0.25, 0.5, 0.75].map((heightRatio, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) ringRefs.current[i + 3] = el; }}
            position={[0, GATE_HEIGHT * heightRatio, PILLAR_DEPTH / 2 + 0.05]}
            material={materials.ring}
          >
            <boxGeometry args={[PILLAR_WIDTH - 0.1, 0.15, 0.1]} />
          </mesh>
        ))}
      </group>

      {/* Portal */}
      <mesh
        ref={portalRef}
        position={[0, baseY + GATE_HEIGHT / 2, 0]}
        material={materials.portal}
      >
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH * 2, GATE_HEIGHT - 0.3]} />
      </mesh>

      {/* Glow planes - always mounted, opacity controlled via material */}
      <mesh ref={glowPlane1Ref} position={[0, baseY + GATE_HEIGHT / 2, 0.01]} material={materials.glowPlane}>
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH * 2 - 0.2, GATE_HEIGHT - 0.5]} />
      </mesh>
      <mesh ref={glowPlane2Ref} position={[0, baseY + GATE_HEIGHT / 2, -0.01]} material={materials.glowPlane}>
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH * 2 - 0.2, GATE_HEIGHT - 0.5]} />
      </mesh>

      {/* Text - use ref for direct updates */}
      <Text
        ref={textRef}
        position={[0, baseY + GATE_HEIGHT / 2, 0.2]}
        fontSize={0.9}
        maxWidth={GATE_WIDTH - PILLAR_WIDTH * 2 - 0.5}
        textAlign="center"
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#000000"
        rotation={[0, Math.PI, 0]}
        fillOpacity={1}
        letterSpacing={0.02}
        lineHeight={1.2}
        font="/fonts/LilitaOne-Regular.ttf"
      >
        {config.label}
      </Text>

      {/* Ground plane */}
      <mesh
        ref={groundPlaneRef}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.groundPlane}
      >
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH, 2]} />
      </mesh>

      {/* Point lights - always mounted, intensity controlled */}
      <pointLight
        ref={light1Ref}
        position={[0, baseY + GATE_HEIGHT / 2, 1]}
        color={config.color}
        intensity={2}
        distance={8}
      />
      <pointLight
        ref={light2Ref}
        position={[-pillarX, baseY + GATE_HEIGHT, 0.5]}
        color={config.color}
        intensity={0.8}
        distance={4}
      />
      <pointLight
        ref={light3Ref}
        position={[pillarX, baseY + GATE_HEIGHT, 0.5]}
        color={config.color}
        intensity={0.8}
        distance={4}
      />
    </group>
  );
});

interface GatesProps {
  gates: GateData[];
  onGateTrigger: (gateId: string, gateType: SimpleGateType) => void;
  armySize: number;
}

export const GatesRenderer = memo(function GatesRenderer({
  gates,
  onGateTrigger,
  armySize,
}: GatesProps) {
  const { player, status } = useGame();

  return (
    <group>
      {gates.map((gate) => (
        <SingleGate
          key={gate.id}
          gateId={gate.id}
          gateType={gate.type}
          gateX={gate.position.x}
          gateZ={gate.position.z}
          onTrigger={onGateTrigger}
          armySize={armySize}
          playerX={player.position.x}
          playerZ={player.position.z}
          status={status}
        />
      ))}
    </group>
  );
});

export default GatesRenderer;
