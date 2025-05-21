"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface FilterOption {
  value: string;
  label: string;
}

interface FinancialFilterBarProps {
  onSearch: (query: string) => void;
  filters?: {
    [key: string]: {
      label: string;
      options: FilterOption[];
      value: string | null;
    };
  };
  onFilterChange?: (key: string, value: string | null) => void;
}

export function FinancialFilterBar({
  onSearch,
  filters = {},
  onFilterChange,
}: FinancialFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeFiltersCount = Object.values(filters).filter(
    (filter) => filter.value !== null
  ).length;

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilter = (key: string) => {
    if (onFilterChange) {
      onFilterChange(key, null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-9 w-9"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {Object.keys(filters).length > 0 && (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {Object.entries(filters).map(([key, filter]) => (
                <div key={key} className="px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{filter.label}</span>
                    {filter.value !== null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => clearFilter(key)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {filter.options.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        className={`text-xs justify-center ${
                          filter.value === option.value
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                        onClick={() => {
                          if (onFilterChange) {
                            onFilterChange(
                              key,
                              filter.value === option.value ? null : option.value
                            );
                          }
                        }}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onFilterChange) {
                  Object.keys(filters).forEach((key) => {
                    onFilterChange(key, null);
                  });
                }
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}