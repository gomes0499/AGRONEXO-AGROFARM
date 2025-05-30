"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartLegendItem {
  value: string;
  color: string;
  type?: string;
  payload?: any;
}

interface ChartLegendMultirowProps {
  payload?: ChartLegendItem[];
  className?: string;
  itemsPerRow?: number;
  [key: string]: any; // Para aceitar outras props do recharts
}

const ChartLegendMultirow = React.forwardRef<
  HTMLDivElement,
  ChartLegendMultirowProps
>(({ payload, className, itemsPerRow = 3, ...props }, ref) => {
  // Filtrar props que não devem ser passadas para o DOM
  const {
    chartHeight,
    chartWidth,
    margin,
    viewBox,
    verticalAlign,
    iconType,
    layout,
    align,
    wrapperStyle,
    content,
    ...domProps
  } = props;
  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-start justify-center gap-x-4 gap-y-3 px-3 pb-3",
        "sm:gap-x-5 sm:px-4",
        className
      )}
      {...domProps}
    >
      {payload.map((item: any, index: number) => (
        <div
          key={`legend-item-${index}`}
          className={cn(
            "flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity",
            "min-w-0 flex-shrink-0 max-w-[140px] sm:max-w-[160px] lg:max-w-[180px]"
          )}
          title={item.value}
        >
          <div
            className={cn(
              "w-3.5 h-3.5 rounded-[3px] shrink-0 border border-white/20",
              "group-hover:scale-110 transition-transform duration-200"
            )}
            style={{ backgroundColor: item.color }}
          />
          <span
            className={cn(
              "text-sm font-medium text-muted-foreground",
              "group-hover:text-foreground transition-colors",
              "leading-tight text-left"
            )}
            style={{
              wordBreak: "break-word",
              lineHeight: "1.2",
              whiteSpace: "normal",
              overflowWrap: "break-word"
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
});

ChartLegendMultirow.displayName = "ChartLegendMultirow";

export { ChartLegendMultirow };