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

// Debug logger
const DEBUG = true;
const log = (msg: string, data?: any) => {
  if (DEBUG) {
    if (data !== undefined) {
      console.log(`[CharacterModel] ${msg}`, data);
    } else {
      console.log(`[CharacterModel] ${msg}`);
    }
  }
};

const CharacterModel = forwardRef<CharacterModelRef, CharacterModelProps>(
  ({ animation = 'running', scale = 100 }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const currentAnimation = useRef<AnimationState>(animation);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
    const [clonedScene, setClonedScene] = useState<THREE.Object3D | null>(null);

    const { scene, animations } = useGLTF(MODEL_PATH);

    // Log on mount
    useEffect(() => {
      log('Component mounted');
      log('Scale prop:', scale);
      log('Animation prop:', animation);
      return () => log('Component unmounted');
    }, []);

    // Log scene info
    useEffect(() => {
      log('=== SCENE LOADED ===');
      log('Scene type:', scene.type);
      log('Scene name:', scene.name);
      log('Scene children count:', scene.children.length);
      log('Scene visible:', scene.visible);

      // Log scene hierarchy
      const logHierarchy = (obj: THREE.Object3D, indent = 0) => {
        const prefix = '  '.repeat(indent);
        log(`${prefix}- ${obj.type}: "${obj.name}" visible=${obj.visible}`);
        if (obj instanceof THREE.Mesh) {
          log(`${prefix}  Geometry vertices: ${obj.geometry?.attributes?.position?.count || 'N/A'}`);
          log(`${prefix}  Material:`, obj.material);
        }
        if (obj instanceof THREE.SkinnedMesh) {
          log(`${prefix}  [SkinnedMesh] Has skeleton: ${!!obj.skeleton}`);
          if (obj.skeleton) {
            log(`${prefix}  Bones count: ${obj.skeleton.bones.length}`);
          }
        }
        obj.children.forEach(child => logHierarchy(child, indent + 1));
      };

      log('Scene hierarchy:');
      logHierarchy(scene);

      log('Animations count:', animations.length);
      animations.forEach((clip, i) => {
        log(`Animation ${i}: "${clip.name}" duration=${clip.duration}s tracks=${clip.tracks.length}`);
      });
    }, [scene, animations]);

    // Clone scene and set up animations on mount
    useEffect(() => {
      log('=== CLONING SCENE ===');

      // Deep clone with skeleton support
      const cloneLookup = new Map<THREE.Object3D, THREE.Object3D>();
      const clone = scene.clone(true);

      log('Clone created, type:', clone.type);
      log('Clone children count:', clone.children.length);

      // Build mapping
      const parallelTraverse = (a: THREE.Object3D, b: THREE.Object3D) => {
        cloneLookup.set(a, b);
        for (let i = 0; i < a.children.length; i++) {
          parallelTraverse(a.children[i], b.children[i]);
        }
      };
      parallelTraverse(scene, clone);

      log('Clone lookup map size:', cloneLookup.size);

      // Fix skinned meshes
      let skinnedMeshCount = 0;
      clone.traverse((node) => {
        if (node instanceof THREE.SkinnedMesh) {
          skinnedMeshCount++;
          log(`Processing SkinnedMesh: "${node.name}"`);
          const sourceMesh = scene.getObjectByName(node.name) as THREE.SkinnedMesh;
          if (sourceMesh?.skeleton) {
            log(`  Source skeleton bones: ${sourceMesh.skeleton.bones.length}`);
            const clonedBones = sourceMesh.skeleton.bones.map(
              (bone) => cloneLookup.get(bone) as THREE.Bone
            );
            const validBones = clonedBones.filter(b => b !== undefined);
            log(`  Cloned bones (valid): ${validBones.length}/${clonedBones.length}`);

            node.skeleton = new THREE.Skeleton(
              clonedBones,
              sourceMesh.skeleton.boneInverses.map((m) => m.clone())
            );
            node.bind(node.skeleton, node.bindMatrix);
            log(`  Skeleton bound successfully`);
          } else {
            log(`  WARNING: No source skeleton found!`);
          }
        }
        if (node instanceof THREE.Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;

          // Log mesh details
          log(`Mesh "${node.name}": visible=${node.visible}, frustumCulled=${node.frustumCulled}`);

          // Check bounding box
          node.geometry.computeBoundingBox();
          const bbox = node.geometry.boundingBox;
          if (bbox) {
            log(`  BBox: min(${bbox.min.x.toFixed(2)}, ${bbox.min.y.toFixed(2)}, ${bbox.min.z.toFixed(2)}) max(${bbox.max.x.toFixed(2)}, ${bbox.max.y.toFixed(2)}, ${bbox.max.z.toFixed(2)})`);
          }
        }
      });

      log(`Total SkinnedMeshes processed: ${skinnedMeshCount}`);

      // Create mixer for the cloned scene
      const mixer = new THREE.AnimationMixer(clone);
      mixerRef.current = mixer;
      log('AnimationMixer created');

      // Create actions
      const actions: Record<string, THREE.AnimationAction> = {};
      animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
        log(`Action created for: "${clip.name}"`);
      });
      actionsRef.current = actions;

      // Play initial animation
      const initialAnim = ANIMATION_MAP[animation];
      log(`Playing initial animation: "${initialAnim}"`);
      if (actions[initialAnim]) {
        actions[initialAnim].play();
        log('Animation started');
      } else {
        log(`WARNING: Animation "${initialAnim}" not found!`);
        log('Available animations:', Object.keys(actions));
      }

      setClonedScene(clone);
      log('Cloned scene set to state');

      return () => {
        log('Cleaning up mixer');
        mixer.stopAllAction();
        mixerRef.current = null;
        actionsRef.current = {};
      };
    }, [scene, animations]);

    // Log when clonedScene changes
    useEffect(() => {
      if (clonedScene) {
        log('=== CLONED SCENE READY FOR RENDER ===');
        log('ClonedScene visible:', clonedScene.visible);
        log('ClonedScene position:', clonedScene.position);
        log('ClonedScene scale:', clonedScene.scale);

        // Force visibility
        clonedScene.visible = true;
        clonedScene.traverse((child) => {
          child.visible = true;
          if (child instanceof THREE.Mesh) {
            child.frustumCulled = false; // Disable frustum culling
          }
        });
        log('Forced all children to visible=true, frustumCulled=false');
      }
    }, [clonedScene]);

    // Handle animation prop changes
    useEffect(() => {
      if (!clonedScene) return;

      const actions = actionsRef.current;
      const animationName = ANIMATION_MAP[animation];
      const action = actions[animationName];

      if (action && currentAnimation.current !== animation) {
        log(`Changing animation: ${currentAnimation.current} -> ${animation} (${animationName})`);
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
          log(`setAnimation called: ${currentAnimation.current} -> ${state}`);
          Object.values(actions).forEach((a) => a?.fadeOut(0.2));
          action.reset().fadeIn(0.2).play();
          currentAnimation.current = state;
        }
      },
      group: groupRef.current,
    }));

    // Log every frame (throttled)
    const frameCount = useRef(0);
    useFrame((state, delta) => {
      mixerRef.current?.update(delta);

      frameCount.current++;
      if (frameCount.current % 300 === 1) { // Log every 300 frames (~5 seconds at 60fps)
        if (groupRef.current) {
          const worldPos = new THREE.Vector3();
          groupRef.current.getWorldPosition(worldPos);
          log(`Frame ${frameCount.current}: WorldPos(${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);
          log(`  Group scale: ${groupRef.current.scale.x}, visible: ${groupRef.current.visible}`);
          log(`  Children count: ${groupRef.current.children.length}`);

          // Check if in camera frustum
          const camera = state.camera;
          const frustum = new THREE.Frustum();
          frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
              camera.projectionMatrix,
              camera.matrixWorldInverse
            )
          );

          if (clonedScene) {
            const sphere = new THREE.Sphere();
            new THREE.Box3().setFromObject(clonedScene).getBoundingSphere(sphere);
            sphere.applyMatrix4(groupRef.current.matrixWorld);
            const inFrustum = frustum.intersectsSphere(sphere);
            log(`  In camera frustum: ${inFrustum}, sphere radius: ${sphere.radius.toFixed(2)}`);
          }
        }
      }
    });

    if (!clonedScene) {
      log('Render: clonedScene is null, returning null');
      return null;
    }

    log('Render: Rendering group with scale', scale);

    return (
      <group ref={groupRef} scale={scale}>
        <primitive object={clonedScene} />
      </group>
    );
  }
);

CharacterModel.displayName = 'CharacterModel';

export default CharacterModel;
