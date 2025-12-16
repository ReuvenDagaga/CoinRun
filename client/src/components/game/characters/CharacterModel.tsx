import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Clone } from '@react-three/drei';
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
  ({ animation = 'running', scale = 1 }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const currentAnimation = useRef<AnimationState>(animation);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});

    const gltf = useGLTF(MODEL_PATH);

    // Setup mixer on the original scene (drei's Clone will handle the cloning)
    useEffect(() => {
      if (!groupRef.current) return;

      // Find the cloned scene inside our group
      const clonedScene = groupRef.current.children[0];
      if (!clonedScene) return;

      console.log('[CharacterModel] Setting up mixer on:', clonedScene);

      const mixer = new THREE.AnimationMixer(clonedScene);
      mixerRef.current = mixer;

      const actions: Record<string, THREE.AnimationAction> = {};
      gltf.animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
      });
      actionsRef.current = actions;

      // Play initial animation
      const initialAnim = ANIMATION_MAP[animation];
      if (actions[initialAnim]) {
        actions[initialAnim].play();
        console.log('[CharacterModel] Playing:', initialAnim);
      }

      return () => {
        mixer.stopAllAction();
        mixerRef.current = null;
        actionsRef.current = {};
      };
    }, [gltf, animation]);

    // Animation changes
    useEffect(() => {
      const actions = actionsRef.current;
      const animationName = ANIMATION_MAP[animation];
      const action = actions[animationName];

      if (action && currentAnimation.current !== animation) {
        Object.values(actions).forEach((a) => a?.fadeOut(0.2));
        action.reset().fadeIn(0.2).play();
        currentAnimation.current = animation;
      }
    }, [animation]);

    useImperativeHandle(ref, () => ({
      setAnimation: (state: AnimationState) => {
        const actions = actionsRef.current;
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
      mixerRef.current?.update(delta);
    });

    return (
      <group ref={groupRef} scale={scale}>
        <Clone object={gltf.scene} />
      </group>
    );
  }
);

CharacterModel.displayName = 'CharacterModel';

export default CharacterModel;
