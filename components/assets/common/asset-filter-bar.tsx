"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AssetFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    category?: string;
    year?: string;
    type?: string;
    marca?: string;
  };
  onFilterChange: (key: string, value: string | undefined) => void;
  filterOptions: {
    categories?: { value: string; label: string }[];
    years?: { value: string; label: string }[];
    types?: { value: string; label: string }[];
    marcas?: { value: string; label: string }[];
  };
  totalItems: number;
  filteredItems: number;
  onClearFilters: () => void;
}

export function AssetFilterBar({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  filterOptions,
  totalItems,
  filteredItems,
  onClearFilters,
}: AssetFilterBarProps) {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 || searchTerm.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, marca, modelo..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="h-8 px-2 text-xs"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              {filterOptions.categories && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={filters.category || ""}
                    onValueChange={(value) =>
                      onFilterChange("category", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {filterOptions.categories.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Type Filter */}
              {filterOptions.types && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    value={filters.type || ""}
                    onValueChange={(value) =>
                      onFilterChange("type", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {filterOptions.types.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Marca Filter */}
              {filterOptions.marcas && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Marca</label>
                  <Select
                    value={filters.marca || ""}
                    onValueChange={(value) =>
                      onFilterChange("marca", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as marcas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as marcas</SelectItem>
                      {filterOptions.marcas.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Year Filter */}
              {filterOptions.years && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano</label>
                  <Select
                    value={filters.year || ""}
                    onValueChange={(value) =>
                      onFilterChange("year", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os anos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os anos</SelectItem>
                      {filterOptions.years.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{searchTerm}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchChange("")}
              />
            </Badge>
          )}

          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {filterOptions.categories?.find(c => c.value === filters.category)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange("category", undefined)}
              />
            </Badge>
          )}

          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Tipo: {filterOptions.types?.find(t => t.value === filters.type)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange("type", undefined)}
              />
            </Badge>
          )}

          {filters.marca && (
            <Badge variant="secondary" className="gap-1">
              Marca: {filterOptions.marcas?.find(m => m.value === filters.marca)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange("marca", undefined)}
              />
            </Badge>
          )}

          {filters.year && (
            <Badge variant="secondary" className="gap-1">
              Ano: {filters.year}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange("year", undefined)}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs"
          >
            Limpar todos
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredItems === totalItems ? (
          `${totalItems} ${totalItems === 1 ? "item" : "itens"} no total`
        ) : (
          `${filteredItems} de ${totalItems} ${totalItems === 1 ? "item" : "itens"}`
        )}
      </div>
    </div>
  );
}