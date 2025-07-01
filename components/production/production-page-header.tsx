"use client";

import { ProjectionSelector } from "@/components/production/projections/projection-selector";

interface ProductionPageHeaderProps {
  currentProjectionId?: string;
  organizationId: string;
}

export function ProductionPageHeader({
  currentProjectionId,
  organizationId,
}: ProductionPageHeaderProps) {
  return (
    <div className="flex items-center justify-end">
      <ProjectionSelector 
        currentProjectionId={currentProjectionId}
        organizationId={organizationId}
      />
    </div>
  );
}