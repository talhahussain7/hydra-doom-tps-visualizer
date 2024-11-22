"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

interface ParticleSystemProps {
  tps: number;
  width?: number;
  height?: number;
}

const PARTICLE_BUFFER_SIZE = 5000;
const SPAWN_INTERVAL = 16; // ~60fps
const BASE_PARTICLE_SIZE = {
  MIN: 3,
  MAX: 20,
};
const BASE_SPEED = {
  MIN: 3,
  MAX: 12,
};

const TPS_BREAKPOINTS = {
  VERY_HIGH: 1000000,
  HIGH: 500000,
  MEDIUM_HIGH: 100000,
  MEDIUM: 10000,
  LOW: 1000,
  VERY_LOW: 250,
};

// Calculate particles per frame based on TPS
const getTpsPerFrame = (tps: number) => {
  // Convert TPS (transactions per second) to transactions per frame
  return (tps * SPAWN_INTERVAL) / 1000;
};

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  tps,
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnRef = useRef(0);
  const tpsRef = useRef(tps);
  const previousTpsRef = useRef(tps);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const particleCountRef = useRef(0);

  useEffect(() => {
    tpsRef.current = tps;
  }, [tps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.translate(0, 0);
  }, [width, height]);

  // const getParticleProperties = () => {
  //   const tpsValue = tpsRef.current;
  //   let sizeRatio = 1.0;
  //   let speedRatio = 0.3;
  //   let spawnMultiplier = 1;

  //   if (tpsValue >= TPS_BREAKPOINTS.VERY_HIGH) {
  //     sizeRatio = 0.2;
  //     speedRatio = 1.0;
  //     spawnMultiplier = 0.1;
  //   } else if (tpsValue >= TPS_BREAKPOINTS.HIGH) {
  //     sizeRatio = 0.35;
  //     speedRatio = 0.85;
  //     spawnMultiplier = 0.08;
  //   } else if (tpsValue >= TPS_BREAKPOINTS.MEDIUM_HIGH) {
  //     sizeRatio = 0.5;
  //     speedRatio = 0.7;
  //     spawnMultiplier = 0.05;
  //   } else if (tpsValue >= TPS_BREAKPOINTS.MEDIUM) {
  //     sizeRatio = 0.7;
  //     speedRatio = 0.5;
  //     spawnMultiplier = 0.03;
  //   } else if (tpsValue >= TPS_BREAKPOINTS.LOW) {
  //     sizeRatio = 0.85;
  //     speedRatio = 0.4;
  //     spawnMultiplier = 0.015;
  //   }

  //   const size =
  //     BASE_PARTICLE_SIZE.MIN +
  //     (BASE_PARTICLE_SIZE.MAX - BASE_PARTICLE_SIZE.MIN) * sizeRatio;
  //   const speed =
  //     BASE_SPEED.MIN + (BASE_SPEED.MAX - BASE_SPEED.MIN) * speedRatio;

  //   return { size, speed, spawnMultiplier };
  // };

  // const getSpawnCount = () => {
  //   const tpsValue = tpsRef.current;
  //   const tpsPerFrame = getTpsPerFrame(tpsValue);

  //   // For very low TPS, maintain exact representation
  //   if (tpsValue <= TPS_BREAKPOINTS.VERY_LOW) {
  //     // Calculate fractional spawn count
  //     const exactSpawnCount = tpsPerFrame;
  //     const integerPart = Math.floor(exactSpawnCount);
  //     const fractionalPart = exactSpawnCount - integerPart;

  //     // Probabilistically spawn based on fractional part
  //     const shouldSpawnExtra = Math.random() < fractionalPart;
  //     return integerPart + (shouldSpawnExtra ? 1 : 0);
  //   }

  //   // For higher TPS, use scaled representation
  //   const { spawnMultiplier } = getParticleProperties();
  //   const baseCount = Math.min(50, Math.sqrt(tpsPerFrame) * spawnMultiplier);

  //   // Add variation based on TPS changes
  //   const tpsChange = Math.abs(tpsValue - previousTpsRef.current);
  //   const changeRatio = tpsChange / Math.max(previousTpsRef.current, 1);
  //   const changeBonus = baseCount * changeRatio * 0.5;

  //   previousTpsRef.current = tpsValue;

  //   return Math.max(1, Math.min(20, baseCount + changeBonus));
  // };

  // const createParticle = (): Particle => {
  //   const { size, speed } = getParticleProperties();
  //   const sizeVariance = size * 0.2;
  //   const speedVariance = speed * 0.1;

  //   return {
  //     x: Math.random() * width,
  //     y: -10,
  //     radius: Math.max(
  //       BASE_PARTICLE_SIZE.MIN,
  //       size - Math.random() * sizeVariance
  //     ),
  //     speed: speed + Math.random() * speedVariance,
  //     opacity: 0.7 + Math.random() * 0.2,
  //   };
  // };

  const getParticleProperties = () => {
    const tpsValue = tpsRef.current;
    let sizeRatio = 1.0;
    let speedRatio = 0.3;
    let spawnMultiplier = 1;
  
    // Helper to calculate ratio within a range
    const getRangeRatio = (value: number, min: number, max: number) => {
      return Math.min(1, Math.max(0, (value - min) / (max - min)));
    };
  
    if (tpsValue >= TPS_BREAKPOINTS.VERY_HIGH) {
      const ratio = getRangeRatio(tpsValue, TPS_BREAKPOINTS.VERY_HIGH, TPS_BREAKPOINTS.VERY_HIGH * 2);
      sizeRatio = 0.2 - (ratio * 0.1); // Decrease size as TPS increases
      speedRatio = 1.0 + (ratio * 0.5); // Increase speed
      spawnMultiplier = 0.1 * (1 + ratio); // Increase spawn rate
    } else if (tpsValue >= TPS_BREAKPOINTS.HIGH) {
      const ratio = getRangeRatio(tpsValue, TPS_BREAKPOINTS.HIGH, TPS_BREAKPOINTS.VERY_HIGH);
      sizeRatio = 0.35 - (ratio * 0.15);
      speedRatio = 0.85 + (ratio * 0.15);
      spawnMultiplier = 0.08 * (1 + ratio * 0.5);
    } else if (tpsValue >= TPS_BREAKPOINTS.MEDIUM_HIGH) {
      const ratio = getRangeRatio(tpsValue, TPS_BREAKPOINTS.MEDIUM_HIGH, TPS_BREAKPOINTS.HIGH);
      sizeRatio = 0.5 - (ratio * 0.15);
      speedRatio = 0.7 + (ratio * 0.15);
      spawnMultiplier = 0.05 * (1 + ratio * 0.6);
    } else if (tpsValue >= TPS_BREAKPOINTS.MEDIUM) {
      const ratio = getRangeRatio(tpsValue, TPS_BREAKPOINTS.MEDIUM, TPS_BREAKPOINTS.MEDIUM_HIGH);
      sizeRatio = 0.7 - (ratio * 0.2);
      speedRatio = 0.5 + (ratio * 0.2);
      spawnMultiplier = 0.03 * (1 + ratio * 0.7);
    } else if (tpsValue >= TPS_BREAKPOINTS.LOW) {
      const ratio = getRangeRatio(tpsValue, TPS_BREAKPOINTS.LOW, TPS_BREAKPOINTS.MEDIUM);
      sizeRatio = 0.85 - (ratio * 0.15);
      speedRatio = 0.4 + (ratio * 0.1);
      spawnMultiplier = 0.015 * (1 + ratio * 0.8);
    }
  
    const size = BASE_PARTICLE_SIZE.MIN + (BASE_PARTICLE_SIZE.MAX - BASE_PARTICLE_SIZE.MIN) * sizeRatio;
    const speed = BASE_SPEED.MIN + (BASE_SPEED.MAX - BASE_SPEED.MIN) * speedRatio;
  
    return { size, speed, spawnMultiplier };
  };
  
  const getSpawnCount = () => {
    const tpsValue = tpsRef.current;
    const tpsPerFrame = getTpsPerFrame(tpsValue);
  
    // For very low TPS, use exact representation
    if (tpsValue <= TPS_BREAKPOINTS.VERY_LOW) {
      const exactSpawnCount = tpsPerFrame;
      const integerPart = Math.floor(exactSpawnCount);
      const fractionalPart = exactSpawnCount - integerPart;
      return integerPart + (Math.random() < fractionalPart ? 1 : 0);
    }
  
    // For higher TPS, use logarithmic scaling
    const { spawnMultiplier } = getParticleProperties();
    const logScale = Math.log10(Math.max(1, tpsValue));
    const baseCount = Math.min(100, logScale * spawnMultiplier * 10);
  
    // Add burst effect for sudden TPS changes
    const tpsChange = Math.abs(tpsValue - previousTpsRef.current);
    const changeRatio = tpsChange / Math.max(previousTpsRef.current, 1);
    const burstMultiplier = 1 + (changeRatio * 2);
  
    previousTpsRef.current = tpsValue;
  
    return Math.max(1, Math.min(40, baseCount * burstMultiplier));
  };
  
  const createParticle = (): Particle => {
    const { size, speed } = getParticleProperties();
    const sizeVariance = size * 0.2; // Increased variance
    const speedVariance = speed * 0.1; // Increased variance
  
    // Add some randomness to particle paths
    const angleVariance = (Math.random() - 0.5) * 0.2;
  
    return {
      x: Math.random() * width,
      y: -10,
      radius: Math.max(BASE_PARTICLE_SIZE.MIN, size - Math.random() * sizeVariance),
      speed: speed + Math.random() * speedVariance,
      opacity: 0.7 + Math.random() * 0.3,
    };
  };

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const updateParticles = (timestamp: number) => {
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < 16) {
        return;
      }
      lastFrameTimeRef.current = timestamp;

      ctx.fillStyle = "transparent";
      // ctx.fillStyle = "#F5961E";
      ctx.clearRect(0, 0, width, height);

      // Only spawn new particles if we're under the current TPS representation
      if (timestamp - lastSpawnRef.current >= SPAWN_INTERVAL) {
        const currentTps = tpsRef.current;
        const visibleParticleTarget = Math.min(
          PARTICLE_BUFFER_SIZE,
          currentTps
        );

        if (particleCountRef.current < visibleParticleTarget) {
          const spawnCount = Math.min(
            getSpawnCount(),
            visibleParticleTarget - particleCountRef.current
          );

          for (let i = 0; i < spawnCount; i++) {
            if (particlesRef.current.length < PARTICLE_BUFFER_SIZE) {
              particlesRef.current.push(createParticle());
            }
          }
        }
        lastSpawnRef.current = timestamp;
      }

      ctx.fillStyle = "rgba(142, 134, 219, 0.8)";
      const newParticles: Particle[] = [];
      const fadeStart = height * 0.75;

      for (const particle of particlesRef.current) {
        particle.y += particle.speed;

        if (particle.y > fadeStart) {
          particle.opacity *= 0.95;
        }

        if (particle.y < height && particle.opacity > 0.05) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 48, 48, ${particle.opacity})`;
          ctx.fill();

          // Add white stroke/outline
          ctx.strokeStyle = `rgba(255, 255, 255, ${particle.opacity})`; // White outline that fades with the particle
          ctx.lineWidth = 0.75;
          ctx.stroke();
          newParticles.push(particle);
        }
      }

      particlesRef.current = newParticles;
      particleCountRef.current = newParticles.length;
    };

    let animationFrame: number;
    const animate = (timestamp: number) => {
      updateParticles(timestamp);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      particlesRef.current = [];
      particleCountRef.current = 0;
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        backgroundColor: "transparent",
        width: "100%",
        height: "100%",
      }}
    />
  );
};


export const VisualizerContainer: React.FC<{
  tps: number;
  formattedTps: string;
}> = ({ tps, formattedTps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 800,
    height: 600,
  });
  const [isDimensionsSettled, setIsDimensionsSettled] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.floor(rect.width * 0.95),
          height: Math.floor(rect.height * 0.95),
        });
        setIsDimensionsSettled(true);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center items-center w-full h-full min-h-[50vh]"
    >
      {/* Frame Image - Full size */}
      <div className="absolute inset-0">
        <Image
          src="/frame.png"
          alt="Frame"
          fill
          className="h-full w-full"
          style={{
            objectFit: "fill",
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
          }}
          priority
        />
      </div>

      {/* Particle System - Smaller and centered */}
      <div className="z-20">
        <div className="relative w-[100%] h-[100%]">
          {/* Container for ParticleSystem with reduced size */}
          <ParticleSystem
            tps={tps}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      </div>
    </div>
  );
};
