import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import * as THREE from 'three';
import CharacterRig, { CharacterRigRef } from './CharacterRig';
import { AnimationState, getSkinConfig } from './types';

export type { AnimationState };

export interface CharacterModelRef {
  setAnimation: (state: AnimationState) => void;
  group: THREE.Group | null;
}

interface CharacterModelProps {
  skinId?: string;
  animation?: AnimationState;
  scale?: number;
}

const CharacterModel = forwardRef<CharacterModelRef, CharacterModelProps>(
  ({ skinId = 'default', animation = 'idle', scale = 1 }, ref) => {
    const rigRef = useRef<CharacterRigRef>(null);

    const config = getSkinConfig(skinId);

    useImperativeHandle(ref, () => ({
      setAnimation: (state: AnimationState) => {
        rigRef.current?.setAnimation(state);
      },
      group: rigRef.current?.group || null,
    }));

    useEffect(() => {
      rigRef.current?.setAnimation(animation);
    }, [animation]);

    return (
      <CharacterRig
        ref={rigRef}
        config={config}
        animation={animation}
        scale={scale}
      />
    );
  }
);

CharacterModel.displayName = 'CharacterModel';

export default CharacterModel;