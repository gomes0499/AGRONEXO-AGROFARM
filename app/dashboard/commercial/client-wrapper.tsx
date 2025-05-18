"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Importando um componente de tabs mais simplificado para evitar problemas
const SimpleTabs = dynamic(
  () => import("@/components/commercial/simple-tabs").then(mod => mod.SimpleTabs),
  {
    loading: () => (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
    ssr: false
  }
);

export interface ClientWrapperProps {
  seedsComponent: React.ReactNode;
  livestockComponent: React.ReactNode;
}

export function ClientWrapper({ seedsComponent, livestockComponent }: ClientWrapperProps) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-60">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SimpleTabs
        seedsComponent={seedsComponent}
        livestockComponent={livestockComponent}
      />
    </Suspense>
  );
}