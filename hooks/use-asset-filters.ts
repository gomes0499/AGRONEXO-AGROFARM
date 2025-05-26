"use client";

import { useState, useMemo } from "react";

export interface AssetFilters {
  category?: string;
  year?: string;
  type?: string;
  marca?: string;
}

export interface AssetFilterOptions {
  categories?: { value: string; label: string }[];
  years?: { value: string; label: string }[];
  types?: { value: string; label: string }[];
  marcas?: { value: string; label: string }[];
}

export function useAssetFilters<T extends Record<string, any>>(
  items: T[],
  filterConfig: {
    searchFields: (keyof T)[];
    categoryField?: keyof T;
    yearField?: keyof T;
    typeField?: keyof T;
    marcaField?: keyof T;
  }
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<AssetFilters>({});
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

      // Category filter
      if (filters.category && filterConfig.categoryField) {
        const itemCategory = item[filterConfig.categoryField];
        if (itemCategory !== filters.category) return false;
      }

      // Year filter
      if (filters.year && filterConfig.yearField) {
        const itemYear = item[filterConfig.yearField];
        if (itemYear?.toString() !== filters.year) return false;
      }

      // Type filter
      if (filters.type && filterConfig.typeField) {
        const itemType = item[filterConfig.typeField];
        if (itemType !== filters.type) return false;
      }

      // Marca filter
      if (filters.marca && filterConfig.marcaField) {
        const itemMarca = item[filterConfig.marcaField];
        if (itemMarca !== filters.marca) return false;
      }

      return true;
    });
  }, [items, searchTerm, filters, filterConfig]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when filters change
  const handleFilterChange = (key: keyof AssetFilters, value: string | undefined) => {
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
  const filterOptions: AssetFilterOptions = useMemo(() => {
    const options: AssetFilterOptions = {};

    if (filterConfig.categoryField) {
      const categories = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.categoryField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort();
      
      options.categories = categories.map((category) => ({
        value: category,
        label: formatLabel(category),
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

    if (filterConfig.typeField) {
      const types = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.typeField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort();
      
      options.types = types.map((type) => ({
        value: type,
        label: formatLabel(type),
      }));
    }

    if (filterConfig.marcaField) {
      const marcas = Array.from(
        new Set(
          items
            .map((item) => item[filterConfig.marcaField!])
            .filter(Boolean)
            .map(String)
        )
      ).sort();
      
      options.marcas = marcas.map((marca) => ({
        value: marca,
        label: formatLabel(marca),
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

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}