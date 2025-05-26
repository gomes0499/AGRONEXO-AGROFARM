import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter } from "lucide-react";

interface FilterOption {
  value: string | null;
  label: string;
}

interface SearchAndFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue: string | null;
  onFilterChange: (value: string | null) => void;
  filterOptions: FilterOption[];
  filterLabel?: string;
  className?: string;
}

export function SearchAndFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel = "Filtrar",
  className = "",
}: SearchAndFilterBarProps) {
  const selectedFilter = filterOptions.find(
    (option) => option.value === filterValue
  );

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <div className="relative flex-1">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex gap-2">
            <Filter className="h-4 w-4" />
            <span>{selectedFilter?.label || filterLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{filterLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {filterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value || "all"}
                onClick={() => onFilterChange(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
