import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useGame } from '@/context';
import { TRACK_LENGTH, TRACK_WIDTH } from '../config';
import { getSeedValue, seededRandom } from '../utils';

const DECORATION_MODELS = [
  { path: '/models/tree.glb', type: 'tree', baseScale: 3, yOffset: 0 },
  { path: '/models/tree2.glb', type: 'tree', baseScale: 3, yOffset: 0 },
  { path: '/models/bench.glb', type: 'prop', baseScale: 2, yOffset: 0 },
  { path: '/models/home.glb', type: 'building', baseScale: 4, yOffset: 0 },
  { path: '/models/water.glb', type: 'nature', baseScale: 3, yOffset: 0 },
];

DECORATION_MODELS.forEach((model) => {
  useGLTF.preload(model.path);
});

interface DecorationItem {
  modelIndex: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  yOffset: number;
}

interface ModelInstanceProps {
  modelPath: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

function ModelInstance({ modelPath, position, rotation, scale }: ModelInstanceProps) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

export default function TrackDecorations() {
  const { track } = useGame();

  const decorations = useMemo(() => {
    const seedValue = getSeedValue(track?.seed) + 2000;
    const random = seededRandom(seedValue);

    const items: DecorationItem[] = [];
    const minDistance = TRACK_WIDTH / 2 + 3;
    const maxDistance = TRACK_WIDTH / 2 + 15;

    for (let z = 30; z < TRACK_LENGTH - 50; z += 15 + random() * 25) {
      const modelIndex = Math.floor(random() * DECORATION_MODELS.length);
      const model = DECORATION_MODELS[modelIndex];
      const side = random() > 0.5 ? 1 : -1;
      const xOffset = minDistance + random() * (maxDistance - minDistance);
      const scale = model.baseScale * (0.8 + random() * 0.4);

      items.push({
        modelIndex,
        position: [side * xOffset, model.yOffset * scale, z],
        rotation: [0, random() * Math.PI * 2, 0],
        scale,
        yOffset: model.yOffset,
      });

      if (random() > 0.6) {
        const secondModelIndex = Math.floor(random() * DECORATION_MODELS.length);
        const secondModel = DECORATION_MODELS[secondModelIndex];
        const secondScale = secondModel.baseScale * (0.8 + random() * 0.4);

        items.push({
          modelIndex: secondModelIndex,
          position: [-side * xOffset, secondModel.yOffset * secondScale, z + random() * 10],
          rotation: [0, random() * Math.PI * 2, 0],
          scale: secondScale,
          yOffset: secondModel.yOffset,
        });
      }
    }

    return items;
  }, [track?.seed]);

  return (
    <group>
      {decorations.map((decoration, i) => (
        <ModelInstance
          key={`decoration-${i}`}
          modelPath={DECORATION_MODELS[decoration.modelIndex].path}
          position={decoration.position}
          rotation={decoration.rotation}
          scale={decoration.scale}
        />
      ))}
    </group>
  );
}