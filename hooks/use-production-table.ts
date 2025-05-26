"use client";

import { useState, useMemo } from "react";
import { TableFilter } from "@/components/production/common/production-table-filter";

interface UseProductionTableProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  initialPageSize?: number;
}

interface UseProductionTableReturn<T> {
  // Estados
  searchTerm: string;
  filters: TableFilter;
  currentPage: number;
  pageSize: number;
  
  // Dados processados
  filteredData: T[];
  paginatedData: T[];
  totalPages: number;
  totalItems: number;
  
  // Handlers
  setSearchTerm: (term: string) => void;
  setFilters: (filters: TableFilter) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export function useProductionTable<T extends Record<string, any>>({
  data,
  searchFields,
  initialPageSize = 20,
}: UseProductionTableProps<T>): UseProductionTableReturn<T> {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TableFilter>({
    searchTerm: "",
    safra: "all",
    cultura: "all",
    sistema: "all",
    propriedade: "all",
    categoria: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Função para aplicar filtros
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Aplicar busca por texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchLower);
          }
          if (typeof value === "number") {
            return value.toString().includes(searchLower);
          }
          return false;
        })
      );
    }

    // Aplicar filtros específicos
    if (filters.safra && filters.safra !== "all") {
      filtered = filtered.filter((item) => item.safra_id === filters.safra);
    }

    if (filters.cultura && filters.cultura !== "all") {
      filtered = filtered.filter((item) => item.cultura_id === filters.cultura);
    }

    if (filters.sistema && filters.sistema !== "all") {
      filtered = filtered.filter((item) => item.sistema_id === filters.sistema);
    }

    if (filters.propriedade && filters.propriedade !== "all") {
      filtered = filtered.filter((item) => item.propriedade_id === filters.propriedade);
    }

    if (filters.categoria && filters.categoria !== "all") {
      filtered = filtered.filter((item) => item.categoria === filters.categoria);
    }

    return filtered;
  }, [data, searchTerm, filters, searchFields]);

  // Calcular paginação
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Aplicar paginação
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  // Resetar página quando os filtros mudarem
  const handleFiltersChange = (newFilters: TableFilter) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    // Estados
    searchTerm,
    filters,
    currentPage,
    pageSize,
    
    // Dados processados
    filteredData,
    paginatedData,
    totalPages,
    totalItems,
    
    // Handlers
    setSearchTerm: handleSearchChange,
    setFilters: handleFiltersChange,
    setCurrentPage,
    setPageSize: handlePageSizeChange,
  };
}