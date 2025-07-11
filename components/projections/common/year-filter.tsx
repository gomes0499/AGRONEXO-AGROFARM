"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface YearFilterProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  startYear?: number;
  endYear?: number;
}

export function YearFilter({
  selectedYear,
  onYearChange,
  startYear = 2020,
  endYear = new Date().getFullYear() + 5,
}: YearFilterProps) {
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => onYearChange(parseInt(value))}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}