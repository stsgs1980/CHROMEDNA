'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function HolographicGridFloor() {
  const gridHelperRef = useRef<THREE.GridHelper>(null);
  const gridMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const glowShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#FFD700') },
      uMinOpacity: { value: 0.05 },
      uMaxOpacity: { value: 0.12 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uMinOpacity;
      uniform float uMaxOpacity;
      varying vec2 vUv;
      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float radialFade = 1.0 - smoothstep(0.0, 0.5, dist);
        float pulse = mix(uMinOpacity, uMaxOpacity, (sin(uTime * 0.8) * 0.5 + 0.5));
        float alpha = radialFade * pulse;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  }), []);

  const gridHelperCallback = useMemo(() => (el: THREE.GridHelper | null) => {
    if (el) {
      (gridHelperRef as React.MutableRefObject<THREE.GridHelper | null>).current = el;
      const mats = Array.isArray(el.material) ? el.material : [el.material];
      mats.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.08;
        (mat as THREE.LineBasicMaterial).color.set('#FFD700');
        mat.depthWrite = false;
      });
    }
  }, []);

  useFrame((state) => {
    if (gridMaterialRef.current) {
      gridMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (gridHelperRef.current) {
      const pulse = 0.05 + (Math.sin(state.clock.elapsedTime * 0.8) * 0.5 + 0.5) * 0.07;
      const mats = Array.isArray(gridHelperRef.current.material) ? gridHelperRef.current.material : [gridHelperRef.current.material];
      mats.forEach((mat) => { mat.opacity = pulse; });
    }
  });

  return (
    <group position={[0, -1, 0]}>
      <gridHelper ref={gridHelperCallback} args={[30, 60, '#FFD700', '#FFD700']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <planeGeometry args={[14, 14]} />
        <shaderMaterial ref={gridMaterialRef} transparent depthWrite={false} uniforms={glowShader.uniforms} vertexShader={glowShader.vertexShader} fragmentShader={glowShader.fragmentShader} />
      </mesh>
    </group>
  );
}
