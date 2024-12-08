export type SampleTransaction = {
  cbor: string;
  tx_id: string;
}

export interface SampleTransactions {
  txs: SampleTransaction[]
  fetchedAt: Date
}

export type GlobalStats = {
  peak_txs_per_second: number,
  total_txs: number;
  txs_per_second: number;
  total_bytes: number;
  bytes_per_second: number;
  total_games: number;
  active_games: number;
  total_players: number;
  active_players: number;
  total_bots: number;
  active_bots: number;
  total_kills: number;
  kills_per_minute: number;
  total_suicides: number;
  suicides_per_minute: number;
}

export type GlobalStatsFormatted = GlobalStats & {
  formatted_txs: string;
  formatted_bytes: string;
  formatted_tps: string;
  formatted_kills: string;
  formatted_peak_txs_per_second: string;
};

export type AnimatedParticle = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  progress: number;
  opacity: number;
  scale: number;
  rotation: number;
  velocity: {
    x: number;
    y: number;
  };
}