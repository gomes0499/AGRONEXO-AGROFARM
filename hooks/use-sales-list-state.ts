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
  const [sales, setSales] = useState<T[]>(initialSales);
  const [filteredSales, setFilteredSales] = useState<T[]>(initialSales);
  const [selectedSafraId, setSelectedSafraId] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [selectedCulture, setSelectedCulture] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<T | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Obtenha IDs exclusivos para safras e propriedades
  const uniqueSafraIds = [...new Set(sales.map((sale) => sale.safra_id))];
  const uniquePropertyIds = [...new Set(sales.map((sale) => sale.propriedade_id))];

  // Aplique filtros quando os valores de filtro mudarem
  useEffect(() => {
    let result = [...sales];

    // Filtro por cultura (apenas para vendas de sementes)
    if (selectedCulture && selectedCulture !== "all") {
      result = result.filter((sale) => 
        'cultura_id' in sale && sale.cultura_id === selectedCulture
      );
    }

    // Filtro por safra
    if (selectedSafraId && selectedSafraId !== "all") {
      result = result.filter((sale) => sale.safra_id === selectedSafraId);
    }

    // Filtro por propriedade
    if (selectedPropertyId && selectedPropertyId !== "all") {
      result = result.filter((sale) => sale.propriedade_id === selectedPropertyId);
    }

    setFilteredSales(result);
  }, [sales, selectedCulture, selectedSafraId, selectedPropertyId]);

  // Função para lidar com edição
  const handleEdit = (sale: T) => {
    setSelectedSale(sale);
    setIsEditDialogOpen(true);
  };

  // Função para lidar com exclusão
  const handleDelete = (sale: T) => {
    setSelectedSale(sale);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar exclusão
  const confirmDelete = async () => {
    if (!selectedSale || !selectedSale.id) return;

    try {
      const result = await deleteSaleFn(selectedSale.id);

      if (result && "success" in result && result.success) {
        // Remove o item da lista local
        const updatedSales = sales.filter(
          (sale) => sale.id !== selectedSale.id
        );
        setSales(updatedSales);

        // Atualiza também a lista filtrada para garantir feedback imediato
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

  // Função para lidar com sucesso na atualização
  const handleUpdateSuccess = (updatedSale: T) => {
    // Atualiza o estado local imediatamente
    const updatedSales = sales.map((sale) =>
      sale.id === updatedSale.id ? updatedSale : sale
    );
    setSales(updatedSales);

    // Atualiza também a lista filtrada para garantir feedback imediato
    setFilteredSales((prev) =>
      prev.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale))
    );

    setIsEditDialogOpen(false);
    setSelectedSale(null);

    // Exibe o toast de sucesso diretamente aqui para garantir feedback visual
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