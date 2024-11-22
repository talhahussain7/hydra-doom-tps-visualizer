"use client"


// hooks/useMockTPS.ts
import { useState, useEffect } from 'react';

export const useMockTPS = () => {
  const [tps, setTPS] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const generateTPS = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

      if (elapsedSeconds <= 10) {
        // First 10 seconds: 0-100 TPS
        return Math.floor(Math.random() * 100);
      } else if (elapsedSeconds <= 20) {
        // Next 10 seconds: 1000-10000 TPS
        return Math.floor(Math.random() * 9000 + 1000);
      } else if (elapsedSeconds <= 30) {
        // Next 10 seconds: Ramping up to 1M-1.5M
        const progress = (elapsedSeconds - 20) / 10; // 0 to 1
        const baseValue = 10000 + (1000000 - 10000) * progress;
        return Math.floor(Math.random() * 200000 + baseValue);
      } else {
        // After 30 seconds: Forever vary between 1M-1.5M
        return Math.floor(Math.random() * 500000 + 1000000);
      }
    };

    // Smooth transition helper
    const smoothTransition = (current: number, target: number) => {
      const diff = target - current;
      return current + (diff * 0.3); // 30% closer to target each frame
    };

    let currentTPS = 0;
    const updateInterval = setInterval(() => {
      const targetTPS = generateTPS();
      // Smooth out the transition
      currentTPS = smoothTransition(currentTPS, targetTPS);
      setTPS(Math.floor(currentTPS));
    }, 1000);

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  return tps;
};

// Optional: Add a hook to get a formatted string version
export const useFormattedTPS = () => {
  const tps = useMockTPS();
  
  // Format large numbers with k, M suffix
  const formatTPS = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return {
    raw: tps,
    formatted: formatTPS(tps),
    withCommas: tps.toLocaleString()
  };
};
