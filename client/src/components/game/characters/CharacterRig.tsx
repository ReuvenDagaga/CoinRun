import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterConfig, AnimationState } from './types';

interface CharacterRigProps {
  config: CharacterConfig;
  animation?: AnimationState;
  scale?: number;
  holdingWeapon?: boolean;
  rightHandItem?: React.ReactNode;
}

export interface CharacterRigRef {
  setAnimation: (state: AnimationState) => void;
  group: THREE.Group | null;
}

const CharacterRig = forwardRef<CharacterRigRef, CharacterRigProps>(
  ({ config, animation = 'idle', scale = 1, holdingWeapon = false, rightHandItem }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const animationRef = useRef<AnimationState>(animation);

    const bodyRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const spineRef = useRef<THREE.Group>(null);
    const chestRef = useRef<THREE.Group>(null);

    const leftShoulderRef = useRef<THREE.Group>(null);
    const leftUpperArmRef = useRef<THREE.Group>(null);
    const leftElbowRef = useRef<THREE.Group>(null);
    const leftWristRef = useRef<THREE.Group>(null);

    const rightShoulderRef = useRef<THREE.Group>(null);
    const rightUpperArmRef = useRef<THREE.Group>(null);
    const rightElbowRef = useRef<THREE.Group>(null);
    const rightWristRef = useRef<THREE.Group>(null);

    const pelvisRef = useRef<THREE.Group>(null);
    const leftHipRef = useRef<THREE.Group>(null);
    const leftKneeRef = useRef<THREE.Group>(null);
    const leftAnkleRef = useRef<THREE.Group>(null);
    const leftToeRef = useRef<THREE.Group>(null);

    const rightHipRef = useRef<THREE.Group>(null);
    const rightKneeRef = useRef<THREE.Group>(null);
    const rightAnkleRef = useRef<THREE.Group>(null);
    const rightToeRef = useRef<THREE.Group>(null);

    useEffect(() => {
      animationRef.current = animation;
    }, [animation]);

    useImperativeHandle(ref, () => ({
      setAnimation: (state: AnimationState) => {
        animationRef.current = state;
      },
      group: groupRef.current,
    }));

    useFrame((state) => {
      const time = state.clock.elapsedTime;
      const anim = animationRef.current;

      if (anim === 'idle') {
        applyIdleAnimation(time);
      } else if (anim === 'walking') {
        applyLocomotionAnimation(time, 4, 0.4);
      } else if (anim === 'jogging') {
        applyLocomotionAnimation(time, 7, 0.6);
      } else if (anim === 'running') {
        applyLocomotionAnimation(time, 10, 0.8);
      } else if (anim === 'sprinting') {
        applyLocomotionAnimation(time, 14, 1.0);
      }
    });

    const applyIdleAnimation = (time: number) => {
      const breathe = Math.sin(time * 2) * 0.015;

      if (bodyRef.current) {
        bodyRef.current.position.y = breathe;
        bodyRef.current.rotation.z = 0;
      }
      if (spineRef.current) {
        spineRef.current.rotation.x = Math.sin(time * 1.5) * 0.02;
        spineRef.current.rotation.y = 0;
      }
      if (chestRef.current) {
        chestRef.current.rotation.x = Math.sin(time * 1.8) * 0.01;
        chestRef.current.rotation.y = 0;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.8) * 0.08;
        headRef.current.rotation.x = Math.sin(time * 0.6) * 0.03;
      }

      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = 0;
        leftShoulderRef.current.rotation.z = 0.15 + Math.sin(time * 0.9) * 0.03;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -0.1;
      }
      if (leftWristRef.current) {
        leftWristRef.current.rotation.x = 0;
      }

      // Right arm - weapon holding pose when armed
      if (holdingWeapon) {
        if (rightShoulderRef.current) {
          // Arm extended forward to hold weapon
          rightShoulderRef.current.rotation.x = -1.2; // Forward
          rightShoulderRef.current.rotation.z = -0.3;
          rightShoulderRef.current.rotation.y = 0.2;
        }
        if (rightElbowRef.current) {
          // Bent to grip weapon
          rightElbowRef.current.rotation.x = -0.8;
        }
        if (rightWristRef.current) {
          // Wrist aligned with weapon
          rightWristRef.current.rotation.x = 0.3;
          rightWristRef.current.rotation.z = 0.1;
        }
      } else {
        if (rightShoulderRef.current) {
          rightShoulderRef.current.rotation.x = 0;
          rightShoulderRef.current.rotation.z = -0.15 - Math.sin(time * 0.9) * 0.03;
        }
        if (rightElbowRef.current) {
          rightElbowRef.current.rotation.x = -0.1;
        }
        if (rightWristRef.current) {
          rightWristRef.current.rotation.x = 0;
        }
      }

      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = 0;
      }
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.x = 0;
      }
      if (leftAnkleRef.current) {
        leftAnkleRef.current.rotation.x = 0;
      }
      if (leftToeRef.current) {
        leftToeRef.current.rotation.x = 0;
      }
      if (rightHipRef.current) {
        rightHipRef.current.rotation.x = 0;
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.x = 0;
      }
      if (rightAnkleRef.current) {
        rightAnkleRef.current.rotation.x = 0;
      }
      if (rightToeRef.current) {
        rightToeRef.current.rotation.x = 0;
      }
    };

    const applyLocomotionAnimation = (time: number, speed: number, intensity: number) => {
      const cycle = time * speed;

      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(cycle)) * 0.1 * intensity;
        bodyRef.current.rotation.z = Math.sin(cycle) * 0.05 * intensity;
      }
      if (spineRef.current) {
        spineRef.current.rotation.x = 0.08 * intensity;
        spineRef.current.rotation.y = Math.sin(cycle) * 0.08 * intensity;
      }
      if (chestRef.current) {
        chestRef.current.rotation.x = 0.05 * intensity;
        chestRef.current.rotation.y = Math.sin(cycle + Math.PI) * 0.06 * intensity;
      }
      if (headRef.current) {
        headRef.current.rotation.x = -0.08 * intensity;
        headRef.current.rotation.y = Math.sin(cycle) * 0.06 * intensity;
      }

      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = Math.sin(cycle) * 1.0 * intensity;
        leftShoulderRef.current.rotation.z = 0.1;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -0.6 - Math.abs(Math.sin(cycle)) * 0.5 * intensity;
      }
      if (leftWristRef.current) {
        leftWristRef.current.rotation.x = Math.sin(cycle * 2) * 0.3 * intensity;
      }

      // Right arm - weapon aiming during locomotion or natural swing
      if (holdingWeapon) {
        if (rightShoulderRef.current) {
          // Keep weapon forward while running with slight bob
          rightShoulderRef.current.rotation.x = -1.0 + Math.sin(cycle) * 0.1 * intensity;
          rightShoulderRef.current.rotation.z = -0.25;
          rightShoulderRef.current.rotation.y = 0.15;
        }
        if (rightElbowRef.current) {
          rightElbowRef.current.rotation.x = -0.7 - Math.sin(cycle) * 0.1 * intensity;
        }
        if (rightWristRef.current) {
          rightWristRef.current.rotation.x = 0.25;
          rightWristRef.current.rotation.z = 0.1;
        }
      } else {
        if (rightShoulderRef.current) {
          rightShoulderRef.current.rotation.x = Math.sin(cycle + Math.PI) * 1.0 * intensity;
          rightShoulderRef.current.rotation.z = -0.1;
        }
        if (rightElbowRef.current) {
          rightElbowRef.current.rotation.x = -0.6 - Math.abs(Math.sin(cycle + Math.PI)) * 0.5 * intensity;
        }
        if (rightWristRef.current) {
          rightWristRef.current.rotation.x = Math.sin(cycle * 2 + Math.PI) * 0.3 * intensity;
        }
      }

      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = Math.sin(cycle + Math.PI) * 0.7 * intensity;
      }
      if (leftKneeRef.current) {
        const kneeAngle = Math.sin(cycle + Math.PI);
        leftKneeRef.current.rotation.x = kneeAngle > 0 ? kneeAngle * 1.2 * intensity : 0;
      }
      if (leftAnkleRef.current) {
        leftAnkleRef.current.rotation.x = Math.sin(cycle) * 0.3 * intensity;
      }
      if (leftToeRef.current) {
        leftToeRef.current.rotation.x = Math.sin(cycle + Math.PI / 2) * 0.2 * intensity;
      }

      if (rightHipRef.current) {
        rightHipRef.current.rotation.x = Math.sin(cycle) * 0.7 * intensity;
      }
      if (rightKneeRef.current) {
        const kneeAngle = Math.sin(cycle);
        rightKneeRef.current.rotation.x = kneeAngle > 0 ? kneeAngle * 1.2 * intensity : 0;
      }
      if (rightAnkleRef.current) {
        rightAnkleRef.current.rotation.x = Math.sin(cycle + Math.PI) * 0.3 * intensity;
      }
      if (rightToeRef.current) {
        rightToeRef.current.rotation.x = Math.sin(cycle + Math.PI / 2 + Math.PI) * 0.2 * intensity;
      }
    };

    const { colors, bodyScale, hairStyle, gender } = config;
    const isFemale = gender === 'female';

    const torsoWidth = isFemale ? 0.28 : 0.32;
    const hipWidth = isFemale ? 0.16 : 0.14;

    return (
      <group ref={groupRef} scale={scale}>
        <group ref={bodyRef}>
          <group ref={pelvisRef} position={[0, 0.85, 0]}>
            <mesh>
              <boxGeometry args={[0.35 * bodyScale.torso, 0.15, 0.18]} />
              <meshStandardMaterial color={colors.pants} />
            </mesh>

            <group ref={spineRef} position={[0, 0.15, 0]}>
              <mesh>
                <boxGeometry args={[0.30 * bodyScale.torso, 0.2, 0.15]} />
                <meshStandardMaterial color={colors.shirt} />
              </mesh>

              <group ref={chestRef} position={[0, 0.2, 0]}>
                <mesh>
                  <capsuleGeometry args={[torsoWidth * bodyScale.torso, 0.25, 8, 16]} />
                  <meshStandardMaterial color={colors.shirt} />
                </mesh>

                {isFemale && (
                  <mesh position={[0, -0.05, 0.12]}>
                    <sphereGeometry args={[0.12, 12, 12]} />
                    <meshStandardMaterial color={colors.shirt} />
                  </mesh>
                )}

                <group ref={headRef} position={[0, 0.45, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.22 * bodyScale.head, 24, 24]} />
                    <meshStandardMaterial color={colors.skin} />
                  </mesh>

                  {hairStyle === 'short' && (
                    <mesh position={[0, 0.08, 0]} scale={[1.05, 0.5, 1.05]}>
                      <sphereGeometry args={[0.20 * bodyScale.head, 16, 16]} />
                      <meshStandardMaterial color={colors.hair} />
                    </mesh>
                  )}
                  {hairStyle === 'long' && (
                    <>
                      <mesh position={[0, 0.08, 0]} scale={[1.1, 0.55, 1.1]}>
                        <sphereGeometry args={[0.20 * bodyScale.head, 16, 16]} />
                        <meshStandardMaterial color={colors.hair} />
                      </mesh>
                      <mesh position={[0, -0.15, -0.08]}>
                        <capsuleGeometry args={[0.15, 0.35, 8, 12]} />
                        <meshStandardMaterial color={colors.hair} />
                      </mesh>
                    </>
                  )}

                  <mesh position={[-0.08, 0.02, 0.18]}>
                    <sphereGeometry args={[0.035, 12, 12]} />
                    <meshStandardMaterial color="white" />
                  </mesh>
                  <mesh position={[-0.08, 0.02, 0.20]}>
                    <sphereGeometry args={[0.018, 8, 8]} />
                    <meshStandardMaterial color={colors.eyeColor} />
                  </mesh>

                  <mesh position={[0.08, 0.02, 0.18]}>
                    <sphereGeometry args={[0.035, 12, 12]} />
                    <meshStandardMaterial color="white" />
                  </mesh>
                  <mesh position={[0.08, 0.02, 0.20]}>
                    <sphereGeometry args={[0.018, 8, 8]} />
                    <meshStandardMaterial color={colors.eyeColor} />
                  </mesh>

                  <mesh position={[0, -0.02, 0.19]}>
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshStandardMaterial color={colors.skin} />
                  </mesh>

                  <mesh position={[0, -0.08, 0.17]} rotation={[0.1, 0, 0]}>
                    <capsuleGeometry args={[0.025, 0.04, 6, 10]} />
                    <meshStandardMaterial color="#d4736a" />
                  </mesh>

                  <mesh position={[-0.12, 0.08, 0.12]} rotation={[0, -0.3, 0.2]}>
                    <boxGeometry args={[0.08, 0.02, 0.015]} />
                    <meshStandardMaterial color={colors.hair} />
                  </mesh>
                  <mesh position={[0.12, 0.08, 0.12]} rotation={[0, 0.3, -0.2]}>
                    <boxGeometry args={[0.08, 0.02, 0.015]} />
                    <meshStandardMaterial color={colors.hair} />
                  </mesh>

                  <mesh position={[-0.18, 0, 0]}>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshStandardMaterial color={colors.skin} />
                  </mesh>
                  <mesh position={[0.18, 0, 0]}>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshStandardMaterial color={colors.skin} />
                  </mesh>
                </group>

                <group ref={leftShoulderRef} position={[-0.32 * bodyScale.torso, 0.12, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.06, 10, 10]} />
                    <meshStandardMaterial color={colors.shirt} />
                  </mesh>

                  <group ref={leftUpperArmRef} position={[0, -0.08, 0]}>
                    <mesh position={[0, -0.08, 0]}>
                      <capsuleGeometry args={[0.05 * bodyScale.arms, 0.12, 6, 12]} />
                      <meshStandardMaterial color={colors.shirt} />
                    </mesh>

                    <group ref={leftElbowRef} position={[0, -0.22, 0]}>
                      <mesh>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshStandardMaterial color={colors.skin} />
                      </mesh>

                      <mesh position={[0, -0.08, 0]}>
                        <capsuleGeometry args={[0.04 * bodyScale.arms, 0.10, 6, 12]} />
                        <meshStandardMaterial color={colors.skin} />
                      </mesh>

                      <group ref={leftWristRef} position={[0, -0.20, 0]}>
                        <mesh>
                          <sphereGeometry args={[0.05, 10, 10]} />
                          <meshStandardMaterial color={colors.skin} />
                        </mesh>

                        <mesh position={[0, -0.04, 0.02]}>
                          <boxGeometry args={[0.04, 0.05, 0.02]} />
                          <meshStandardMaterial color={colors.skin} />
                        </mesh>
                      </group>
                    </group>
                  </group>
                </group>

                <group ref={rightShoulderRef} position={[0.32 * bodyScale.torso, 0.12, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.06, 10, 10]} />
                    <meshStandardMaterial color={colors.shirt} />
                  </mesh>

                  <group ref={rightUpperArmRef} position={[0, -0.08, 0]}>
                    <mesh position={[0, -0.08, 0]}>
                      <capsuleGeometry args={[0.05 * bodyScale.arms, 0.12, 6, 12]} />
                      <meshStandardMaterial color={colors.shirt} />
                    </mesh>

                    <group ref={rightElbowRef} position={[0, -0.22, 0]}>
                      <mesh>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshStandardMaterial color={colors.skin} />
                      </mesh>

                      <mesh position={[0, -0.08, 0]}>
                        <capsuleGeometry args={[0.04 * bodyScale.arms, 0.10, 6, 12]} />
                        <meshStandardMaterial color={colors.skin} />
                      </mesh>

                      <group ref={rightWristRef} position={[0, -0.20, 0]}>
                        <mesh>
                          <sphereGeometry args={[0.05, 10, 10]} />
                          <meshStandardMaterial color={colors.skin} />
                        </mesh>

                        <mesh position={[0, -0.04, 0.02]}>
                          <boxGeometry args={[0.04, 0.05, 0.02]} />
                          <meshStandardMaterial color={colors.skin} />
                        </mesh>

                        {/* Weapon attachment point - positioned in front of hand */}
                        {rightHandItem && (
                          <group position={[0, 0, 0.25]} rotation={[0, 0, 0]}>
                            {rightHandItem}
                          </group>
                        )}
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>

            <group ref={leftHipRef} position={[-hipWidth, -0.08, 0]}>
              <mesh>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial color={colors.pants} />
              </mesh>

              <mesh position={[0, -0.12, 0]}>
                <capsuleGeometry args={[0.06 * bodyScale.legs, 0.14, 6, 12]} />
                <meshStandardMaterial color={colors.pants} />
              </mesh>

              <group ref={leftKneeRef} position={[0, -0.30, 0]}>
                <mesh>
                  <sphereGeometry args={[0.05, 10, 10]} />
                  <meshStandardMaterial color={colors.pants} />
                </mesh>

                <mesh position={[0, -0.12, 0]}>
                  <capsuleGeometry args={[0.05 * bodyScale.legs, 0.14, 6, 12]} />
                  <meshStandardMaterial color={colors.pants} />
                </mesh>

                <group ref={leftAnkleRef} position={[0, -0.30, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshStandardMaterial color={colors.shoes} />
                  </mesh>

                  <group ref={leftToeRef} position={[0, -0.03, 0.04]}>
                    <mesh>
                      <boxGeometry args={[0.08, 0.05, 0.14]} />
                      <meshStandardMaterial color={colors.shoes} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>

            <group ref={rightHipRef} position={[hipWidth, -0.08, 0]}>
              <mesh>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial color={colors.pants} />
              </mesh>

              <mesh position={[0, -0.12, 0]}>
                <capsuleGeometry args={[0.06 * bodyScale.legs, 0.14, 6, 12]} />
                <meshStandardMaterial color={colors.pants} />
              </mesh>

              <group ref={rightKneeRef} position={[0, -0.30, 0]}>
                <mesh>
                  <sphereGeometry args={[0.05, 10, 10]} />
                  <meshStandardMaterial color={colors.pants} />
                </mesh>

                <mesh position={[0, -0.12, 0]}>
                  <capsuleGeometry args={[0.05 * bodyScale.legs, 0.14, 6, 12]} />
                  <meshStandardMaterial color={colors.pants} />
                </mesh>

                <group ref={rightAnkleRef} position={[0, -0.30, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshStandardMaterial color={colors.shoes} />
                  </mesh>

                  <group ref={rightToeRef} position={[0, -0.03, 0.04]}>
                    <mesh>
                      <boxGeometry args={[0.08, 0.05, 0.14]} />
                      <meshStandardMaterial color={colors.shoes} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    );
  }
);

CharacterRig.displayName = 'CharacterRig';

export default CharacterRig;