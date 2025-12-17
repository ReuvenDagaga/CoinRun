// CharacterSelector.tsx - Home screen character selector with navigation arrows
import { useState, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterModel } from '@/components/game/characters';
import { SKIN_CONFIGS } from '@/components/game/characters/types';
import { useAuth } from '@/hooks/useAuth';

// Get all available skin IDs
const ALL_SKINS = Object.keys(SKIN_CONFIGS);

// Rotating character wrapper
function RotatingCharacter({ skinId }: { skinId: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.008;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.8, 0]} scale={0.9}>
      <CharacterModel skinId={skinId} animation="idle" scale={1} />
    </group>
  );
}

interface CharacterSelectorProps {
  className?: string;
}

export default function CharacterSelector({ className = '' }: CharacterSelectorProps) {
  const { user, equipSkin } = useAuth();
  const ownedSkins = user?.ownedSkins || ['default'];
  const currentSkin = user?.currentSkin || 'default';

  // Find current index in owned skins
  const currentIndex = ownedSkins.indexOf(currentSkin);
  const [selectedIndex, setSelectedIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

  // Get currently selected skin
  const selectedSkin = ownedSkins[selectedIndex] || 'default';
  const skinConfig = SKIN_CONFIGS[selectedSkin] || SKIN_CONFIGS.default;

  // Handle navigation
  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : ownedSkins.length - 1;
      // Auto-equip when changing
      if (ownedSkins[newIndex]) {
        equipSkin(ownedSkins[newIndex]);
      }
      return newIndex;
    });
  }, [ownedSkins, equipSkin]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev < ownedSkins.length - 1 ? prev + 1 : 0;
      // Auto-equip when changing
      if (ownedSkins[newIndex]) {
        equipSkin(ownedSkins[newIndex]);
      }
      return newIndex;
    });
  }, [ownedSkins, equipSkin]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 1, 3.5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.4} color="#ffd700" />
        <pointLight position={[0, -2, 3]} intensity={0.3} color="#4fc3f7" />
        <RotatingCharacter skinId={selectedSkin} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          target={[0, 0.5, 0]}
        />
      </Canvas>

      {/* Navigation arrows - only show if more than 1 skin */}
      {ownedSkins.length > 1 && (
        <>
          {/* Left arrow */}
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors active:scale-90"
            aria-label="Previous skin"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="white"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Right arrow */}
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors active:scale-90"
            aria-label="Next skin"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="white"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Skin name indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full">
        <span className="text-white text-xs font-semibold">{skinConfig.name}</span>
      </div>

      {/* Skin counter */}
      {ownedSkins.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded-full">
          <span className="text-white text-[10px]">
            {selectedIndex + 1}/{ownedSkins.length}
          </span>
        </div>
      )}
    </div>
  );
}
