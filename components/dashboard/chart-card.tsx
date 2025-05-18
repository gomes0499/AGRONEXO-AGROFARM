"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { ApexChart } from "../ui/apexchart";

interface ChartCardProps {
  title: string;
  description?: string;
  options?: {
    value: string;
    label: string;
  }[];
  defaultOption?: string;
  onOptionChange?: (value: string) => void;
  series: any[];
  type: "line" | "bar" | "area" | "pie" | "donut";
  categories?: string[];
  height?: number;
  className?: string;
  chartOptions?: any;
}

export function ChartCard({
  title,
  description,
  options,
  defaultOption,
  onOptionChange,
  series,
  type,
  categories,
  height = 350,
  className,
  chartOptions = {},
}: ChartCardProps) {
  const [selectedOption, setSelectedOption] = useState(
    defaultOption || (options && options[0]?.value) || ""
  );

  const handleOptionChange = (value: string) => {
    setSelectedOption(value);
    if (onOptionChange) {
      onOptionChange(value);
    }
  };

  // Default chart configuration
  const defaultOptions = {
    chart: {
      id: `chart-${title}`,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    xaxis: {
      categories: categories || [],
    },
    colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"],
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      opacity: 0.8,
    },
    tooltip: {
      theme: "light",
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "bottom",
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...chartOptions,
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {options && options.length > 0 && (
          <Select value={selectedOption} onValueChange={handleOptionChange}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {series.length > 0 ? (
          <ApexChart
            type={type}
            options={mergedOptions}
            series={series}
            height={height}
          />
        ) : (
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Sem dados disponíveis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
