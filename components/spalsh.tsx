import React from "react";
import Image from "next/image";

interface LoadingScreenProps {
  isTransitioning: boolean;
  onTransitionEnd?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isTransitioning,
  onTransitionEnd,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-1000 ease-in-out ${
        isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
      onTransitionEnd={onTransitionEnd}
    >
      <div className="fixed inset-0 flex flex-col items-center justify-center">
        <div className="absolute top-6 left-6 z-10">
          <Image src="/hydra.png" alt="Hydra Logo" width={40} height={40} />
        </div>

        <div className="absolute inset-0 z-0">
          <Image
            src="/bg-doom-guy.png"
            alt="Background"
            fill
            className="object-cover object-center"
            priority
          />

          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-1000 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <Image
              src="/hydra-doom.png"
              alt="Hydra Logo"
              width={400}
              height={80}
              className="animate-pulse"
            />
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-black uppercase text-yellow-500 animate-pulse tracking-wider transition-transform duration-1000 ${
              isTransitioning
                ? "translate-y-10 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
            style={{
              textShadow:
                "rgb(219, 17, 2) 0px 0px 10px, rgb(242, 88, 31) 0px 0px 20px, rgb(242, 88, 31) 0px 0px 50px, rgba(255, 5, 5, 0.25) 0px 0px 50px",
            }}
          >
            Connecting to Hydra
          </h2>
          <p
            className={`text-lg font-black text-[#FFFFFF] animate-pulse uppercase tracking-wider transition-transform duration-1000 delay-100 ${
              isTransitioning
                ? "translate-y-10 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
            style={{
              textShadow:
                "rgb(219, 17, 2) 0px 0px 10px, rgb(242, 88, 31) 0px 0px 20px",
            }}
          >
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
