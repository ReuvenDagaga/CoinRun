import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
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
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
    const [clonedScene, setClonedScene] = useState<THREE.Object3D | null>(null);

    const { scene, animations } = useGLTF(MODEL_PATH);

    // Clone scene and set up animations on mount
    useEffect(() => {
      // Deep clone with skeleton support
      const cloneLookup = new Map<THREE.Object3D, THREE.Object3D>();
      const clone = scene.clone(true);

      // Build mapping
      const parallelTraverse = (a: THREE.Object3D, b: THREE.Object3D) => {
        cloneLookup.set(a, b);
        for (let i = 0; i < a.children.length; i++) {
          parallelTraverse(a.children[i], b.children[i]);
        }
      };
      parallelTraverse(scene, clone);

      // Fix skinned meshes
      clone.traverse((node) => {
        if (node instanceof THREE.SkinnedMesh) {
          const sourceMesh = scene.getObjectByName(node.name) as THREE.SkinnedMesh;
          if (sourceMesh?.skeleton) {
            const clonedBones = sourceMesh.skeleton.bones.map(
              (bone) => cloneLookup.get(bone) as THREE.Bone
            );
            node.skeleton = new THREE.Skeleton(
              clonedBones,
              sourceMesh.skeleton.boneInverses.map((m) => m.clone())
            );
            node.bind(node.skeleton, node.bindMatrix);
          }
        }
        if (node instanceof THREE.Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      // Create mixer for the cloned scene
      const mixer = new THREE.AnimationMixer(clone);
      mixerRef.current = mixer;

      // Create actions
      const actions: Record<string, THREE.AnimationAction> = {};
      animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
      });
      actionsRef.current = actions;

      // Play initial animation
      const initialAnim = ANIMATION_MAP[animation];
      if (actions[initialAnim]) {
        actions[initialAnim].play();
      }

      setClonedScene(clone);

      return () => {
        mixer.stopAllAction();
        mixerRef.current = null;
        actionsRef.current = {};
      };
    }, [scene, animations]);

    // Handle animation prop changes
    useEffect(() => {
      if (!clonedScene) return;

      const actions = actionsRef.current;
      const animationName = ANIMATION_MAP[animation];
      const action = actions[animationName];

      if (action && currentAnimation.current !== animation) {
        Object.values(actions).forEach((a) => a?.fadeOut(0.2));
        action.reset().fadeIn(0.2).play();
        currentAnimation.current = animation;
      }
    }, [animation, clonedScene]);

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

    if (!clonedScene) return null;

    return (
      <group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
      </group>
    );
  }
);

CharacterModel.displayName = 'CharacterModel';

export default CharacterModel;
