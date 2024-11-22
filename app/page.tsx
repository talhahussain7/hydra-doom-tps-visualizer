"use client";
import { useFormattedTPS } from "@/hooks/seMockTPS";
import { VisualizerContainer } from "@/sections/visualizer";
import Image from "next/image";
import React, { useState, useRef } from "react";
import * as htmlToImage from "html-to-image";
import { cn } from "@/lib/utils";

interface AnimatedParticle {
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

export default function DashboardLayout() {
  const { raw: tps, formatted: formattedTPS } = useFormattedTPS();
  const [animatingParticle, setAnimatingParticle] =
    useState<AnimatedParticle | null>(null);
  const [showTxDetails, setShowTxDetails] = useState(false);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isCapturing, setIsCapturing] = useState(false);

  const animateParticle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setShowTxDetails(false);
    const visualizerRect = containerRef.current?.getBoundingClientRect();
    const buttonRect = e.currentTarget.getBoundingClientRect();

    if (!visualizerRect) return;
    // Get a random position from the middle section of the visualizer
    // where particles are more likely to be visible
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
      rotation: Math.random() * 180, // Reduced initial rotation
      velocity: {
        x: (-1 + Math.random() * 2) * 0.5, // Smaller random horizontal velocity
        y: 1 + Math.random(), // Reduced vertical velocity
      },
    };

    setAnimatingParticle(newParticle);

    const animate = () => {
      setAnimatingParticle((prev) => {
        if (!prev) return null;

        // Slower animation speed
        const newProgress = prev.progress + 0.008; // Reduced from 0.015
        if (newProgress >= 1) {
          setShowTxDetails(true);
          return null;
        }

        // Improved easing function for smoother motion
        const easeOutCubic = (x: number): number => {
          return 1 - Math.pow(1 - x, 3);
        };

        const eased = easeOutCubic(newProgress);

        // Modified phase-based animation
        let currentX, currentY;

        if (newProgress < 0.4) {
          // Increased initial phase duration
          // Phase 1: Initial hovering motion
          currentX = prev.currentX + prev.velocity.x;
          currentY = prev.currentY + prev.velocity.y;

          // Gentler curve toward target
          prev.velocity.x += (prev.targetX - prev.currentX) * 0.0008;
          prev.velocity.y *= 0.95; // Dampen vertical velocity more gradually
        } else {
          // Phase 2: Direct path to button with slight arc
          const t = (newProgress - 0.4) / 0.6; // Normalize remaining progress
          const bezierT = easeOutCubic(t);

          // Modified control points for more direct path
          const controlX1 =
            prev.currentX + (prev.targetX - prev.currentX) * 0.3;
          const controlX2 =
            prev.currentX + (prev.targetX - prev.currentX) * 0.7;
          const controlY1 = prev.currentY - 50; // Reduced arc height
          const controlY2 = prev.targetY - 30;

          // Cubic Bezier curve for smoother path
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

        // Smoother scaling effect
        const scaleEffect =
          newProgress < 0.4
            ? 1
            : 1 + Math.sin((newProgress - 0.4) * Math.PI) * 0.8; // Reduced scale

        // Gentler rotation
        const rotationSpeed =
          newProgress < 0.4
            ? prev.velocity.y * 5 // Reduced initial rotation
            : 360 * (newProgress - 0.4); // Single rotation during targeting

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

  const shareOnTwitter = async () => {
    if (!containerRef.current) return;

    try {
      setIsCapturing(true);

      // Take screenshot
      const dataUrl = await htmlToImage.toPng(containerRef.current, {
        quality: 1.0,
        backgroundColor: "#1a1147",
        style: {
          // Ensure proper rendering
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      // Create a temporary link
      const blob = await fetch(dataUrl).then((res) => res.blob());
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = "hydra-metrics.png";
      link.href = dataUrl;
      link.click();

      // Prepare Twitter intent URL
      const tweetText = `Currently processing ${formattedTPS} transactions per second on Hydra! 🚀\n\n#Hydra #Cardano #Blockchain`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        tweetText
      )}`;

      // Open tweet dialog
      window.open(twitterUrl, "_blank");

      // Cleanup
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error capturing screenshot:", error);
    } finally {
      setIsCapturing(false);
    }
  };
  return (
    <div ref={containerRef} className="min-h-screen relative bg-black">
      {/* Background */}
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

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen p-4 md:p-10 space-y-4">
        <header className="container mx-auto flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Image
              className="w-10 h-10" // This is already correct at 32x32px
              src={"/hydra.png"}
              width={100} // Updated to match className dimensions
              height={64} // Updated to match className dimensions
              alt="logo"
            />
            <div>
              {/* <h2 className="text-white font-black uppercase text-xl sm:text-3xl">
                Hydra X Doom Tournament Visualizer
              </h2> */}

              <h2
                className="text-xl sm:text-3xl font-black uppercase text-yellow-500"
                style={{
                  textShadow:
                    "rgb(219, 17, 2) 0px 0px 10px, rgb(242, 88, 31) 0px 0px 20px, rgb(242, 88, 31) 0px 0px 50px, rgba(255, 5, 5, 0.25) 0px 0px 50px",
                }}
              >
                Hydra X Doom Tournament Visualizer
              </h2>
              <p className="text-white/90 font-medium text-lg">
                {formattedTPS} Transactions Per Second
              </p>
            </div>
          </div>
          <div>
            <Image
              className="hidden sm:block w-28 h-16" // This is already correct at 32x32px
              src={"/hydra-doom.png"}
              width={100} // Updated to match className dimensions
              height={50} // Updated to match className dimensions
              alt="logo"
            />
          </div>
        </header>
        <div className="container mx-auto h-full">
          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 h-full">
            {/* Visualizer Section - Fixed stable height */}
            <div
              className="lg:col-span-3 relative rounded-md overflow-hidden"
              style={{
                height: "calc(100vh - 10rem)",
                minHeight: "60vh",
              }}
            >
              <div className="h-full w-full">
                <VisualizerContainer tps={tps} formattedTps={formattedTPS} />
              </div>
            </div>

            {/* Right Panel - Using absolute positioning for transaction details */}
            <div className="lg:col-span-2 flex flex-col gap-3 relative">
              {/* Metrics Panel */}
              <div className="flex flex-col gap-2">
                <h2 className="font-black text-2xl bg-gradient-to-b from-white to-[#cbcbcb] bg-clip-text text-transparent shadow-sm uppercase">
                  Global Totals
                </h2>

                <div className="bg-[#1C1515] border-4 border-[#FF3030] backdrop-blur-sm p-6 shadow-xl text-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white">Transaction Rate</span>
                      <span className="text-[#FFFB24] font-bold">
                        {formattedTPS} TPS
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Active Hydra Heads</span>
                      <span className="text-[#FFFB24] font-bold">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Total Transactions</span>
                      <span className="text-[#FFFB24] font-bold">
                        1,234,567
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Details - Now absolutely positioned */}
              <div
                className={`
                  relative w-full left-0 
                  transition-all duration-500 ease-out
                  ${
                    showTxDetails
                      ? "opacity-100 top-0 pointer-events-auto"
                      : "opacity-0  pointer-events-none"
                  }
                `}
              >
                <div className="bg-[#1C1515]/90 backdrop-blur-sm border-4 border-[#FF3030] p-6 space-y-4 text-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#FFFB24] rounded-full animate-pulse" />
                    <h3 className="text-white font-semibold text-xl">
                      Transaction Details
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
                      <div className=" text-white mb-1">Transaction Hash</div>
                      <div className="text-[#FFFB24]/90  font-semibold truncate">
                        0x7cd3c0d0f08e0d0c9b0e1c9d0e8f7a6b5c4d3e2f1
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
                        <div className=" text-white mb-1">Amount</div>
                        <div className="text-[#FFFB24]/90 font-semibold ">
                          458.23 ADA
                        </div>
                      </div>
                      <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
                        <div className=" text-white mb-1">Time</div>
                        <div className="text-[#FFFB24]/90 font-semibold ">
                          Just now
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-5 h-full md:flex md:flex-col md:justify-end">
                <button
                  onClick={animateParticle}
                  className={cn(
                    "w-full font-semibold h-12 hover:shadow-2xl text-white transition-colors duration-200 shadow-lg",
                    animatingParticle
                      ? "bg-[#ff2f2f]"
                      : "bg-[#fc4141] hover:bg-[#ff2f2f]"
                  )}
                >
                  {animatingParticle
                    ? "Fetching Transaction Details..."
                    : "Get Transaction"}
                </button>
                <button
                  onClick={shareOnTwitter}
                  disabled={isCapturing}
                  className={`
                    w-full shadow-xl h-12 bg-black hover:bg-black/90 
                    text-white font-medium transition-all duration-200 
                    border border-[#1DA1F2]/20 flex items-center justify-center gap-2
                    ${isCapturing ? "opacity-75 cursor-not-allowed" : ""}
                  `}
                >
                  {isCapturing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Capturing...</span>
                    </>
                  ) : (
                    <span>Share on X</span>
                  )}
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
  );
  // return (
  //   <div className="min-h-screen relative bg-black">
  //     {/* Background */}
  //     <div className="absolute inset-0 z-0">
  //       <Image
  //         src="/bg-dark.png"
  //         alt="Background"
  //         fill
  //         className="object-cover object-center"
  //         priority
  //         quality={100}
  //       />
  //     </div>

  //     {/* Main Content */}
  //     <div className="relative z-10 w-full min-h-screen p-4 md:p-6">
  //       <div className="container mx-auto h-full">
  //         {/* Grid Layout */}
  //         <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 h-full">
  //           {/* Visualizer Section */}
  //           <div
  //             ref={containerRef}
  //             className="lg:col-span-3 relative rounded-md overflow-hidden"
  //             style={{
  //               minHeight: '60vh',
  //               height: showTxDetails ? 'calc(100vh - 4rem)' : 'calc(100vh - 2rem)'
  //             }}
  //           >
  //             <div className="h-full w-full">
  //               <VisualizerContainer tps={tps} formattedTps={formattedTPS} />
  //             </div>
  //           </div>

  //           {/* Right Panel */}
  //           <div className="lg:col-span-2 flex flex-col gap-4">
  //             {/* Metrics Panel */}
  //             <div className="flex flex-col gap-2">
  //               <h2 className="font-black text-xl bg-gradient-to-b from-white to-[#cbcbcb] bg-clip-text text-transparent shadow-sm uppercase">
  //                 Global Totals
  //               </h2>

  //               <div className="bg-[#1C1515] border-4 border-[#FF3030] backdrop-blur-sm p-6 shadow-xl text-lg">
  //                 <div className="space-y-4">
  //                   <div className="flex items-center justify-between">
  //                     <span className="text-white">Transaction Rate</span>
  //                     <span className="text-[#FFFB24] font-bold">
  //                       {formattedTPS} TPS
  //                     </span>
  //                   </div>
  //                   <div className="flex items-center justify-between">
  //                     <span className="text-white">Active Hydra Heads</span>
  //                     <span className="text-[#FFFB24] font-bold">24</span>
  //                   </div>
  //                   <div className="flex items-center justify-between">
  //                     <span className="text-white">Total Transactions</span>
  //                     <span className="text-[#FFFB24] font-bold">1,234,567</span>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>

  //             {/* Transaction Details */}
  //             <div
  //               className={`
  //                 transition-all duration-500 ease-out
  //                 ${showTxDetails ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}
  //               `}
  //             >
  //               <div className="bg-[#1C1515]/90 backdrop-blur-sm border-4 border-[#FF3030] p-6 space-y-4">
  //                 <div className="flex items-center space-x-2">
  //                   <div className="w-2 h-2 bg-[#FFFB24] rounded-full animate-pulse" />
  //                   <h3 className="text-white font-semibold text-lg">
  //                     Transaction Details
  //                   </h3>
  //                 </div>

  //                 <div className="space-y-3">
  //                   <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //                     <div className="text-lg text-white mb-1">Transaction Hash</div>
  //                     <div className="text-white/90 text-lg truncate">
  //                       0x7cd3c0d0f08e0d0c9b0e1c9d0e8f7a6b5c4d3e2f1
  //                     </div>
  //                   </div>

  //                   <div className="grid grid-cols-2 gap-3">
  //                     <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //                       <div className="text-lg text-white mb-1">Amount</div>
  //                       <div className="text-white/90 font-medium text-lg">
  //                         458.23 ADA
  //                       </div>
  //                     </div>
  //                     <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //                       <div className="text-lg text-white mb-1">Time</div>
  //                       <div className="text-white/90 font-medium text-lg">
  //                         Just now
  //                       </div>
  //                     </div>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>

  //             {/* Action Buttons */}
  //             <div className="space-y-4 mt-auto">
  //               <button
  //                 onClick={animateParticle}
  //                 className={cn(
  //                   "w-full font-semibold h-12 hover:shadow-2xl text-white transition-colors duration-200 shadow-lg",
  //                   animatingParticle
  //                     ? "bg-[#ff2f2f]"
  //                     : "bg-[#fc4141] hover:bg-[#ff2f2f]"
  //                 )}
  //               >
  //                 {animatingParticle
  //                   ? "Fetching Transaction Details..."
  //                   : "Get Transaction"}
  //               </button>
  //               <button
  //                 onClick={shareOnTwitter}
  //                 disabled={isCapturing}
  //                 className={`
  //                   w-full shadow-xl h-12 bg-black hover:bg-black/90
  //                   text-white font-medium transition-all duration-200
  //                   border border-[#1DA1F2]/20 flex items-center justify-center gap-2
  //                   ${isCapturing ? "opacity-75 cursor-not-allowed" : ""}
  //                 `}
  //               >
  //                 {isCapturing ? (
  //                   <>
  //                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  //                     <span>Capturing...</span>
  //                   </>
  //                 ) : (
  //                   <span>Share on X</span>
  //                 )}
  //               </button>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Animated Particle */}
  //     {animatingParticle && (
  //       <div
  //         className="fixed pointer-events-none"
  //         style={{
  //           left: 0,
  //           top: 0,
  //           transform: `translate(${animatingParticle.currentX}px, ${animatingParticle.currentY}px) scale(${animatingParticle.scale}) rotate(${animatingParticle.rotation}deg)`,
  //           opacity: animatingParticle.opacity,
  //           transition: "transform 0.05s linear",
  //         }}
  //       >
  //         <div
  //           className="w-5 h-5 rounded-full bg-[#FF3030] relative"
  //           style={{
  //             boxShadow: `
  //               0 0 15px rgba(255, 48, 48, 0.6),
  //               0 0 30px rgba(255, 48, 48, 0.3)
  //             `,
  //           }}
  //         >
  //           <div className="absolute inset-1 rounded-full bg-white/40 blur-[1px]" />
  //           <div
  //             className="absolute -inset-1 animate-ping-slow opacity-20 bg-[#FF3030] rounded-full"
  //             style={{
  //               animationDuration: "0.75s",
  //             }}
  //           />
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );

  // return (
  //   <div className="h-screen relative">
  //     {/* Background - this is fine */}
  //     <div className="absolute inset-0 z-0">
  //       <Image
  //         src="/bg-dark.png"
  //         alt="Background"
  //         fill
  //         className="object-cover object-center"
  //         priority
  //         quality={100}
  //       />
  //     </div>

  //     {/* Main wrapper - modified for better height management */}
  //     <div className="w-full min-h-screen flex justify-center items-center">
  //       {/* Container - modified to handle height better */}
  //       <div className="container h-full py-4 md:py-6">
  //         {/* Grid container - modified for better responsive behavior */}
  //         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 h-full">
  //           {/* Visualizer container - modified to maintain height */}
  //           <div
  //             ref={containerRef}
  //             className="flex-1 lg:col-span-3 relative rounded-md overflow-hidden"
  //             style={{ minHeight: "50vh", height: "calc(100vh - 32rem)" }} // This ensures minimum height on mobile
  //           >
  //             <div className="h-full w-full">
  //               <VisualizerContainer tps={tps} formattedTps={formattedTPS} />
  //             </div>
  //           </div>

  //           {/* Right panel - modified to prevent visualizer shrinking */}
  //           <div className="lg:col-span-2 flex-shrink-0 space-y-4 flex flex-col">
  //             {/* Metrics Panel */}
  //             <div className="flex flex-col gap-2">
  //               <div className="flex flex-col gap-2">
  //                 <h2 className="font-black text-xl bg-gradient-to-b from-white to-[#cbcbcb]  bg-clip-text text-transparent shadow-sm uppercase">
  //                   Global Totals
  //                 </h2>

  //                 <div className="bg-[#1C1515] border-4 border-[#FF3030] backdrop-blur-sm  p-6 shadow-xl text-lg">
  //                   <div className="space-y-4">
  //                     <div className="flex items-center justify-between">
  //                       <span className="text-white">Transaction Rate</span>
  //                       <span className="text-[#FFFB24] font-bold">
  //                         {formattedTPS} TPS
  //                       </span>
  //                     </div>
  //                     <div className="flex items-center justify-between">
  //                       <span className="text-white">Active Hydra Heads</span>
  //                       <span className="text-[#FFFB24] font-bold">24</span>
  //                     </div>
  //                     <div className="flex items-center justify-between">
  //                       <span className="text-white">Total Transactions</span>
  //                       <span className="text-[#FFFB24] font-bold">
  //                         1,234,567
  //                       </span>
  //                     </div>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>

  //             {/* Transaction Details - modified to prevent affecting layout */}
  //             <div
  //               className={`
  //             transition-all duration-500 ease-out overflow-hidden
  //             ${showTxDetails ? "opacity-100 shadow-xl" : "opacity-0 h-0"}
  //           `}
  //             >
  //               <div
  //                 className={`
  //           transition-all duration-500 ease-out overflow-hidden
  //           ${
  //             showTxDetails
  //               ? "max-h-[400px] opacity-100 shadow-xl"
  //               : "max-h-0 opacity-0"
  //           }
  //         `}
  //               >
  //                 <div className="bg-[#1C1515]/90 backdrop-blur-sm border-4 border-[#FF3030] p-6 space-y-4">
  //                   <div className="flex items-center space-x-2">
  //                     <div className="w-2 h-2 bg-[#FFFB24] rounded-full animate-pulse" />
  //                     <h3 className="text-white font-semibold text-lg">
  //                       Transaction Details
  //                     </h3>
  //                   </div>

  //                   <div className="space-y-3">
  //                     <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //                       <div className="text-lg text-white mb-1">
  //                         Transaction Hash
  //                       </div>
  //                       <div className="text-white/90 text-lg truncate">
  //                         0x7cd3c0d0f08e0d0c9b0e1c9d0e8f7a6b5c4d3e2f1
  //                       </div>
  //                     </div>

  //                     <div className="grid grid-cols-2 gap-3">
  //                       <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //                         <div className="text-lg text-white mb-1">Amount</div>
  //                         <div className="text-white/90 font-medium text-lg">
  //                           458.23 ADA
  //                         </div>
  //                       </div>
  //                       <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //                         <div className="text-lg text-white mb-1">Time</div>
  //                         <div className="text-white/90 font-medium text-lg">
  //                           Just now
  //                         </div>
  //                       </div>
  //                     </div>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>

  //             {/* Buttons - moved to bottom */}
  //             <div className="mt-auto space-y-4">
  //               <button
  //                 onClick={animateParticle}
  //                 className={cn(
  //                   animatingParticle
  //                     ? "bg-[#ff2f2f]"
  //                     : "bg-[#fc4141] hover:bg-[#ff2f2f]",
  //                   "w-full font-semibold h-12  hover:shadow-2xl text-white transition-colors duration-200 shadow-lg"
  //                 )}
  //               >
  //                 {animatingParticle
  //                   ? "Fetching Transaction Details..."
  //                   : "Get Transaction"}
  //               </button>
  //               <button
  //                 onClick={shareOnTwitter}
  //                 disabled={isCapturing}
  //                 className={`
  //             w-full shadow-xl h-12 bg-black hover:bg-black/90
  //             text-white font-medium transition-all duration-200
  //             border border-[#1DA1F2]/20 flex items-center justify-center gap-2
  //             ${isCapturing ? "opacity-75 cursor-not-allowed" : ""}
  //           `}
  //               >
  //                 {isCapturing ? (
  //                   <>
  //                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  //                     <span>Capturing...</span>
  //                   </>
  //                 ) : (
  //                   <>
  //                     <span>Share on X</span>
  //                   </>
  //                 )}
  //               </button>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Animated Particle - keep as is */}
  //     {animatingParticle && (
  //       <div
  //         className="fixed pointer-events-none"
  //         style={{
  //           left: 0,
  //           top: 0,
  //           transform: `translate(${animatingParticle.currentX}px, ${animatingParticle.currentY}px) scale(${animatingParticle.scale}) rotate(${animatingParticle.rotation}deg)`,
  //           opacity: animatingParticle.opacity,
  //           transition: "transform 0.05s linear",
  //         }}
  //       >
  //         <div
  //           className="w-5 h-5 rounded-full bg-[#FF3030] relative"
  //           style={{
  //             boxShadow: `
  //         0 0 15px rgba(255, 48, 48, 0.6),
  //         0 0 30px rgba(255, 48, 48, 0.3)
  //       `,
  //           }}
  //         >
  //           <div className="absolute inset-1 rounded-full bg-white/40 blur-[1px]" />
  //           <div
  //             className="absolute -inset-1 animate-ping-slow opacity-20 bg-[#FF3030] rounded-full"
  //             style={{
  //               animationDuration: "0.75s",
  //             }}
  //           />
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
  // return (
  //   <div className="h-screen relative">
  //     <div className="absolute inset-0 z-0">
  //       <Image
  //         src="/bg-dark.png" // Replace with your image path
  //         alt="Background"
  //         fill
  //         className="object-cover object-center"
  //         priority
  //         quality={100}
  //       />
  //       {/* Optional overlay to ensure content readability */}
  //       {/* <div className="absolute inset-0 bg-[#1a1147]/70 backdrop-blur-[2px]" /> */}
  //     </div>

  //     <div className="w-full h-full flex justify-center items-center">
  //       <div className="container h-full min-h-screen">
  //         <div className="relative z-10 p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
  //           <div
  //             ref={containerRef}
  //             className="flex-1 lg:col-span-3 relative rounded-md overflow-hidden"
  //           >

  //             {/* Visualization container */}
  //             <div className="h-full w-full">
  //               <VisualizerContainer tps={tps} formattedTps={formattedTPS} />
  //             </div>
  //           </div>

  //           {/* Right Side Panel */}
  //           <div className="lg:col-span-2 flex-shrink-0 space-y-4">
  //             {/* Metrics Panel */}
  // <div className="flex flex-col gap-2">
  //   <h2 className="font-black text-xl bg-gradient-to-b from-white to-[#cbcbcb]  bg-clip-text text-transparent shadow-sm uppercase">
  //     Global Totals
  //   </h2>

  //   <div className="bg-[#1C1515] border-4 border-[#FF3030] backdrop-blur-sm  p-6 shadow-xl text-lg">
  //     <div className="space-y-4">
  //       <div className="flex items-center justify-between">
  //         <span className="text-white">Transaction Rate</span>
  //         <span className="text-[#FFFB24] font-bold">
  //           {formattedTPS} TPS
  //         </span>
  //       </div>
  //       <div className="flex items-center justify-between">
  //         <span className="text-white">Active Hydra Heads</span>
  //         <span className="text-[#FFFB24] font-bold">24</span>
  //       </div>
  //       <div className="flex items-center justify-between">
  //         <span className="text-white">Total Transactions</span>
  //         <span className="text-[#FFFB24] font-bold">
  //           1,234,567
  //         </span>
  //       </div>
  //     </div>
  //   </div>
  // </div>
  //             {/* Transaction Details Container */}
  //     <div
  //       className={`
  //   transition-all duration-500 ease-out overflow-hidden
  //   ${
  //     showTxDetails
  //       ? "max-h-[400px] opacity-100 shadow-xl"
  //       : "max-h-0 opacity-0"
  //   }
  // `}
  //     >
  //       <div className="bg-[#1C1515]/90 backdrop-blur-sm border-4 border-[#FF3030] p-6 space-y-4">
  //         <div className="flex items-center space-x-2">
  //           <div className="w-2 h-2 bg-[#FFFB24] rounded-full animate-pulse" />
  //           <h3 className="text-white font-semibold text-lg">
  //             Transaction Details
  //           </h3>
  //         </div>

  //         <div className="space-y-3">
  //           <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //             <div className="text-lg text-white mb-1">
  //               Transaction Hash
  //             </div>
  //             <div className="text-white/90 text-lg truncate">
  //               0x7cd3c0d0f08e0d0c9b0e1c9d0e8f7a6b5c4d3e2f1
  //             </div>
  //           </div>

  //           <div className="grid grid-cols-2 gap-3">
  //             <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //               <div className="text-lg text-white mb-1">Amount</div>
  //               <div className="text-white/90 font-medium text-lg">
  //                 458.23 ADA
  //               </div>
  //             </div>
  //             <div className="p-3 bg-[#1C1515]/50 border border-[#FF3030]">
  //               <div className="text-lg text-white mb-1">Time</div>
  //               <div className="text-white/90 font-medium text-lg">
  //                 Just now
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //             {/* Get Tx Button */}
  //   <button
  //     onClick={animateParticle}
  //     className={cn(
  //       animatingParticle
  //         ? "bg-[#ff2f2f]"
  //         : "bg-[#fc4141] hover:bg-[#ff2f2f]",
  //       "w-full font-semibold h-12  hover:shadow-2xl text-white transition-colors duration-200 shadow-lg"
  //     )}
  //   >
  //     {animatingParticle ? "Fetching Transaction Details..." : "Get Transaction"}
  //   </button>
  //   <button
  //     onClick={shareOnTwitter}
  //     disabled={isCapturing}
  //     className={`
  //   w-full shadow-xl h-12 bg-black hover:bg-black/90
  //   text-white font-medium transition-all duration-200
  //   border border-[#1DA1F2]/20 flex items-center justify-center gap-2
  //   ${isCapturing ? "opacity-75 cursor-not-allowed" : ""}
  // `}
  //   >
  //     {isCapturing ? (
  //       <>
  //         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  //         <span>Capturing...</span>
  //       </>
  //     ) : (
  //       <>
  //         <span>Share on X</span>
  //       </>
  //     )}
  //   </button>
  //           </div>
  //         </div>
  //       </div>

  //             {/* Enhanced Animated Particle */}
  // {animatingParticle && (
  //   <div
  //     className="fixed pointer-events-none"
  //     style={{
  //       left: 0,
  //       top: 0,
  //       transform: `translate(${animatingParticle.currentX}px, ${animatingParticle.currentY}px) scale(${animatingParticle.scale}) rotate(${animatingParticle.rotation}deg)`,
  //       opacity: animatingParticle.opacity,
  //       transition: "transform 0.05s linear",
  //     }}
  //   >
  //     <div
  //       className="w-5 h-5 rounded-full bg-[#FF3030] relative"
  //       style={{
  //         boxShadow: `
  //     0 0 15px rgba(255, 48, 48, 0.6),
  //     0 0 30px rgba(255, 48, 48, 0.3)
  //   `,
  //       }}
  //     >
  //       <div className="absolute inset-1 rounded-full bg-white/40 blur-[1px]" />
  //       <div
  //         className="absolute -inset-1 animate-ping-slow opacity-20 bg-[#FF3030] rounded-full"
  //         style={{
  //           animationDuration: "0.75s",
  //         }}
  //       />
  //     </div>
  //   </div>
  // )}
  //     </div>

  //   </div>
  // );
}
