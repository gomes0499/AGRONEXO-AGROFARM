"use client";

import { useState, useMemo } from "react";

export interface FinancialFilters {
  modalidade?: string;
  year?: string;
  moeda?: string;
  instituicao?: string;
  categoria?: string;
  safra_id?: string;
}

export interface FinancialFilterOptions {
  modalidades?: { value: string; label: string }[];
  years?: { value: string; label: string }[];
  moedas?: { value: string; label: string }[];
  instituicoes?: { value: string; label: string }[];
  categorias?: { value: string; label: string }[];
  safras?: { value: string; label: string }[];
}

export function useFinancialFilters<T extends Record<string, any>>(
  items: T[],
  filterConfig: {
    searchFields: (keyof T)[];
    modalidadeField?: keyof T;
    yearField?: keyof T;
    moedaField?: keyof T;
    instituicaoField?: keyof T;
    categoriaField?: keyof T;
    safraField?: keyof T;
  }
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FinancialFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = filterConfig.searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchLower);
          }
          if (typeof value === "number") {
            return value.toString().includes(searchLower);
          }
          return false;
        });
        
        if (!matchesSearch) return false;
      }

      // Modalidade filter
      if (filters.modalidade && filterConfig.modalidadeField) {
        const itemModalidade = item[filterConfig.modalidadeField];
        if (itemModalidade !== filters.modalidade) return false;
      }

      // Year filter
      if (filters.year && filterConfig.yearField) {
        const itemYear = item[filterConfig.yearField];
        if (itemYear?.toString() !== filters.year) return false;
      }

      // Moeda filter
      if (filters.moeda && filterConfig.moedaField) {
        const itemMoeda = item[filterConfig.moedaField];
        if (itemMoeda !== filters.moeda) return false;
      }

      // Instituição filter
      if (filters.instituicao && filterConfig.instituicaoField) {
        const itemInstituicao = item[filterConfig.instituicaoField];
        if (itemInstituicao !== filters.instituicao) return false;
      }

      // Categoria filter
      if (filters.categoria && filterConfig.categoriaField) {
        const itemCategoria = item[filterConfig.categoriaField];
        if (itemCategoria !== filters.categoria) return false;
      }
      
      // Safra filter - note this may need custom handling depending on your data structure
      if (filters.safra_id && filterConfig.safraField) {
        const itemSafra = item[filterConfig.safraField];
        if (itemSafra !== filters.safra_id) return false;
      }

      return true;
    });
  }, [items, searchTerm, filters, filterConfig]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when filters change
  const handleFilterChange = (key: keyof FinancialFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
    setCurrentPage(1);
  };

  // Generate filter options from the data
  const filterOptions: FinancialFilterOptions = useMemo(() => {
    const options: FinancialFilterOptions = {};

    if (filterConfig.modalidadeField) {
      const modalidades = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.modalidadeField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort();
      
      options.modalidades = modalidades.map((modalidade) => ({
        value: modalidade,
        label: formatModalidade(modalidade),
      }));
    }

    if (filterConfig.yearField) {
      const years = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.yearField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort((a, b) => Number(b) - Number(a));
      
      options.years = years.map((year) => ({
        value: year,
        label: year,
      }));
    }

    if (filterConfig.moedaField) {
      const moedas = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.moedaField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort();
      
      options.moedas = moedas.map((moeda) => ({
        value: moeda,
        label: formatMoeda(moeda),
      }));
    }

    if (filterConfig.instituicaoField) {
      const instituicoes = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.instituicaoField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort();
      
      options.instituicoes = instituicoes.map((instituicao) => ({
        value: instituicao,
        label: instituicao,
      }));
    }

    if (filterConfig.categoriaField) {
      const categorias = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.categoriaField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort();
      
      options.categorias = categorias.map((categoria) => ({
        value: categoria,
        label: formatLabel(categoria),
      }));
    }

    if (filterConfig.safraField) {
      const safras = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.safraField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort();
      
      options.safras = safras.map((safra) => ({
        value: safra,
        label: safra,
      }));
    }

    return options;
  }, [items, filterConfig]);

  return {
    // Search and filters
    searchTerm,
    filters,
    filterOptions,
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    
    // Data
    filteredItems,
    paginatedItems,
    totalItems: items.length,
    filteredCount: filteredItems.length,
  };
}

function formatModalidade(value: string): string {
  const modalidades: Record<string, string> = {
    CUSTEIO: "Custeio",
    INVESTIMENTOS: "Investimentos",
  };
  return modalidades[value] || value;
}

function formatMoeda(value: string): string {
  const moedas: Record<string, string> = {
    BRL: "Real (R$)",
    USD: "Dólar (US$)",
    EUR: "Euro (€)",
    SOJA: "Soja (sacas)",
  };
  return moedas[value] || value;
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}