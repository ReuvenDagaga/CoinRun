import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export const COIN_SIZE = 1.5;
const ROTATION_SPEED = 2;
const COLLECT_ANIMATION_SPEED = 6;

interface CoinModelProps {
  position: [number, number, number];
  isCollected: boolean;
  onCollectComplete?: () => void;
}

useGLTF.preload('/models/coin.glb');

export default function CoinModel({ position, isCollected, onCollectComplete }: CoinModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const collectProgress = useRef(0);
  const baseY = useRef(position[1]);
  const initialRotation = useRef(Math.random() * Math.PI * 2);
  const scaleRef = useRef(1);

  const { scene } = useGLTF('/models/coin.glb');

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
          const originalMat = child.material as THREE.MeshStandardMaterial;
          const newMat = originalMat.clone();
          newMat.emissive = new THREE.Color('#FFaa00');
          newMat.emissiveIntensity = 1;
          child.material = newMat;
        }
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    if (groupRef.current) {
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      scaleRef.current = COIN_SIZE / maxDim;
      groupRef.current.scale.setScalar(scaleRef.current);
    }
  }, [clonedScene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isCollected) {
      collectProgress.current += delta * COLLECT_ANIMATION_SPEED;
      const progress = Math.min(collectProgress.current, 1);

      const scale = Math.max(0, scaleRef.current * (1 - progress));
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.y = baseY.current + progress * 3;
      groupRef.current.rotation.y += delta * 20;

      if (progress >= 1 && onCollectComplete) {
        onCollectComplete();
      }
      return;
    }

    groupRef.current.rotation.y = initialRotation.current + state.clock.elapsedTime * ROTATION_SPEED;

    const bobOffset = Math.sin(state.clock.elapsedTime * 3 + position[2] * 0.1) * 0.1;
    groupRef.current.position.y = baseY.current + bobOffset;
  });

  if (isCollected && collectProgress.current >= 1) {
    return null;
  }

  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1], position[2]]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}