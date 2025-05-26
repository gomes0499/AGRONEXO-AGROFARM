"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface YearFilterProps {
  selectedYear: number | null;
  availableYears: number[];
  onChange: (year: number | null) => void;
  label?: string;
}

export function YearFilter({
  selectedYear,
  availableYears,
  onChange,
  label = "Filtrar por Ano",
}: YearFilterProps) {
  // Sort years in descending order (newest first)
  const sortedYears = [...availableYears].sort((a, b) => b - a);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          {label}
          {selectedYear ? `: ${selectedYear}` : ""}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Selecione um ano</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={selectedYear === null}
          onCheckedChange={() => onChange(null)}
        >
          Todos
        </DropdownMenuCheckboxItem>
        {sortedYears.map((year) => (
          <DropdownMenuCheckboxItem
            key={year}
            checked={selectedYear === year}
            onCheckedChange={() => onChange(year)}
          >
            {year}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
