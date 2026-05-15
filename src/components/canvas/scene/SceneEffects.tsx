'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={0.8} />
      <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.0004, 0.0004)} />
      <Vignette offset={0.3} darkness={0.6} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

export function FloatingParticles() {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 25,
        y: (Math.random() - 0.5) * 25,
        z: (Math.random() - 0.5) * 15,
        speed: 0.01 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const dummy = dummyRef.current;

    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(time * p.speed + p.phase) * 0.5,
        p.y + Math.cos(time * p.speed + p.phase) * 0.3,
        p.z + Math.sin(time * p.speed * 0.7 + p.phase) * 0.4
      );
      dummy.scale.setScalar(0.02 + Math.sin(time + p.phase) * 0.01);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
    </instancedMesh>
  );
}

export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 20, 5]} angle={0.4} penumbra={1} intensity={2} castShadow color="#ffffff" />
      <spotLight position={[-10, 15, 5]} angle={0.4} penumbra={1} intensity={1} color="#FFD700" />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#00CED1" />
      <pointLight position={[5, 10, -3]} intensity={0.4} color="#FF6347" />
      <pointLight position={[-5, 15, 3]} intensity={0.3} color="#9370DB" />
    </>
  );
}
