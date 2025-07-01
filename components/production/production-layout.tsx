"use client";

import { DashboardTickers } from "@/components/dashboard/dashboard-tickers";
import { ProjectionSelector } from "@/components/production/projections/projection-selector";
import { NewProjectionButton } from "@/components/production/projections/new-projection-button";

interface ProductionLayoutProps {
  children: React.ReactNode;
  currentProjectionId?: string;
  commercialPrices?: any;
}

export function ProductionLayout({ 
  children, 
  currentProjectionId,
  commercialPrices 
}: ProductionLayoutProps) {
  return (
    <>
      <DashboardTickers 
        commercialPrices={commercialPrices}
        rightContent={
          <div className="flex items-center gap-2">
            <ProjectionSelector currentProjectionId={currentProjectionId} />
            <NewProjectionButton />
          </div>
        }
      />
      {children}
    </>
  );
}