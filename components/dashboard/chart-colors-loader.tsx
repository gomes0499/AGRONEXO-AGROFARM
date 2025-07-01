"use client";

import { useEffect } from "react";
import { useChartColors } from "@/contexts/chart-colors-context";

interface ChartColorsLoaderProps {
  organizationId: string;
  children: React.ReactNode;
}

export function ChartColorsLoader({ organizationId, children }: ChartColorsLoaderProps) {
  const { loadOrganizationColors } = useChartColors();

  useEffect(() => {
    if (organizationId) {
      loadOrganizationColors(organizationId);
    }
  }, [organizationId, loadOrganizationColors]);

  return <>{children}</>;
}