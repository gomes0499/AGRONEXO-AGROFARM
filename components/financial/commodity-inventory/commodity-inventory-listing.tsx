"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CommodityInventory } from "@/schemas/financial/inventory";
import { CommodityInventoryForm } from "./commodity-inventory-form";
import { CommodityInventoryRowActions } from "./commodity-inventory-row-actions";
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

interface CommodityInventoryListingProps {
  organization: { id: string; nome: string };
  initialCommodityInventories: CommodityInventory[];
}

export function CommodityInventoryListing({
  organization,
  initialCommodityInventories,
}: CommodityInventoryListingProps) {
  const [commodityInventories, setCommodityInventories] = useState(
    initialCommodityInventories
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] =
    useState<CommodityInventory | null>(null);

  // Filtros para o tipo de commodity
  const [filters, setFilters] = useState<{
    [key: string]: {
      label: string;
      options: Array<{ value: string; label: string }>;
      value: string | null;
    };
  }>({
    commodity: {
      label: "Commodity",
      options: [
        { value: "SOJA", label: "Soja" },
        { value: "ALGODAO", label: "Algodão" },
        { value: "MILHO", label: "Milho" },
        { value: "MILHETO", label: "Milheto" },
        { value: "SORGO", label: "Sorgo" },
        { value: "FEIJAO_GURUTUBA", label: "Feijão Gurutuba" },
        { value: "FEIJAO_CARIOCA", label: "Feijão Carioca" },
        { value: "MAMONA", label: "Mamona" },
        { value: "SEM_PASTAGEM", label: "Sementes para Pastagem" },
        { value: "CAFE", label: "Café" },
        { value: "TRIGO", label: "Trigo" },
        { value: "PECUARIA", label: "Pecuária" },
        { value: "OUTROS", label: "Outros" },
      ],
      value: null,
    },
  });

  // Filtrar estoques baseado no termo de busca e filtros
  const filteredInventories = commodityInventories.filter((inventory) => {
    // Verificar filtro de tipo
    if (
      filters.commodity.value &&
      inventory.commodity !== filters.commodity.value
    ) {
      return false;
    }

    // Verificar termo de busca (no tipo da commodity)
    return inventory.commodity.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calcular o total de estoques
  const totalInventoryValue = filteredInventories.reduce(
    (sum, inventory) => sum + inventory.valor_total,
    0
  );

  // Traduzir o tipo de commodity para exibição
  const getCommodityTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      SOJA: "Soja",
      ALGODAO: "Algodão",
      MILHO: "Milho",
      MILHETO: "Milheto",
      SORGO: "Sorgo",
      FEIJAO_GURUTUBA: "Feijão Gurutuba",
      FEIJAO_CARIOCA: "Feijão Carioca",
      MAMONA: "Mamona",
      SEM_PASTAGEM: "Sementes para Pastagem",
      CAFE: "Café",
      TRIGO: "Trigo",
      PECUARIA: "Pecuária",
      OUTROS: "Outros",
    };
    return typeMap[type] || type;
  };

  // Função formatDate removida pois não é mais necessária

  // Adicionar novo estoque
  const handleAddInventory = (newInventory: CommodityInventory) => {
    setCommodityInventories((prev) => [newInventory, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar estoque existente
  const handleUpdateInventory = (updatedInventory: CommodityInventory) => {
    setCommodityInventories((prev) =>
      prev.map((inventory) =>
        inventory.id === updatedInventory.id ? updatedInventory : inventory
      )
    );
    setEditingInventory(null);
  };

  // Excluir estoque
  const handleDeleteInventory = (id: string) => {
    setCommodityInventories((prev) =>
      prev.filter((inventory) => inventory.id !== id)
    );
  };

  // Atualizar filtros
  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <FinancialHeader
        title="Estoques de Commodities"
        description="Gerencie os estoques de commodities agrícolas"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Estoque
          </Button>
        }
      />

      <FinancialFilterBar
        onSearch={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <Card>
        <CardContent className="p-0">
          {commodityInventories.length === 0 ? (
            <EmptyState
              title="Nenhum estoque de commodity cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro estoque de commodity."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Estoque
                </Button>
              }
            />
          ) : filteredInventories.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum estoque de commodity encontrado com os filtros atuais
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventories.map((inventory) => (
                    <TableRow key={inventory.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getCommodityTypeLabel(inventory.commodity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(inventory.valor_total)}
                      </TableCell>
                      <TableCell>
                        <CommodityInventoryRowActions
                          commodityInventory={inventory}
                          onEdit={() => setEditingInventory(inventory)}
                          onDelete={() => handleDeleteInventory(inventory.id!)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Rodapé com totalização */}
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Total:</span>
                  <span className="font-bold">
                    {formatCurrency(totalInventoryValue)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar novo estoque */}
      <CommodityInventoryForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddInventory}
      />

      {/* Modal para editar estoque existente */}
      {editingInventory && (
        <CommodityInventoryForm
          open={!!editingInventory}
          onOpenChange={() => setEditingInventory(null)}
          organizationId={organization.id}
          existingInventory={editingInventory}
          onSubmit={handleUpdateInventory}
        />
      )}
    </div>
  );
}
