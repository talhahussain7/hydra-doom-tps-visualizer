"use client";
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const CircleParticleSystem = ({ tps }: { tps: number }) => {
  const clock = useRef(new THREE.Clock());
  const MAX_PARTICLES = 1200000;
  const transitionSpeed = 2.0; // Adjust transition speed for smoother TPS changes
  const visibleTps = useRef(tps); // Tracks the current smoothly transitioning TPS

  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const offsets = new Float32Array(MAX_PARTICLES * 3);
    const speeds = new Float32Array(MAX_PARTICLES);
    const phases = new Float32Array(MAX_PARTICLES);
    const indexes = new Float32Array(MAX_PARTICLES);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3;

      // Wider X-axis spread
      offsets[i3] = (Math.random() - 0.5) * 160;
      offsets[i3 + 1] = Math.random() * 120;
      offsets[i3 + 2] = (Math.random() - 0.5) * 20;

      positions[i3] = offsets[i3];
      positions[i3 + 1] = offsets[i3 + 1];
      positions[i3 + 2] = offsets[i3 + 2];

      speeds[i] = 0.4 + Math.random() * 0.15; // Fine-tuned speed variations
      phases[i] = Math.random(); // Random phase for staggered animations
      indexes[i] = i;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("offset", new THREE.BufferAttribute(offsets, 3));
    geometry.setAttribute("speed", new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("index", new THREE.BufferAttribute(indexes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        tps: { value: MAX_PARTICLES },
        prevTps: { value: MAX_PARTICLES },
        visibleTps: { value: MAX_PARTICLES },
        transitionStartTime: { value: 0 },
        transitionSpeed: { value: transitionSpeed },
      },
      vertexShader: `
        uniform float time;
        uniform float visibleTps;

        attribute float speed;
        attribute vec3 offset;
        attribute float phase;
        attribute float index;

        varying float vAlpha;

        float easeInOut(float t) {
          return t * t * (3.0 - 2.0 * t);
        }

        void main() {
          float baseSpeed = 0.4;
          float adjustedTime = time * baseSpeed;
          float cycle = fract(adjustedTime + phase);
          vec3 particlePosition = offset;

          float normalizedIndex = index / 1000000.0;
          float visibility = step(normalizedIndex, visibleTps / 1000000.0);

          // Falling motion
          float y = easeInOut(cycle);
          particlePosition.y = offset.y - 120.0 * y;

          // Minimal horizontal movement
          float xOffset = sin(adjustedTime * speed + phase * 6.28) * 0.05;
          particlePosition.x += xOffset;

          vec4 mvPosition = modelViewMatrix * vec4(particlePosition, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float baseSize = 1.5;
          vec4 projectedCorner = projectionMatrix * modelViewMatrix * vec4(particlePosition + vec3(baseSize), 1.0);
          vec4 projectedCenter = projectionMatrix * modelViewMatrix * vec4(particlePosition, 1.0);
          gl_PointSize = length(projectedCorner.xyz - projectedCenter.xyz);

          // Fading logic
          float fadeTop = smoothstep(60.0, 57.0, particlePosition.y);
          float fadeBottom = smoothstep(-60.0, -57.0, particlePosition.y);

          float cycleFade = smoothstep(0.0, 0.1, cycle) * smoothstep(1.0, 0.9, cycle);

          // Cap the alpha to prevent over-brightening
          float alphaMultiplier = index < 50000.0 ? 0.35 : 0.1;
          vAlpha = fadeTop * fadeBottom * cycleFade * visibility * alphaMultiplier;
        }
      `,
      fragmentShader: `
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          float circle = 1.0 - smoothstep(0.48, 0.5, dist); // Sharper edges
          gl_FragColor = vec4(1.0, 0.3, 0.3, circle * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry, material };
  }, []);

  useFrame(() => {
    if (!material) return;

    const time = clock.current.getElapsedTime();
    const currentTps = visibleTps.current;

    // Smoothly interpolate `visibleTps` toward the target `tps`
    visibleTps.current += (tps - currentTps) * 0.1;

    material.uniforms.time.value = time;
    material.uniforms.tps.value = tps;
    material.uniforms.visibleTps.value = visibleTps.current;
  });

  return (
    <points geometry={geometry} material={material} frustumCulled={false} />
  );
};