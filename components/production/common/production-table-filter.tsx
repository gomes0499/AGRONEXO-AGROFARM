"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  value: string;
  label: string;
}

export interface TableFilter {
  searchTerm: string;
  safra: string;
  cultura: string;
  sistema: string;
  propriedade: string;
  categoria?: string; // Para custos de produção
}

interface ProductionTableFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: TableFilter;
  onFiltersChange: (filters: TableFilter) => void;
  safras: FilterOption[];
  culturas: FilterOption[];
  sistemas: FilterOption[];
  propriedades: FilterOption[];
  categorias?: FilterOption[]; // Para custos de produção
  showCategoriaFilter?: boolean;
}

export function ProductionTableFilter({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  safras,
  culturas,
  sistemas,
  propriedades,
  categorias = [],
  showCategoriaFilter = false,
}: ProductionTableFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (key: keyof TableFilter, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      safra: "all",
      cultura: "all",
      sistema: "all",
      propriedade: "all",
      categoria: "all",
    });
    onSearchChange("");
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.safra && filters.safra !== "all") count++;
    if (filters.cultura && filters.cultura !== "all") count++;
    if (filters.sistema && filters.sistema !== "all") count++;
    if (filters.propriedade && filters.propriedade !== "all") count++;
    if (filters.categoria && filters.categoria !== "all") count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Barra de busca */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Botão de filtros */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtros</h4>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Limpar tudo
                </Button>
              )}
            </div>

            <div className="grid gap-3">
              {/* Filtro de Safra */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Safra
                </label>
                <Select
                  value={filters.safra || "all"}
                  onValueChange={(value) => handleFilterChange("safra", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Todas as safras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as safras</SelectItem>
                    {safras.map((safra) => (
                      <SelectItem key={safra.value} value={safra.value}>
                        {safra.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Cultura */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Cultura
                </label>
                <Select
                  value={filters.cultura || "all"}
                  onValueChange={(value) => handleFilterChange("cultura", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Todas as culturas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as culturas</SelectItem>
                    {culturas.map((cultura) => (
                      <SelectItem key={cultura.value} value={cultura.value}>
                        {cultura.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Sistema */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Sistema
                </label>
                <Select
                  value={filters.sistema || "all"}
                  onValueChange={(value) => handleFilterChange("sistema", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Todos os sistemas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os sistemas</SelectItem>
                    {sistemas.map((sistema) => (
                      <SelectItem key={sistema.value} value={sistema.value}>
                        {sistema.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Propriedade */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Propriedade
                </label>
                <Select
                  value={filters.propriedade || "all"}
                  onValueChange={(value) => handleFilterChange("propriedade", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Todas as propriedades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as propriedades</SelectItem>
                    {propriedades.map((propriedade) => (
                      <SelectItem key={propriedade.value} value={propriedade.value}>
                        {propriedade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Categoria (apenas para custos) */}
              {showCategoriaFilter && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Categoria
                  </label>
                  <Select
                    value={filters.categoria || "all"}
                    onValueChange={(value) => handleFilterChange("categoria", value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.value} value={categoria.value}>
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}