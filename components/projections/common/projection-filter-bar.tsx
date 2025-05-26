"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProjectionFilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  statusFilter?: string
  onStatusFilterChange?: (value: string) => void
  yearFilter?: string
  onYearFilterChange?: (value: string) => void
  formatFilter?: string
  onFormatFilterChange?: (value: string) => void
  onClearFilters: () => void
  activeFiltersCount?: number
}

export function ProjectionFilterBar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  yearFilter,
  onYearFilterChange,
  formatFilter,
  onFormatFilterChange,
  onClearFilters,
  activeFiltersCount = 0
}: ProjectionFilterBarProps) {
  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar projeções..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {onStatusFilterChange && (
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ATIVA">Ativas</SelectItem>
              <SelectItem value="INATIVA">Inativas</SelectItem>
              <SelectItem value="ARQUIVADA">Arquivadas</SelectItem>
            </SelectContent>
          </Select>
        )}

        {onYearFilterChange && (
          <Select value={yearFilter} onValueChange={onYearFilterChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i - 5).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onFormatFilterChange && (
          <Select value={formatFilter} onValueChange={onFormatFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="SAFRA_COMPLETA">Safra Completa</SelectItem>
              <SelectItem value="ANO_CIVIL">Ano Civil</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {activeFiltersCount > 0 && (
          <>
            <Badge variant="secondary" className="px-2">
              <Filter className="mr-1 h-3 w-3" />
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}