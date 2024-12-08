"use client";
import Dashboard from "@/components/dashboard";
import { useFormattedMockGlobalStats } from "@/hooks/useMockGlobalStats";

export default function SimulationPage() {
    const stats = useFormattedMockGlobalStats();
  
  return (
    <Dashboard 
      stats={stats}
      isLoading={false}
      pageTitle="Hydra X Doom Tournament Simulator" 
    />
  );
}