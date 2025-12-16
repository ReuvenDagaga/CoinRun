import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

export type AnimationState = 'idle' | 'walking' | 'jogging' | 'running' | 'sprinting';

export interface CharacterModelRef {
  setAnimation: (state: AnimationState) => void;
  group: THREE.Group | null;
}

interface CharacterModelProps {
  skinId?: string;
  animation?: AnimationState;
  scale?: number;
}

const ANIMATION_MAP: Record<AnimationState, string> = {
  idle: 'Axe_Stance',
  walking: 'Walking',
  jogging: 'Running',
  running: 'Running',
  sprinting: 'RunFast',
};

const MODEL_PATH = '/models/base_character.glb';

useGLTF.preload(MODEL_PATH);

const CharacterModel = forwardRef<CharacterModelRef, CharacterModelProps>(
  ({ animation = 'running', scale = 100 }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const currentAnimation = useRef<AnimationState>(animation);
    const modelRef = useRef<THREE.Group | null>(null);

    const { scene, animations } = useGLTF(MODEL_PATH);
    const { actions, mixer } = useAnimations(animations, groupRef);

    useEffect(() => {
      if (!groupRef.current || modelRef.current) return;

      const clone = scene.clone(true);
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#ff6600',
            metalness: 0.1,
            roughness: 0.8,
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelRef.current = clone;
      groupRef.current.add(clone);

      return () => {
        if (groupRef.current && modelRef.current) {
          groupRef.current.remove(modelRef.current);
          modelRef.current = null;
        }
      };
    }, [scene]);

    useEffect(() => {
      const animationName = ANIMATION_MAP[animation];
      const action = actions[animationName];

      if (action) {
        Object.values(actions).forEach((a) => a?.fadeOut(0.2));
        action.reset().fadeIn(0.2).play();
        currentAnimation.current = animation;
      }
    }, [animation, actions]);

    useImperativeHandle(ref, () => ({
      setAnimation: (state: AnimationState) => {
        const animationName = ANIMATION_MAP[state];
        const action = actions[animationName];

        if (action && currentAnimation.current !== state) {
          Object.values(actions).forEach((a) => a?.fadeOut(0.2));
          action.reset().fadeIn(0.2).play();
          currentAnimation.current = state;
        }
      },
      group: groupRef.current,
    }));

    useFrame((_, delta) => {
      mixer?.update(delta);
    });

    return <group ref={groupRef} scale={scale} />;
  }
);

CharacterModel.displayName = 'CharacterModel';

export default CharacterModel;