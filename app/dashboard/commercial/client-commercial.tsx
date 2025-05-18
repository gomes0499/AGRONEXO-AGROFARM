"use client";

import React from "react";
import { useState } from "react";

interface ClientCommercialProps {
  seedsComponent: React.ReactNode;
  livestockComponent: React.ReactNode;
}

export function ClientCommercial({ seedsComponent, livestockComponent }: ClientCommercialProps) {
  const [activeTab, setActiveTab] = useState("seeds");

  return (
    <div className="space-y-4">
      {/* Barra de navegação simples */}
      <div className="flex rounded-lg bg-muted p-1 mb-4">
        <button 
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "seeds" 
              ? "bg-background text-foreground shadow" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("seeds")}
        >
          Sementes
        </button>
        <button 
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "livestock" 
              ? "bg-background text-foreground shadow" 
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("livestock")}
        >
          Pecuária
        </button>
      </div>

      {/* Conteúdo da tab */}
      <div className="tab-content">
        {activeTab === "seeds" && seedsComponent}
        {activeTab === "livestock" && livestockComponent}
      </div>
    </div>
  );
}