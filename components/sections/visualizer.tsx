"use client";
import React, { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Image from "next/image";
import { CircleParticleSystem } from "./particles/circular-particles";

interface VisualizerContainerProps {
  tps: number;
  formattedTps: string;
}

export const VisualizerContainer: React.FC<VisualizerContainerProps> = ({
  tps,
  formattedTps,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.floor(rect.width * 0.95),
          height: Math.floor(rect.height * 0.95),
        });
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

      <div className="z-20  w-[95%] h-[95%]">
        <Canvas
          camera={{
            position: [0, 0, 100],
            fov: 45,
            near: 1,
            far: 500,
          }}
          gl={{
            antialias: false,
            powerPreference: "high-performance",
          }}
        >
          <CircleParticleSystem tps={tps} />
        </Canvas>
      </div>
    </div>
  );
};
