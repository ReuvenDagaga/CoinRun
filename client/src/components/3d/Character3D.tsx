// components/3d/Character3D.tsx
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type AnimationState = 'idle' | 'running' | 'jumping' | 'dancing';

function Character({ animation = 'idle' }: { animation?: AnimationState }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  
  const leftShoulderRef = useRef<THREE.Group>(null);
  const leftElbowRef = useRef<THREE.Group>(null);
  const leftWristRef = useRef<THREE.Group>(null);
  
  const rightShoulderRef = useRef<THREE.Group>(null);
  const rightElbowRef = useRef<THREE.Group>(null);
  const rightWristRef = useRef<THREE.Group>(null);
  
  const leftHipRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const leftAnkleRef = useRef<THREE.Group>(null);
  
  const rightHipRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);
  const rightAnkleRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (!groupRef.current) return;

    groupRef.current.rotation.y += 0.008;

    if (animation === 'idle') {
      const breathe = Math.sin(time * 2) * 0.02;
      
      if (bodyRef.current) {
        bodyRef.current.position.y = breathe;
        bodyRef.current.rotation.z = Math.sin(time * 0.5) * 0.02;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.8) * 0.1;
        headRef.current.rotation.x = Math.sin(time * 0.6) * 0.05;
      }
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = Math.sin(time * 1.2) * 0.1;
        leftShoulderRef.current.rotation.z = 0.2 + Math.sin(time * 0.8) * 0.05;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -0.1 + Math.sin(time * 1.5) * 0.1;
      }
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = Math.sin(time * 1.2 + 0.5) * 0.1;
        rightShoulderRef.current.rotation.z = -0.2 + Math.sin(time * 0.8) * -0.05;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -0.1 + Math.sin(time * 1.5 + 0.5) * 0.1;
      }
      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = Math.sin(time * 0.8) * 0.05;
      }
      if (rightHipRef.current) {
        rightHipRef.current.rotation.x = Math.sin(time * 0.8 + Math.PI) * 0.05;
      }
      if (leftKneeRef.current) leftKneeRef.current.rotation.x = 0;
      if (rightKneeRef.current) rightKneeRef.current.rotation.x = 0;
      if (leftAnkleRef.current) leftAnkleRef.current.rotation.x = 0;
      if (rightAnkleRef.current) rightAnkleRef.current.rotation.x = 0;
    }

    if (animation === 'running') {
      const runSpeed = 10;
      const runCycle = time * runSpeed;
      
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(runCycle)) * 0.15;
        bodyRef.current.rotation.z = Math.sin(runCycle) * 0.08;
        bodyRef.current.rotation.x = 0.1;
      }
      if (headRef.current) {
        headRef.current.rotation.x = -0.1 + Math.sin(runCycle * 2) * 0.05;
        headRef.current.rotation.y = Math.sin(runCycle) * 0.1;
      }
      
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = Math.sin(runCycle) * 1.2;
        leftShoulderRef.current.rotation.z = 0.1;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -0.8 - Math.abs(Math.sin(runCycle)) * 0.5;
      }
      if (leftWristRef.current) {
        leftWristRef.current.rotation.x = Math.sin(runCycle * 2) * 0.3;
      }
      
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = Math.sin(runCycle + Math.PI) * 1.2;
        rightShoulderRef.current.rotation.z = -0.1;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -0.8 - Math.abs(Math.sin(runCycle + Math.PI)) * 0.5;
      }
      if (rightWristRef.current) {
        rightWristRef.current.rotation.x = Math.sin(runCycle * 2 + Math.PI) * 0.3;
      }
      
      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = Math.sin(runCycle + Math.PI) * 0.8;
      }
      if (leftKneeRef.current) {
        const kneeAngle = Math.sin(runCycle + Math.PI);
        leftKneeRef.current.rotation.x = kneeAngle > 0 ? kneeAngle * 1.2 : 0;
      }
      if (leftAnkleRef.current) {
        leftAnkleRef.current.rotation.x = Math.sin(runCycle) * 0.3;
      }
      
      if (rightHipRef.current) {
        rightHipRef.current.rotation.x = Math.sin(runCycle) * 0.8;
      }
      if (rightKneeRef.current) {
        const kneeAngle = Math.sin(runCycle);
        rightKneeRef.current.rotation.x = kneeAngle > 0 ? kneeAngle * 1.2 : 0;
      }
      if (rightAnkleRef.current) {
        rightAnkleRef.current.rotation.x = Math.sin(runCycle + Math.PI) * 0.3;
      }
    }

    if (animation === 'jumping') {
      const jumpCycle = (time * 1.5) % (Math.PI * 2);
      const jumpPhase = Math.sin(jumpCycle);
      const isAirborne = jumpPhase > 0.3;
      
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.max(0, jumpPhase * 0.5);
        bodyRef.current.rotation.x = isAirborne ? -0.1 : 0.1;
      }
      if (headRef.current) {
        headRef.current.rotation.x = isAirborne ? -0.2 : 0.1;
      }
      
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = isAirborne ? -2.5 : 0.3;
        leftShoulderRef.current.rotation.z = isAirborne ? -0.3 : 0.2;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = isAirborne ? -0.3 : -0.8;
      }
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = isAirborne ? -2.5 : 0.3;
        rightShoulderRef.current.rotation.z = isAirborne ? 0.3 : -0.2;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = isAirborne ? -0.3 : -0.8;
      }
      
      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = isAirborne ? -0.5 : 0.8;
      }
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.x = isAirborne ? 0.8 : 1.5;
      }
      if (rightHipRef.current) {
        rightHipRef.current.rotation.x = isAirborne ? 0.3 : 0.8;
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.x = isAirborne ? 0.5 : 1.5;
      }
    }

    if (animation === 'dancing') {
      const danceSpeed = 4;
      const danceCycle = time * danceSpeed;
      
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(danceCycle * 2)) * 0.1;
        bodyRef.current.rotation.y = Math.sin(danceCycle) * 0.3;
        bodyRef.current.rotation.z = Math.sin(danceCycle * 2) * 0.1;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(danceCycle + 0.5) * 0.4;
        headRef.current.rotation.z = Math.sin(danceCycle * 2) * 0.2;
      }
      
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = Math.sin(danceCycle) * 0.5;
        leftShoulderRef.current.rotation.z = 0.5 + Math.sin(danceCycle * 2) * 0.5;
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = -1.5 + Math.sin(danceCycle * 2) * 0.5;
      }
      if (leftWristRef.current) {
        leftWristRef.current.rotation.z = Math.sin(danceCycle * 4) * 0.5;
      }
      
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = Math.sin(danceCycle + Math.PI) * 0.5;
        rightShoulderRef.current.rotation.z = -0.5 + Math.sin(danceCycle * 2 + Math.PI) * -0.5;
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = -1.5 + Math.sin(danceCycle * 2 + Math.PI) * 0.5;
      }
      if (rightWristRef.current) {
        rightWristRef.current.rotation.z = Math.sin(danceCycle * 4 + Math.PI) * 0.5;
      }
      
      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = Math.sin(danceCycle) * 0.3;
        leftHipRef.current.rotation.z = Math.sin(danceCycle * 2) * 0.2;
      }
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.x = 0.2 + Math.abs(Math.sin(danceCycle * 2)) * 0.3;
      }
      if (rightHipRef.current) {
        rightHipRef.current.rotation.x = Math.sin(danceCycle + Math.PI) * 0.3;
        rightHipRef.current.rotation.z = Math.sin(danceCycle * 2 + Math.PI) * 0.2;
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.x = 0.2 + Math.abs(Math.sin(danceCycle * 2 + Math.PI)) * 0.3;
      }
    }
  });

  const skinColor = '#ffcc80';
  const shirtColor = '#4fc3f7';
  const pantsColor = '#5c6bc0';
  const shoeColor = '#37474f';
  const hairColor = '#5d4037';

  return (
    <group ref={groupRef} position={[0, -0.8, 0]} scale={0.9}>
      <group ref={bodyRef}>
        <mesh position={[0, 1.1, 0]}>
          <capsuleGeometry args={[0.32, 0.45, 12, 24]} />
          <meshStandardMaterial color={shirtColor} />
        </mesh>
        
        <mesh position={[0, 0.75, 0]}>
          <capsuleGeometry args={[0.28, 0.15, 12, 24]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>

        <group ref={headRef} position={[0, 1.65, 0]}>
          <mesh>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          
          <mesh position={[0, 0.15, 0]} scale={[1.1, 0.6, 1.1]}>
            <sphereGeometry args={[0.28, 24, 24]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          
          <mesh position={[-0.1, 0.02, 0.26]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
          <mesh position={[-0.1, 0.02, 0.28]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          
          <mesh position={[0.1, 0.02, 0.26]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
          <mesh position={[0.1, 0.02, 0.28]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          
          <mesh position={[0, -0.05, 0.28]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color="#ffb74d" />
          </mesh>
          
          <mesh position={[0, -0.15, 0.26]} rotation={[0.1, 0, 0]}>
            <capsuleGeometry args={[0.04, 0.08, 8, 12]} />
            <meshStandardMaterial color="#e57373" />
          </mesh>
          
          <mesh position={[-0.18, 0.1, 0.18]} rotation={[0, -0.3, 0.3]}>
            <boxGeometry args={[0.12, 0.03, 0.02]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
          <mesh position={[0.18, 0.1, 0.18]} rotation={[0, 0.3, -0.3]}>
            <boxGeometry args={[0.12, 0.03, 0.02]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
        </group>

        <group ref={leftShoulderRef} position={[-0.38, 1.25, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={shirtColor} />
          </mesh>
          
          <mesh position={[0, -0.15, 0]}>
            <capsuleGeometry args={[0.08, 0.15, 8, 16]} />
            <meshStandardMaterial color={shirtColor} />
          </mesh>
          
          <group ref={leftElbowRef} position={[0, -0.32, 0]}>
            <mesh>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color={skinColor} />
            </mesh>
            
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[0.06, 0.12, 8, 16]} />
              <meshStandardMaterial color={skinColor} />
            </mesh>
            
            <group ref={leftWristRef} position={[0, -0.26, 0]}>
              <mesh>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshStandardMaterial color={skinColor} />
              </mesh>
              
              <mesh position={[-0.02, -0.08, 0.02]} rotation={[0.2, 0, 0.1]}>
                <capsuleGeometry args={[0.015, 0.04, 4, 8]} />
                <meshStandardMaterial color={skinColor} />
              </mesh>
              <mesh position={[0.02, -0.08, 0.02]} rotation={[0.2, 0, -0.1]}>
                <capsuleGeometry args={[0.015, 0.04, 4, 8]} />
                <meshStandardMaterial color={skinColor} />
              </mesh>
            </group>
          </group>
        </group>

        <group ref={rightShoulderRef} position={[0.38, 1.25, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={shirtColor} />
          </mesh>
          
          <mesh position={[0, -0.15, 0]}>
            <capsuleGeometry args={[0.08, 0.15, 8, 16]} />
            <meshStandardMaterial color={shirtColor} />
          </mesh>
          
          <group ref={rightElbowRef} position={[0, -0.32, 0]}>
            <mesh>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshStandardMaterial color={skinColor} />
            </mesh>
            
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[0.06, 0.12, 8, 16]} />
              <meshStandardMaterial color={skinColor} />
            </mesh>
            
            <group ref={rightWristRef} position={[0, -0.26, 0]}>
              <mesh>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshStandardMaterial color={skinColor} />
              </mesh>
              
              <mesh position={[-0.02, -0.08, 0.02]} rotation={[0.2, 0, 0.1]}>
                <capsuleGeometry args={[0.015, 0.04, 4, 8]} />
                <meshStandardMaterial color={skinColor} />
              </mesh>
              <mesh position={[0.02, -0.08, 0.02]} rotation={[0.2, 0, -0.1]}>
                <capsuleGeometry args={[0.015, 0.04, 4, 8]} />
                <meshStandardMaterial color={skinColor} />
              </mesh>
            </group>
          </group>
        </group>

        <group ref={leftHipRef} position={[-0.14, 0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
          
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.09, 0.18, 8, 16]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
          
          <group ref={leftKneeRef} position={[0, -0.38, 0]}>
            <mesh>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial color={pantsColor} />
            </mesh>
            
            <mesh position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.07, 0.15, 8, 16]} />
              <meshStandardMaterial color={pantsColor} />
            </mesh>
            
            <group ref={leftAnkleRef} position={[0, -0.32, 0]}>
              <mesh>
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshStandardMaterial color={shoeColor} />
              </mesh>
              
              <mesh position={[0, -0.04, 0.06]}>
                <boxGeometry args={[0.12, 0.08, 0.2]} />
                <meshStandardMaterial color={shoeColor} />
              </mesh>
            </group>
          </group>
        </group>

        <group ref={rightHipRef} position={[0.14, 0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
          
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.09, 0.18, 8, 16]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
          
          <group ref={rightKneeRef} position={[0, -0.38, 0]}>
            <mesh>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial color={pantsColor} />
            </mesh>
            
            <mesh position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.07, 0.15, 8, 16]} />
              <meshStandardMaterial color={pantsColor} />
            </mesh>
            
            <group ref={rightAnkleRef} position={[0, -0.32, 0]}>
              <mesh>
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshStandardMaterial color={shoeColor} />
              </mesh>
              
              <mesh position={[0, -0.04, 0.06]}>
                <boxGeometry args={[0.12, 0.08, 0.2]} />
                <meshStandardMaterial color={shoeColor} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function Character3DScene() {
  const [animation, setAnimation] = useState<AnimationState>('idle');

  useEffect(() => {
    const animations: AnimationState[] = ['idle', 'running', 'jumping', 'dancing'];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % animations.length;
      setAnimation(animations[index]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Canvas camera={{ position: [0, 1, 3.5], fov: 45 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} color="#ffd700" />
      <pointLight position={[0, -2, 3]} intensity={0.3} color="#4fc3f7" />
      <Character animation={animation} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}