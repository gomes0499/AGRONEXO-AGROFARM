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

export interface FinancialFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    modalidade?: string;
    year?: string;
    moeda?: string;
    instituicao?: string;
    categoria?: string;
  };
  onFiltersChange: (key: string, value: string | undefined) => void;
  filterOptions: {
    modalidades?: { value: string; label: string }[];
    years?: { value: string; label: string }[];
    moedas?: { value: string; label: string }[];
    instituicoes?: { value: string; label: string }[];
    categorias?: { value: string; label: string }[];
  };
  searchPlaceholder?: string;
}

export function FinancialFilterBar({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  filterOptions,
  searchPlaceholder = "Buscar...",
}: FinancialFilterBarProps) {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0 || searchTerm.length > 0;

  const clearFilters = () => {
    onSearchChange("");
    Object.keys(filters).forEach(key => {
      onFiltersChange(key, undefined);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
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
                    onClick={clearFilters}
                    className="h-8 px-2 text-xs"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {/* Modalidade Filter */}
              {filterOptions.modalidades && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modalidade</label>
                  <Select
                    value={filters.modalidade || ""}
                    onValueChange={(value) =>
                      onFiltersChange("modalidade", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as modalidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as modalidades</SelectItem>
                      {filterOptions.modalidades.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Categoria Filter */}
              {filterOptions.categorias && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={filters.categoria || ""}
                    onValueChange={(value) =>
                      onFiltersChange("categoria", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {filterOptions.categorias.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Instituição Filter */}
              {filterOptions.instituicoes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instituição</label>
                  <Select
                    value={filters.instituicao || ""}
                    onValueChange={(value) =>
                      onFiltersChange("instituicao", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as instituições" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as instituições</SelectItem>
                      {filterOptions.instituicoes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Moeda Filter */}
              {filterOptions.moedas && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Moeda</label>
                  <Select
                    value={filters.moeda || ""}
                    onValueChange={(value) =>
                      onFiltersChange("moeda", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as moedas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as moedas</SelectItem>
                      {filterOptions.moedas.map((option) => (
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
                      onFiltersChange("year", value === "all" ? undefined : value)
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

          {filters.modalidade && (
            <Badge variant="secondary" className="gap-1">
              Modalidade: {filterOptions.modalidades?.find(m => m.value === filters.modalidade)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange("modalidade", undefined)}
              />
            </Badge>
          )}

          {filters.categoria && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {filterOptions.categorias?.find(c => c.value === filters.categoria)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange("categoria", undefined)}
              />
            </Badge>
          )}

          {filters.instituicao && (
            <Badge variant="secondary" className="gap-1">
              Instituição: {filterOptions.instituicoes?.find(i => i.value === filters.instituicao)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange("instituicao", undefined)}
              />
            </Badge>
          )}

          {filters.moeda && (
            <Badge variant="secondary" className="gap-1">
              Moeda: {filters.moeda}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange("moeda", undefined)}
              />
            </Badge>
          )}

          {filters.year && (
            <Badge variant="secondary" className="gap-1">
              Ano: {filters.year}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange("year", undefined)}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}