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
    const loggedOnce = useRef(false);

    const gltf = useGLTF(MODEL_PATH);

    // One-time detailed scene analysis
    useEffect(() => {
      if (loggedOnce.current) return;
      loggedOnce.current = true;

      console.log('%c[CharacterModel] FULL GLTF ANALYSIS', 'color: yellow; font-weight: bold; font-size: 14px');
      console.log('GLTF keys:', Object.keys(gltf));
      console.log('GLTF.scene:', gltf.scene);
      console.log('GLTF.scene.type:', gltf.scene?.type);
      console.log('GLTF.scene.children:', gltf.scene?.children);
      console.log('GLTF.nodes:', gltf.nodes);
      console.log('GLTF.materials:', gltf.materials);

      // Deep traverse and log everything
      console.log('%c[CharacterModel] Scene Tree:', 'color: cyan');
      const logTree = (obj: THREE.Object3D, depth = 0) => {
        const indent = '  '.repeat(depth);
        const info = [
          obj.type,
          obj.name ? `"${obj.name}"` : '(unnamed)',
          `visible=${obj.visible}`,
        ];
        if ((obj as any).isMesh) info.push('isMesh=true');
        if ((obj as any).isSkinnedMesh) info.push('isSkinnedMesh=true');
        if ((obj as any).geometry) {
          const geo = (obj as any).geometry;
          info.push(`verts=${geo.attributes?.position?.count || 0}`);
        }
        if ((obj as any).material) {
          const mat = (obj as any).material;
          info.push(`mat=${mat.type || mat.constructor.name}`);
        }
        console.log(`${indent}${info.join(' | ')}`);
        obj.children.forEach(child => logTree(child, depth + 1));
      };
      logTree(gltf.scene);

      console.log('%c[CharacterModel] Animations:', 'color: cyan');
      gltf.animations.forEach((clip, i) => {
        console.log(`  ${i}: "${clip.name}" (${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks)`);
      });
    }, [gltf]);

    // Clone scene and set up animations
    useEffect(() => {
      const scene = gltf.scene;
      const animations = gltf.animations;

      // Clone scene
      const cloneLookup = new Map<THREE.Object3D, THREE.Object3D>();
      const clone = scene.clone(true);

      const parallelTraverse = (a: THREE.Object3D, b: THREE.Object3D) => {
        cloneLookup.set(a, b);
        for (let i = 0; i < a.children.length; i++) {
          parallelTraverse(a.children[i], b.children[i]);
        }
      };
      parallelTraverse(scene, clone);

      // Fix skinned meshes
      clone.traverse((node: any) => {
        if (node.isSkinnedMesh) {
          const sourceMesh = scene.getObjectByName(node.name) as THREE.SkinnedMesh;
          if (sourceMesh?.skeleton) {
            const clonedBones = sourceMesh.skeleton.bones.map(
              (bone) => cloneLookup.get(bone) as THREE.Bone
            );
            node.skeleton = new THREE.Skeleton(
              clonedBones,
              sourceMesh.skeleton.boneInverses.map((m: THREE.Matrix4) => m.clone())
            );
            node.bind(node.skeleton, node.bindMatrix);
          }
        }
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.frustumCulled = false;
        }
        node.visible = true;
      });

      // Setup mixer
      const mixer = new THREE.AnimationMixer(clone);
      mixerRef.current = mixer;

      const actions: Record<string, THREE.AnimationAction> = {};
      animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
      });
      actionsRef.current = actions;

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
    }, [gltf]);

    // Animation changes
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
