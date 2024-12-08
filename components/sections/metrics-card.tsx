import { GlobalStats } from "@/types";
import { FC } from "react";

interface MetricsCardProps {
  stats: GlobalStats;
}

const MetricsCard: FC<MetricsCardProps> = ({ stats }) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const metricsData = [
    {
      label: "Transaction Rate",
      value: `${formatNumber(stats.txs_per_second)} TPS`,
    },
    { label: "Total Txs", value: formatNumber(stats.total_txs) },
    { label: "Total Bytes", value: formatNumber(stats.total_bytes) },
    { label: "Bytes/Second", value: formatNumber(stats.bytes_per_second) },
    { label: "Total Games", value: formatNumber(stats.total_games) },
    { label: "Active Games", value: formatNumber(stats.active_games) },
    { label: "Total Players", value: formatNumber(stats.total_players) },
    { label: "Active Players", value: formatNumber(stats.active_players) },
    { label: "Total Kills", value: formatNumber(stats.total_kills) },
    { label: "Kills/Minute", value: formatNumber(stats.kills_per_minute) },
  ];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
        <h3 className="font-black text-xl lg:text-2xl bg-gradient-to-b from-white to-[#cbcbcb] bg-clip-text text-transparent shadow-sm uppercase">
          Global Totals
        </h3>
      </div>

      <div className="bg-[#1C1515] border-2 border-[#FF3030] backdrop-blur-sm px-3 py-2 shadow-xl">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {metricsData.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-base md:text-lg"
            >
              <span className="text-white">{metric.label}</span>
              <span
                className="text-[#FFFB24] font-bold"
                style={{
                  textShadow:
                    "rgb(219, 17, 2) 0px 0px 5px, rgb(242, 88, 31) 0px 0px 15px, rgb(242, 88, 31) 0px 0px 15px, rgba(255, 5, 5, 0.25) 0px 0px 15px",
                }}
              >
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
