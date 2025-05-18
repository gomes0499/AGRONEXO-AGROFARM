"use client";

import { useState, useEffect } from "react";
import { SeedSale, LivestockSale } from "@/schemas/commercial";
import { toast } from "sonner";

export type Sale = SeedSale | LivestockSale;

interface UseSalesListStateProps<T extends Sale> {
  initialSales: T[];
  deleteSaleFn: (id: string) => Promise<any>;
}

export function useSalesListState<T extends Sale>({
  initialSales,
  deleteSaleFn,
}: UseSalesListStateProps<T>) {
  // Initialize with empty array fallback to prevent null/undefined issues
  const safeInitialSales = Array.isArray(initialSales) ? initialSales : [];
  
  const [sales, setSales] = useState<T[]>(safeInitialSales);
  const [filteredSales, setFilteredSales] = useState<T[]>(safeInitialSales);
  const [selectedSafraId, setSelectedSafraId] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [selectedCulture, setSelectedCulture] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<T | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get unique IDs safely with null checks
  const uniqueSafraIds = sales && sales.length 
    ? [...new Set(sales.map((sale) => sale.safra_id).filter(Boolean))]
    : [];
    
  const uniquePropertyIds = sales && sales.length
    ? [...new Set(sales.map((sale) => sale.propriedade_id).filter(Boolean))]
    : [];

  // Apply filters when filter values change
  useEffect(() => {
    if (!Array.isArray(sales)) {
      setFilteredSales([]);
      return;
    }

    let result = [...sales];

    // Culture filter (only for seed sales)
    if (selectedCulture && selectedCulture !== "all") {
      result = result.filter((sale) => 
        'cultura_id' in sale && sale.cultura_id === selectedCulture
      );
    }

    // Harvest filter
    if (selectedSafraId && selectedSafraId !== "all") {
      result = result.filter((sale) => sale.safra_id === selectedSafraId);
    }

    // Property filter
    if (selectedPropertyId && selectedPropertyId !== "all") {
      result = result.filter((sale) => sale.propriedade_id === selectedPropertyId);
    }

    setFilteredSales(result);
  }, [sales, selectedCulture, selectedSafraId, selectedPropertyId]);

  // Edit handler
  const handleEdit = (sale: T) => {
    setSelectedSale(sale);
    setIsEditDialogOpen(true);
  };

  // Delete handler
  const handleDelete = (sale: T) => {
    setSelectedSale(sale);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete function
  const confirmDelete = async () => {
    if (!selectedSale || !selectedSale.id) return;

    try {
      const result = await deleteSaleFn(selectedSale.id);

      if (result && "success" in result && result.success) {
        // Remove item from local list
        const updatedSales = sales.filter(
          (sale) => sale.id !== selectedSale.id
        );
        setSales(updatedSales);

        // Update filtered list as well to ensure immediate feedback
        setFilteredSales((prev) =>
          prev.filter((sale) => sale.id !== selectedSale.id)
        );

        toast.success("Registro excluído com sucesso!");
      } else {
        toast.error("Erro ao excluir registro");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir registro");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSale(null);
    }
  };

  // Update success handler
  const handleUpdateSuccess = (updatedSale: T) => {
    // Safely update sales with null checks
    if (!updatedSale || !updatedSale.id) {
      return;
    }
    
    // Update local state immediately
    const updatedSales = Array.isArray(sales) 
      ? sales.map((sale) => sale.id === updatedSale.id ? updatedSale : sale)
      : [];
      
    setSales(updatedSales);

    // Update filtered list as well for immediate feedback
    setFilteredSales((prev) =>
      Array.isArray(prev)
        ? prev.map((sale) => sale.id === updatedSale.id ? updatedSale : sale)
        : []
    );

    setIsEditDialogOpen(false);
    setSelectedSale(null);

    // Show success toast
    toast.success("Registro atualizado com sucesso!");
  };

  return {
    sales,
    setSales,
    filteredSales,
    setFilteredSales,
    selectedSafraId,
    setSelectedSafraId,
    selectedPropertyId,
    setSelectedPropertyId,
    selectedCulture,
    setSelectedCulture,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedSale,
    setSelectedSale,
    isRefreshing,
    setIsRefreshing,
    uniqueSafraIds,
    uniquePropertyIds,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleUpdateSuccess
  };
}