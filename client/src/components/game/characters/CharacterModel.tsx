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

    // One-time scene analysis and clone
    useEffect(() => {
      // Analyze original scene
      let meshCount = 0;
      let skinnedMeshCount = 0;
      let totalVertices = 0;
      const meshNames: string[] = [];

      scene.traverse((node) => {
        if (node instanceof THREE.SkinnedMesh) {
          skinnedMeshCount++;
          meshNames.push(`${node.name}(skinned)`);
          totalVertices += node.geometry?.attributes?.position?.count || 0;
        } else if (node instanceof THREE.Mesh) {
          meshCount++;
          meshNames.push(node.name);
          totalVertices += node.geometry?.attributes?.position?.count || 0;
        }
      });

      console.log(`%c[CharacterModel] Scene Analysis`, 'color: #00ff00; font-weight: bold');
      console.log(`  Meshes: ${meshCount}, SkinnedMeshes: ${skinnedMeshCount}, Vertices: ${totalVertices}`);
      console.log(`  Animations: ${animations.map(a => a.name).join(', ')}`);
      console.log(`  Props: scale=${scale}, animation=${animation}`);

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

      // Fix skinned meshes and collect debug info
      let skeletonIssues = 0;
      clone.traverse((node) => {
        if (node instanceof THREE.SkinnedMesh) {
          const sourceMesh = scene.getObjectByName(node.name) as THREE.SkinnedMesh;
          if (sourceMesh?.skeleton) {
            const clonedBones = sourceMesh.skeleton.bones.map(
              (bone) => cloneLookup.get(bone) as THREE.Bone
            );
            if (clonedBones.some(b => !b)) skeletonIssues++;
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
          node.frustumCulled = false;
        }
        node.visible = true;
      });

      if (skeletonIssues > 0) {
        console.log(`%c[CharacterModel] WARNING: ${skeletonIssues} skeleton issues!`, 'color: red');
      }

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
        console.log(`%c[CharacterModel] Playing: ${initialAnim}`, 'color: #00ff00');
      } else {
        console.log(`%c[CharacterModel] ERROR: Animation "${initialAnim}" not found!`, 'color: red');
      }

      setClonedScene(clone);
      console.log(`%c[CharacterModel] Clone ready ✓`, 'color: #00ff00; font-weight: bold');

      return () => {
        mixer.stopAllAction();
        mixerRef.current = null;
        actionsRef.current = {};
      };
    }, [scene, animations]);

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

    // Frame update with periodic status
    const frameCount = useRef(0);
    const lastLogTime = useRef(0);
    useFrame((state, delta) => {
      mixerRef.current?.update(delta);
      frameCount.current++;

      const now = performance.now();
      if (now - lastLogTime.current > 5000 && groupRef.current && clonedScene) {
        lastLogTime.current = now;

        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = new THREE.Vector3();
        box.getSize(size);

        console.log(`%c[CharacterModel] Status @${(now/1000).toFixed(0)}s`, 'color: cyan', {
          worldPos: `(${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)}, ${worldPos.z.toFixed(1)})`,
          size: `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`,
          scale: groupRef.current.scale.x,
          visible: groupRef.current.visible,
          childrenInGroup: groupRef.current.children.length,
        });
      }
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
