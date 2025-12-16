import { useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
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

// Helper to deep clone a scene with proper skeleton support
function cloneWithSkeleton(source: THREE.Object3D): THREE.Object3D {
  const cloneLookup = new Map<THREE.Object3D, THREE.Object3D>();
  const clone = source.clone(true);

  // Build a mapping of original to cloned objects
  const parallelTraverse = (
    a: THREE.Object3D,
    b: THREE.Object3D,
    callback: (a: THREE.Object3D, b: THREE.Object3D) => void
  ) => {
    callback(a, b);
    for (let i = 0; i < a.children.length; i++) {
      parallelTraverse(a.children[i], b.children[i], callback);
    }
  };

  parallelTraverse(source, clone, (sourceNode, clonedNode) => {
    cloneLookup.set(sourceNode, clonedNode);
  });

  // Fix skinned meshes to use cloned bones
  clone.traverse((node) => {
    if (node instanceof THREE.SkinnedMesh) {
      const skinnedMesh = node;
      const sourceMesh = source.getObjectByName(node.name) as THREE.SkinnedMesh;

      if (sourceMesh && sourceMesh.skeleton) {
        const clonedBones = sourceMesh.skeleton.bones.map((bone) => {
          return cloneLookup.get(bone) as THREE.Bone;
        });

        skinnedMesh.skeleton = new THREE.Skeleton(clonedBones, sourceMesh.skeleton.boneInverses);
        skinnedMesh.bind(skinnedMesh.skeleton, skinnedMesh.bindMatrix);
      }
    }
  });

  return clone;
}

const CharacterModel = forwardRef<CharacterModelRef, CharacterModelProps>(
  ({ animation = 'running', scale = 100 }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const currentAnimation = useRef<AnimationState>(animation);

    const { scene, animations } = useGLTF(MODEL_PATH);

    // Clone the scene for this instance with proper skeleton support
    const clonedScene = useMemo(() => {
      const clone = cloneWithSkeleton(scene);
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return clone;
    }, [scene]);

    // Set up animations targeting the cloned scene
    const { actions, mixer } = useAnimations(animations, clonedScene);

    // Handle initial animation
    useEffect(() => {
      const animationName = ANIMATION_MAP[animation];
      const action = actions[animationName];

      if (action) {
        action.reset().play();
        currentAnimation.current = animation;
      }
    }, [actions, animation]);

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

    return (
      <group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
      </group>
    );
  }
);

CharacterModel.displayName = 'CharacterModel';

export default CharacterModel;
