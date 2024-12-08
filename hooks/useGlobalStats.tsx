"use client";

import { useState, useEffect } from "react";
import { GlobalStats, SampleTransaction, SampleTransactions } from "@/types";

interface UseApiGlobalStatsOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

const DEFAULT_POLLING_INTERVAL = 2500;
const GLOBAL_STATS_URL = `${process.env.NEXT_PUBLIC_API_URL}/global_stats`;
const SAMPLE_TX_URL = `${process.env.NEXT_PUBLIC_API_URL}/sample_transactions?count=5`;

export const useApiGlobalStats = (options: UseApiGlobalStatsOptions = {}) => {
  const { pollingInterval = DEFAULT_POLLING_INTERVAL, enabled = true } =
    options;

  const [stats, setStats] = useState<GlobalStats>({
    total_txs: 0,
    txs_per_second: 0,
    total_bytes: 0,
    bytes_per_second: 0,
    total_games: 0,
    active_games: 0,
    total_players: 0,
    active_players: 0,
    total_bots: 0,
    active_bots: 0,
    total_kills: 0,
    kills_per_minute: 0,
    total_suicides: 0,
    suicides_per_minute: 0,
    peak_txs_per_second: 0,
  });

  const [currentTransactions, setCurrentTransactions] =
    useState<SampleTransactions>({
      txs: [],
      fetchedAt: new Date(),
    });

  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getSampleTx = (): {
    tx: SampleTransaction | null;
    fetchedAt: Date | null;
  } => {
    if (currentTransactions.txs.length === 0)
      return { tx: null, fetchedAt: null };

    const updatedTxs = [...currentTransactions.txs];
    const tx = updatedTxs.pop()!;

    setCurrentTransactions((prev) => ({
      ...prev,
      txs: updatedTxs,
    }));

    return { tx, fetchedAt: currentTransactions.fetchedAt };
  };

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        const [statsResponse, txResponse] = await Promise.all([
          fetch(GLOBAL_STATS_URL),
          fetch(SAMPLE_TX_URL),
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const { as_of, ...data } = statsData;
          setStats(data as GlobalStats);
        }

        if (txResponse.ok) {
          const txData = await txResponse.json();
          setCurrentTransactions({
            txs: txData,
            fetchedAt: new Date(),
          });
        }

        if (statsResponse.ok || txResponse.ok) {
          setError(null);
        } else {
          throw new Error(
            `HTTP error! Stats: ${statsResponse.status}, Tx: ${txResponse.status}`
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch data")
        );
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, pollingInterval);
    return () => clearInterval(intervalId);
  }, [pollingInterval, enabled]);

  return { stats, currentTransactions, getSampleTx, error, isLoading };
};

export const useFormattedApiGlobalStats = (
  options?: UseApiGlobalStatsOptions
) => {
  const { stats, currentTransactions, getSampleTx, error, isLoading } =
    useApiGlobalStats(options);

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return Math.floor(value).toFixed(0);
  };

  return {
    ...stats,
    currentTransactions,
    getSampleTx,
    formatted_txs: formatNumber(stats.total_txs),
    formatted_peak_txs_per_second: formatNumber(stats.peak_txs_per_second),
    formatted_bytes: formatNumber(stats.total_bytes),
    formatted_tps: formatNumber(stats.txs_per_second),
    formatted_kills: formatNumber(stats.total_kills),
    error,
    isLoading,
  };
};
