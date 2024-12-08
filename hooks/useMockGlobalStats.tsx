"use client";

import { useState, useEffect } from "react";
import {GlobalStats} from '@/types'


export const useMockGlobalStats = () => {
  const [stats, setStats] = useState<GlobalStats>({
    total_txs: 0,
    txs_per_second: 0,
    total_bytes: 0,
    bytes_per_second: 0,
    total_games: 75,
    active_games: 0,
    total_players: 981,
    active_players: 0,
    total_bots: 0,
    active_bots: 0,
    total_kills: 314,
    kills_per_minute: 0,
    total_suicides: 0,
    suicides_per_minute: 0,
    peak_txs_per_second:0
  });

  useEffect(() => {
    const startTime = Date.now();
    const BASE_TPS = 1500000; // 1.5M baseline TPS

    const generatePhaseValue = (elapsedSeconds: number) => {
        const initialRampDuration = 60; // Initial ramp-up to 100% after 10 seconds
        const phaseDuration = 35; // Each phase lasts 35 seconds now
  
        // New phase: Gradual ramp from 0 to 100 in the first 10 seconds
        if (elapsedSeconds <= 20) {
          return elapsedSeconds / 20;  // Ramps from 0 to 1 over 10 seconds
        }
  
        // Existing phases after the initial ramp-up
        if (elapsedSeconds <= initialRampDuration + 10) {
          const progress = (elapsedSeconds - 10) / initialRampDuration;
          return Math.pow(progress, 3); // Cubic easing for smooth ramp-up
        }
  
        // Normalize elapsed time for phase calculation
        const normalizedTime = elapsedSeconds - initialRampDuration - 10;
        const phase = Math.floor(normalizedTime / phaseDuration) % 8;
        const phaseProgress = (normalizedTime % phaseDuration) / phaseDuration;
  
        switch (phase) {
          case 0: // Steady state
            return 1.0 + (Math.random() - 0.5) * 0.1;
  
          case 1: // Gradual decline
            return 1.0 - (phaseProgress * 0.4);
  
          case 2: // High activity spike (sudden)
            return 1.4 + Math.sin(phaseProgress * Math.PI * 2) * 0.2;
  
          case 3: // Recovery oscillation
            return 1.0 + Math.sin(phaseProgress * Math.PI * 4) * 0.3;
  
          case 4: // Network issues simulation (low values)
            return 0.2 + Math.random() * 0.2;
  
          case 5: // Fast recovery with variation
            return 0.4 + (phaseProgress * 0.6) + Math.sin(phaseProgress * Math.PI * 6) * 0.1;
  
          case 6: // Peak performance
            return 1.6 + Math.sin(phaseProgress * Math.PI * 8) * 0.15;
  
          case 7: // Stabilization
            const stabilityFactor = 1.0 - (phaseProgress * 0.6);
            return 1.0 + (Math.random() - 0.5) * stabilityFactor;
  
          default:
            return 1.0;
        }
      };
    const addNoise = (value: number, noiseFactor = 0.05) => {
      return value * (1 + (Math.random() - 0.5) * noiseFactor);
    };

    const updateStats = (elapsedSeconds: number) => {
      const phaseValue = generatePhaseValue(elapsedSeconds);
      const tps = Math.floor(BASE_TPS * phaseValue);
      const txsIncrement = tps;
      const bytesIncrement = Math.floor(txsIncrement * 80 + Math.random() * 500);

      // Scale other metrics based on phase value
      const killsIncrement = Math.random() < (0.005 * phaseValue) ? 1 : 0;
      const suicidesIncrement = Math.random() < (0.001 * phaseValue) ? 1 : 0;

      return {
        total_txs: stats.total_txs + txsIncrement,
        txs_per_second: Math.floor(addNoise(tps)),
        total_bytes: stats.total_bytes + bytesIncrement,
        bytes_per_second: addNoise(bytesIncrement),
        total_games: stats.total_games,
        active_games: Math.floor(phaseValue * 15),
        total_players: stats.total_players,
        active_players: Math.floor(phaseValue * 600),
        total_bots: stats.total_bots,
        active_bots: Math.floor(phaseValue * 100),
        total_kills: stats.total_kills + killsIncrement,
        kills_per_minute: Math.floor(tps / 30000),
        total_suicides: stats.total_suicides + suicidesIncrement,
        suicides_per_minute: Math.floor(tps / 1000000),
        peak_txs_per_second: 2500000
      };
    };

    const updateInterval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      setStats((currentStats) => updateStats(elapsedSeconds));
    }, 1000);

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  const getSampleTx = () => ({
    tx: {
      cbor: "84a3008182582036c82965fc2868b81083c078e359742a1ec1416efe09c4b37d76be4ed490c7d7",
      tx_id: "1dae79e996bccee24e4cdbc0757ef1c7f9477b72cc8366bfa83a264b4e663ccd"
    },
    fetchedAt: new Date()
  });

  return { ...stats, getSampleTx };
};

export const useFormattedMockGlobalStats = () => {
  const { getSampleTx, ...stats } = useMockGlobalStats();

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return {
    ...stats,
    getSampleTx,
    formatted_txs: formatNumber(stats.total_txs),
    formatted_bytes: formatNumber(stats.total_bytes),
    formatted_tps: formatNumber(stats.txs_per_second),
    formatted_kills: formatNumber(stats.total_kills),
    formatted_peak_txs_per_second:formatNumber(stats.peak_txs_per_second)
  };
};


