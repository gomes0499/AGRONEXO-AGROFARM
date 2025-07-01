"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface ProjectionContextType {
  currentProjectionId: string | undefined;
  setCurrentProjectionId: (id: string | undefined) => void;
  isProjectionMode: boolean;
}

const ProjectionContext = createContext<ProjectionContextType | undefined>(undefined);

export function ProjectionProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [currentProjectionId, setCurrentProjectionId] = useState<string | undefined>(undefined);

  // Sincronizar com query params
  useEffect(() => {
    const projectionFromUrl = searchParams.get("projection");
    if (projectionFromUrl) {
      setCurrentProjectionId(projectionFromUrl);
    } else {
      setCurrentProjectionId(undefined);
    }
  }, [searchParams]);

  const isProjectionMode = !!currentProjectionId;

  return (
    <ProjectionContext.Provider
      value={{
        currentProjectionId,
        setCurrentProjectionId,
        isProjectionMode,
      }}
    >
      {children}
    </ProjectionContext.Provider>
  );
}

export function useProjection() {
  const context = useContext(ProjectionContext);
  if (!context) {
    throw new Error("useProjection must be used within a ProjectionProvider");
  }
  return context;
}