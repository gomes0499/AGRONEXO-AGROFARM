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
import { PlusCircle, Wheat } from "lucide-react";
import { CommodityInventory } from "@/schemas/financial/inventory";
import { CommodityInventoryForm } from "./commodity-inventory-form";
import { CommodityInventoryRowActions } from "./commodity-inventory-row-actions";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
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
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Wheat className="h-5 w-5" />}
        title="Estoques de Commodities"
        description="Controle de estoques de grãos e produtos agrícolas"
        action={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Estoque
          </Button>
        }
        className="mb-4"
      />
      <CardContent>
        <div className="space-y-4">

          {commodityInventories.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-4">
              <div>Nenhum estoque de commodity cadastrado.</div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Primeiro Estoque
              </Button>
            </div>
          ) : filteredInventories.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhum estoque encontrado com os filtros atuais</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Commodity</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
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
                      <TableCell className="text-right">
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
            </div>
          )}
        </div>
      </CardContent>

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
    </Card>
  );
}
