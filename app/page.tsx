"use client";
import Dashboard from "@/components/dashboard";
import { useFormattedApiGlobalStats } from "@/hooks/useGlobalStats";

export default function HomePage() {
  const stats = useFormattedApiGlobalStats();
  return <Dashboard stats={stats} isLoading={stats.isLoading} />;
}