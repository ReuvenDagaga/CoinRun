import { useRef, memo, useMemo } from 'react';
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

const SOLDIERS_PER_ROW = 3;
const SPACING_X = 1.2;
const SPACING_Z = 1.5;
const BACK_OFFSET = -2.0;

function getArmyPosition(
  index: number,
  playerX: number,
  playerZ: number
): { x: number; z: number } {
  const row = Math.floor(index / SOLDIERS_PER_ROW);
  const col = index % SOLDIERS_PER_ROW;
  const xOffset = (col - (SOLDIERS_PER_ROW - 1) / 2) * SPACING_X;
  const zOffset = BACK_OFFSET - row * SPACING_Z;

  return {
    x: playerX + xOffset,
    z: playerZ + zOffset,
  };
}

interface GateProps {
  gate: GateData;
  onTrigger: (gateId: string, gateType: SimpleGateType) => void;
  armySize: number;
}

const SingleGate = memo(function SingleGate({ gate, onTrigger, armySize }: GateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);
  const leftPillarRef = useRef<THREE.Mesh>(null);
  const rightPillarRef = useRef<THREE.Mesh>(null);
  const isTriggeredRef = useRef(false);

  const { player, status } = useGame();
  const config = GATE_CONFIGS[gate.type];

  const isTriggered = gate.isTriggered || isTriggeredRef.current;
  const triggeredOpacity = 0.25;

  const pillarMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isTriggered ? '#333333' : config.color,
        emissive: isTriggered ? '#111111' : config.color,
        emissiveIntensity: isTriggered ? 0.1 : config.emissiveIntensity * 0.5,
        metalness: 0.7,
        roughness: 0.2,
        transparent: isTriggered,
        opacity: isTriggered ? triggeredOpacity : 1,
      }),
    [config.color, config.emissiveIntensity, isTriggered]
  );

  const pillarCapMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isTriggered ? '#222222' : '#1a1a1a',
        metalness: 0.9,
        roughness: 0.1,
        transparent: isTriggered,
        opacity: isTriggered ? triggeredOpacity : 1,
      }),
    [isTriggered]
  );

  const portalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isTriggered ? '#222222' : config.color,
        emissive: isTriggered ? '#111111' : config.color,
        emissiveIntensity: isTriggered ? 0.05 : config.emissiveIntensity * 0.3,
        transparent: true,
        opacity: isTriggered ? 0.1 : 0.4,
        side: THREE.DoubleSide,
      }),
    [config.color, config.emissiveIntensity, isTriggered]
  );

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isTriggered ? '#444444' : config.color,
        emissive: isTriggered ? '#222222' : config.color,
        emissiveIntensity: isTriggered ? 0.1 : config.emissiveIntensity,
        metalness: 0.8,
        roughness: 0.2,
        transparent: isTriggered,
        opacity: isTriggered ? triggeredOpacity : 1,
      }),
    [config.color, config.emissiveIntensity, isTriggered]
  );

  useFrame((state) => {
    if (!groupRef.current || isTriggeredRef.current || status !== 'playing') return;

    const gateX = gate.position.x;
    const gateZ = gate.position.z;
    const playerX = player.position.x;
    const playerZ = player.position.z;

    const checkCollision = (posX: number, posZ: number): boolean => {
      const distX = Math.abs(posX - gateX);
      const distZ = Math.abs(posZ - gateZ);
      return distX < GATE_WIDTH / 2 && distZ < 1.5;
    };

    if (checkCollision(playerX, playerZ)) {
      isTriggeredRef.current = true;
      onTrigger(gate.id, gate.type);
      return;
    }

    for (let i = 0; i < armySize; i++) {
      const soldierPos = getArmyPosition(i, playerX, playerZ);
      if (checkCollision(soldierPos.x, soldierPos.z)) {
        isTriggeredRef.current = true;
        onTrigger(gate.id, gate.type);
        return;
      }
    }

    if (!isTriggered) {
      const time = state.clock.elapsedTime;

      if (portalRef.current) {
        const pulse = 0.35 + Math.sin(time * 2.5) * 0.15;
        (portalRef.current.material as THREE.MeshStandardMaterial).opacity = pulse;
      }

      if (leftPillarRef.current && rightPillarRef.current) {
        const glow = config.emissiveIntensity * 0.5 + Math.sin(time * 3) * 0.2;
        (leftPillarRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
        (rightPillarRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
      }
    }
  });

  const baseY = GROUND_Y;
  const halfWidth = GATE_WIDTH / 2;
  const pillarX = halfWidth - PILLAR_WIDTH / 2;

  return (
    <group
      ref={groupRef}
      position={[gate.position.x, 0, gate.position.z]}
    >
      <group position={[-pillarX, baseY, 0]}>
        <mesh
          ref={leftPillarRef}
          position={[0, GATE_HEIGHT / 2, 0]}
          material={pillarMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, PILLAR_DEPTH]} />
        </mesh>

        <mesh position={[0, 0.1, 0]} material={pillarCapMaterial}>
          <boxGeometry args={[PILLAR_WIDTH + 0.2, 0.2, PILLAR_DEPTH + 0.2]} />
        </mesh>

        <mesh position={[0, GATE_HEIGHT + 0.1, 0]} material={pillarCapMaterial}>
          <boxGeometry args={[PILLAR_WIDTH + 0.2, 0.2, PILLAR_DEPTH + 0.2]} />
        </mesh>

        {[0.25, 0.5, 0.75].map((heightRatio, i) => (
          <mesh
            key={i}
            position={[0, GATE_HEIGHT * heightRatio, PILLAR_DEPTH / 2 + 0.05]}
            material={ringMaterial}
          >
            <boxGeometry args={[PILLAR_WIDTH - 0.1, 0.15, 0.1]} />
          </mesh>
        ))}
      </group>

      <group position={[pillarX, baseY, 0]}>
        <mesh
          ref={rightPillarRef}
          position={[0, GATE_HEIGHT / 2, 0]}
          material={pillarMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[PILLAR_WIDTH, GATE_HEIGHT, PILLAR_DEPTH]} />
        </mesh>

        <mesh position={[0, 0.1, 0]} material={pillarCapMaterial}>
          <boxGeometry args={[PILLAR_WIDTH + 0.2, 0.2, PILLAR_DEPTH + 0.2]} />
        </mesh>

        <mesh position={[0, GATE_HEIGHT + 0.1, 0]} material={pillarCapMaterial}>
          <boxGeometry args={[PILLAR_WIDTH + 0.2, 0.2, PILLAR_DEPTH + 0.2]} />
        </mesh>

        {[0.25, 0.5, 0.75].map((heightRatio, i) => (
          <mesh
            key={i}
            position={[0, GATE_HEIGHT * heightRatio, PILLAR_DEPTH / 2 + 0.05]}
            material={ringMaterial}
          >
            <boxGeometry args={[PILLAR_WIDTH - 0.1, 0.15, 0.1]} />
          </mesh>
        ))}
      </group>

      <mesh
        ref={portalRef}
        position={[0, baseY + GATE_HEIGHT / 2, 0]}
        material={portalMaterial}
      >
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH * 2, GATE_HEIGHT - 0.3]} />
      </mesh>

      {!isTriggered && (
        <>
          <mesh position={[0, baseY + GATE_HEIGHT / 2, 0.01]}>
            <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH * 2 - 0.2, GATE_HEIGHT - 0.5]} />
            <meshBasicMaterial color={config.color} transparent opacity={0.1} />
          </mesh>
          <mesh position={[0, baseY + GATE_HEIGHT / 2, -0.01]}>
            <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH * 2 - 0.2, GATE_HEIGHT - 0.5]} />
            <meshBasicMaterial color={config.color} transparent opacity={0.1} />
          </mesh>
        </>
      )}

      <Text
        position={[0, baseY + GATE_HEIGHT / 2, 0.2]}
        fontSize={0.9}
        maxWidth={GATE_WIDTH - PILLAR_WIDTH * 2 - 0.5}
        textAlign="center"
        color={isTriggered ? '#666666' : '#FFFFFF'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#000000"
        rotation={[0, Math.PI, 0]}
        fillOpacity={isTriggered ? triggeredOpacity : 1}
        letterSpacing={0.02}
        lineHeight={1.2}
        font="/fonts/LilitaOne-Regular.ttf"
      >
        {config.label}
      </Text>

      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[GATE_WIDTH - PILLAR_WIDTH, 2]} />
        <meshBasicMaterial
          color={isTriggered ? '#333333' : config.color}
          transparent
          opacity={isTriggered ? 0.1 : 0.35}
        />
      </mesh>

      {!isTriggered && (
        <>
          <pointLight
            position={[0, baseY + GATE_HEIGHT / 2, 1]}
            color={config.color}
            intensity={2}
            distance={8}
          />
          <pointLight
            position={[-pillarX, baseY + GATE_HEIGHT, 0.5]}
            color={config.color}
            intensity={0.8}
            distance={4}
          />
          <pointLight
            position={[pillarX, baseY + GATE_HEIGHT, 0.5]}
            color={config.color}
            intensity={0.8}
            distance={4}
          />
        </>
      )}
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
  return (
    <group>
      {gates.map((gate) => (
        <SingleGate
          key={gate.id}
          gate={gate}
          onTrigger={onGateTrigger}
          armySize={armySize}
        />
      ))}
    </group>
  );
});

export default GatesRenderer;