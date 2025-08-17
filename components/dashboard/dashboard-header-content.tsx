"use client";

import { TickerVisibilityToggle } from "@/components/dashboard/ticker-visibility-toggle";
import { ProjectionSelector } from "@/components/production/projections/projection-selector";
import { NewProjectionButton } from "@/components/production/projections/new-projection-button";

interface DashboardHeaderContentProps {
  organizationId: string;
  projectionId?: string;
}

export function DashboardHeaderContent({ organizationId, projectionId }: DashboardHeaderContentProps) {
  return (
    <div className="flex items-center gap-2">
      <TickerVisibilityToggle />
      <div className="h-4 w-px bg-border" />
      <ProjectionSelector 
        currentProjectionId={projectionId} 
        organizationId={organizationId}
      />
      <NewProjectionButton />
    </div>
  );
}