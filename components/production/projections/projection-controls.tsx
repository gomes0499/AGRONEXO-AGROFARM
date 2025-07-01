"use client";

import { ProjectionSelector } from "./projection-selector";
import { NewProjectionButton } from "./new-projection-button";
import { useSearchParams } from "next/navigation";

export function ProjectionControls() {
  const searchParams = useSearchParams();
  const currentProjectionId = searchParams.get('projection') || undefined;

  return (
    <div className="flex items-center gap-2">
      <ProjectionSelector currentProjectionId={currentProjectionId} />
      <NewProjectionButton />
    </div>
  );
}