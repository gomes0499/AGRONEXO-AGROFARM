"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function ScenarioLoadingOverlay({ 
  isLoading, 
  message = "Carregando cenário..." 
}: ScenarioLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop escuro */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Container do loading */}
      <div className="relative bg-primary rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <p className="text-white font-medium text-lg">{message}</p>
      </div>
    </div>
  );
}