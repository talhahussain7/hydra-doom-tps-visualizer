import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import MetricsCard from "./sections/metrics-card";
import { VisualizerContainer } from "./sections/visualizer";
import {
  GlobalStatsFormatted,
  SampleTransaction,
  AnimatedParticle,
} from "@/types";
import LoadingScreen from "./spalsh";

interface DashboardProps {
  stats: GlobalStatsFormatted & {
    getSampleTx: () => { tx: SampleTransaction | null; fetchedAt: Date | null };
  };
  isLoading: boolean;
  pageTitle?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  stats,
  pageTitle = "Hydra X Doom Tournament Visualizer",
  isLoading,
}) => {
  const [animatingParticle, setAnimatingParticle] =
    useState<AnimatedParticle | null>(null);
  const [showTxDetails, setShowTxDetails] = useState(false);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedTx, setSelectedTx] = useState<SampleTransaction>();
  const [fetchTime, setFetchTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading && showLoadingScreen) {
      setTimeout(() => {
        setIsTransitioning(true);
      }, 250);
    }
  }, [isLoading, showLoadingScreen]);

  const handleTransitionEnd = () => {
    if (isTransitioning) {
      setShowLoadingScreen(false);
      setShowDashboard(true);
    }
  };

  const animateParticle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setShowTxDetails(false);
    const visualizerRect = containerRef.current?.getBoundingClientRect();
    const buttonRect = e.currentTarget.getBoundingClientRect();

    if (!visualizerRect) return;

    const startX =
      visualizerRect.left +
      (visualizerRect.width * 0.2 + Math.random() * visualizerRect.width * 0.6);
    const startY =
      visualizerRect.top +
      (visualizerRect.height * 0.4 +
        Math.random() * visualizerRect.height * 0.3);

    const newParticle: AnimatedParticle = {
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      targetX: buttonRect.left + buttonRect.width / 2,
      targetY: buttonRect.top + buttonRect.height / 2,
      progress: 0,
      opacity: 1,
      scale: 1,
      rotation: Math.random() * 180,
      velocity: {
        x: (-1 + Math.random() * 2) * 0.5,
        y: 1 + Math.random(),
      },
    };

    setAnimatingParticle(newParticle);

    const animate = () => {
      setAnimatingParticle((prev) => {
        if (!prev) return null;

        const newProgress = prev.progress + 0.008;
        if (newProgress >= 1) {
          setShowTxDetails(true);
          return null;
        }

        const easeOutCubic = (x: number): number => {
          return 1 - Math.pow(1 - x, 3);
        };

        const eased = easeOutCubic(newProgress);
        let currentX, currentY;

        if (newProgress < 0.4) {
          currentX = prev.currentX + prev.velocity.x;
          currentY = prev.currentY + prev.velocity.y;
          prev.velocity.x += (prev.targetX - prev.currentX) * 0.0008;
          prev.velocity.y *= 0.95;
        } else {
          const t = (newProgress - 0.4) / 0.6;
          const bezierT = easeOutCubic(t);
          const controlX1 =
            prev.currentX + (prev.targetX - prev.currentX) * 0.3;
          const controlX2 =
            prev.currentX + (prev.targetX - prev.currentX) * 0.7;
          const controlY1 = prev.currentY - 50;
          const controlY2 = prev.targetY - 30;
          const t1 = 1 - bezierT;
          const t2 = bezierT;

          currentX =
            Math.pow(t1, 3) * prev.currentX +
            3 * Math.pow(t1, 2) * t2 * controlX1 +
            3 * t1 * Math.pow(t2, 2) * controlX2 +
            Math.pow(t2, 3) * prev.targetX;

          currentY =
            Math.pow(t1, 3) * prev.currentY +
            3 * Math.pow(t1, 2) * t2 * controlY1 +
            3 * t1 * Math.pow(t2, 2) * controlY2 +
            Math.pow(t2, 3) * prev.targetY;
        }

        const scaleEffect =
          newProgress < 0.4
            ? 1
            : 1 + Math.sin((newProgress - 0.4) * Math.PI) * 0.8;
        const rotationSpeed =
          newProgress < 0.4 ? prev.velocity.y * 5 : 360 * (newProgress - 0.4);

        return {
          ...prev,
          currentX,
          currentY,
          progress: newProgress,
          opacity: newProgress < 0.4 ? 1 : Math.min(1, 1.5 - eased),
          scale: scaleEffect,
          rotation: prev.rotation + rotationSpeed,
          velocity: prev.velocity,
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const handleGetTx = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { tx, fetchedAt } = stats.getSampleTx();
    if (tx) {
      animateParticle(e);
      setSelectedTx({ cbor: tx.cbor, tx_id: tx.tx_id });
      setFetchTime(fetchedAt);
    } else {
      setShowTxDetails(true);
      setSelectedTx(undefined);
      setTimeout(() => {
        setShowTxDetails(false);
      }, 3000);
    }
  };

  return (
    <>
      {showLoadingScreen && (
        <LoadingScreen
          isTransitioning={isTransitioning}
          onTransitionEnd={handleTransitionEnd}
        />
      )}

      <div
        ref={containerRef}
        className={`min-h-screen relative bg-black transition-opacity duration-1000 ${
          showDashboard ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/bg-dark.png"
            alt="Background"
            fill
            className="object-cover object-center"
            priority
            quality={100}
          />
        </div>

        <div className="lg:container lg:mx-auto relative z-10 w-full min-h-screen p-3 md:p-4 space-y-4">
          <header className="mt-3 mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image
                src="/hydra.png"
                alt="Hydra Logo"
                width={40}
                height={40}
                className=""
              />
              <div>
                <h2
                  className="text-xl md:text-2xl lg:text-3xl font-black uppercase text-yellow-500"
                  style={{
                    textShadow:
                      "rgb(219, 17, 2) 0px 0px 10px, rgb(242, 88, 31) 0px 0px 20px, rgb(242, 88, 31) 0px 0px 50px, rgba(255, 5, 5, 0.25) 0px 0px 50px",
                  }}
                >
                  {pageTitle}
                </h2>
                <div className="flex flex-row gap-2 items-center">
                  <p className="text-white/90 font-normal text-lg sm:text-xl md:text-2xl">
                    <span className="font-semibold">
                      {" "}
                      {stats.formatted_tps}
                    </span>{" "}
                    Transactions/Sec
                  </p>
                  <p className="text-base sm:text-lg md:text-xl bg-[#FF3030]/80 border border-[#FF3030] text-white px-2 py-1">
                    <span className="font-semibold">
                      {stats.formatted_peak_txs_per_second}
                    </span>{" "}
                    Peak TPS
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Image
                className="hidden sm:block w-28 h-16"
                src="/hydra-doom.png"
                width={100}
                height={50}
                alt="logo"
              />
            </div>
          </header>

          <div className="w-full mx-auto h-full">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 h-full">
              <div
                className="lg:col-span-3 relative rounded-md overflow-hidden"
                style={{
                  height: "calc(100vh - 10rem)",
                  minHeight: "60vh",
                }}
              >
                <div className="h-full w-full">
                  <VisualizerContainer
                    tps={stats.txs_per_second}
                    formattedTps={stats.formatted_tps}
                  />
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-3 relative">
                <MetricsCard stats={stats} />

                <div
                  className={`
                relative w-full left-0 
                transition-all duration-500 ease-out
                ${
                  showTxDetails
                    ? "opacity-100 top-0 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }
              `}
                >
                  <div className="mb-1 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#FF3030] rounded-full" />
                    <h3 className="font-black text-xl lg:text-2xl bg-gradient-to-b from-white to-[#cbcbcb] bg-clip-text text-transparent shadow-sm uppercase">
                      Transaction Details
                    </h3>
                  </div>

                  <div className="bg-[#1C1515]/90 backdrop-blur-sm border-2 border-[#FF3030] p-2 space-y-2 text-lg">
                    {selectedTx ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-[#1C1515]/50 border border-[#FF3030]">
                          <div className="text-white">Transaction Hash</div>
                          <div
                            className="text-[#FFFB24] font-bold text-sm md:text-base"
                            style={{
                              textShadow:
                                "rgb(219, 17, 2) 0px 0px 5px, rgb(242, 88, 31) 0px 0px 20px, rgb(242, 88, 31) 0px 0px 25px, rgba(255, 5, 5, 0.25) 0px 0px 25px",
                            }}
                          >
                            {selectedTx?.tx_id}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="col-span-3 p-2 bg-[#1C1515]/50 border border-[#FF3030]">
                            <div className="text-white">Cbor</div>
                            <div
                              className="text-[#FFFB24] font-bold flex flex-grow text-sm md:text-base lg:text-lg"
                              style={{
                                textShadow:
                                  "rgb(219, 17, 2) 0px 0px 5px, rgb(242, 88, 31) 0px 0px 20px, rgb(242, 88, 31) 0px 0px 25px, rgba(255, 5, 5, 0.25) 0px 0px 25px",
                              }}
                            >
                              {selectedTx?.cbor && selectedTx.cbor.length > 50
                                ? `${selectedTx.cbor.slice(
                                    0,
                                    15
                                  )}...${selectedTx.cbor.slice(
                                    selectedTx.cbor.length - 15
                                  )}`
                                : selectedTx?.cbor}
                            </div>
                          </div>
                          <div className="p-2 bg-[#1C1515]/50 border border-[#FF3030]">
                            <div className="text-white">Time</div>
                            <div
                              className="text-[#FFFB24] font-bold"
                              style={{
                                textShadow:
                                  "rgb(219, 17, 2) 0px 0px 5px, rgb(242, 88, 31) 0px 0px 20px, rgb(242, 88, 31) 0px 0px 25px, rgba(255, 5, 5, 0.25) 0px 0px 25px",
                              }}
                            >
                              {fetchTime
                                ? new Date(fetchTime).toLocaleTimeString()
                                : "Just now"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-[#FFFB24] font-bold">
                          Couldn't pull a transaction at this time.
                          <br />
                          Please try again later.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mt-5 h-full md:flex md:flex-col md:justify-end">
                  <button
                    onClick={handleGetTx}
                    className={cn(
                      "text-base md:text-lg w-full font-semibold h-12 hover:shadow-2xl text-white transition-colors duration-200 shadow-lg",
                      animatingParticle
                        ? "bg-[#ff2f2f]"
                        : "bg-[#fc4141] hover:bg-[#ff2f2f]"
                    )}
                  >
                    {animatingParticle
                      ? "Fetching Transaction Details..."
                      : "Get Transaction"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Particle */}
        {animatingParticle && (
          <div
            className="fixed pointer-events-none"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${animatingParticle.currentX}px, ${animatingParticle.currentY}px) scale(${animatingParticle.scale}) rotate(${animatingParticle.rotation}deg)`,
              opacity: animatingParticle.opacity,
              transition: "transform 0.05s linear",
            }}
          >
            <div
              className="w-5 h-5 rounded-full bg-[#FF3030] relative"
              style={{
                boxShadow: `
                0 0 15px rgba(255, 48, 48, 0.6),
                0 0 30px rgba(255, 48, 48, 0.3)
              `,
              }}
            >
              <div className="absolute inset-1 rounded-full bg-white/40 blur-[1px]" />
              <div
                className="absolute -inset-1 animate-ping-slow opacity-20 bg-[#FF3030] rounded-full"
                style={{
                  animationDuration: "0.75s",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
