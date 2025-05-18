"use client";

import React, { useState } from "react";

export interface SimpleTabsProps {
  seedsComponent?: React.ReactNode;
  livestockComponent?: React.ReactNode;
}

export function SimpleTabs({ seedsComponent, livestockComponent }: SimpleTabsProps) {
  const [activeTab, setActiveTab] = useState("seeds");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="commercial-container">
      <div className="flex mb-4 rounded-lg bg-muted p-1">
        <button
          onClick={() => handleTabChange("seeds")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md ${
            activeTab === "seeds"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sementes
        </button>
        <button
          onClick={() => handleTabChange("livestock")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md ${
            activeTab === "livestock"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pecuária
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "seeds" && (
          <div className={activeTab === "seeds" ? "block" : "hidden"}>
            {seedsComponent || (
              <div className="flex items-center justify-center h-60 border rounded-lg">
                <p className="text-muted-foreground">
                  Módulo de vendas de sementes em desenvolvimento
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "livestock" && (
          <div className={activeTab === "livestock" ? "block" : "hidden"}>
            {livestockComponent || (
              <div className="flex items-center justify-center h-60 border rounded-lg">
                <p className="text-muted-foreground">
                  Módulo de vendas pecuárias em desenvolvimento
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const runtime = "client";