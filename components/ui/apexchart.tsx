"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useIsMobile } from "@/hooks/use-mobile";

// Dynamically import ApexCharts to avoid SSR issues
const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ApexChartProps {
  type: "line" | "area" | "bar" | "pie" | "donut" | "radialBar" | "scatter" | "bubble" | "heatmap" | "candlestick" | "boxPlot" | "radar" | "polarArea" | "rangeBar" | "rangeArea" | "treemap";
  options: any;
  series: any;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function ApexChart({ 
  type, 
  options, 
  series, 
  width = "100%", 
  height = 350, 
  className = "" 
}: ApexChartProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  
  // Only render the chart on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Adjust options for mobile if needed
  const responsiveOptions = {
    ...options,
    chart: {
      ...options.chart,
      toolbar: {
        show: !isMobile,
        ...(options.chart?.toolbar || {}),
      },
    },
    theme: {
      mode: 'light',
      ...options.theme,
    }
  };
  
  if (!mounted) {
    // Return a placeholder with the same dimensions during SSR
    return (
      <div 
        className={`flex items-center justify-center bg-muted/10 ${className}`}
        style={{ width, height }}
      >
        <div className="text-sm text-muted-foreground">Carregando gráfico...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ApexCharts 
        type={type}
        options={responsiveOptions}
        series={series}
        width={width}
        height={height}
      />
    </div>
  );
}