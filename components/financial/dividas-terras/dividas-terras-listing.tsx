"use client";

import { useState } from "react";
import { DividasTerrasListItem } from "@/schemas/financial/dividas_terras";
import { Button } from "@/components/ui/button";
import { PlusIcon, Building2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DividasTerrasForm } from "./dividas-terras-form";
import { deleteDividaTerra } from "@/lib/actions/financial-actions/dividas-terras";
import { DividasTerrasRowActions } from "./dividas-terras-row-actions";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { toast } from "sonner";

interface DividasTerrasListingProps {
  organization: { id: string; nome: string };
  initialDividasTerras: DividasTerrasListItem[];
}

export function DividasTerrasListing({
  organization,
  initialDividasTerras,
}: DividasTerrasListingProps) {
  const [dividasTerras, setDividasTerras] = useState<DividasTerrasListItem[]>(initialDividasTerras);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDivida, setEditingDivida] = useState<DividasTerrasListItem | null>(null);

  const {
    filteredItems: filteredDividasTerras,
    paginatedItems: paginatedData,
    searchTerm,
    filters,
    filterOptions,
    handleSearchChange,
    handleFilterChange,
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    totalItems: totalDividasTerras,
    filteredCount
  } = useFinancialFilters(dividasTerras, {
    searchFields: ['nome', 'propriedade_nome'],
    yearField: undefined
  });

  // Adicionar nova dívida
  const handleAddDivida = (newDivida: DividasTerrasListItem) => {
    setDividasTerras([newDivida, ...dividasTerras]);
    setIsAddModalOpen(false);
    toast.success("Dívida de terra adicionada com sucesso.");
  };

  // Atualizar dívida existente
  const handleUpdateDivida = (updatedDivida: DividasTerrasListItem) => {
    setDividasTerras(
      dividasTerras.map((divida) =>
        divida.id === updatedDivida.id ? updatedDivida : divida
      )
    );
    setEditingDivida(null);
    toast.success("Dívida de terra atualizada com sucesso.");
  };

  // Excluir dívida
  const handleDeleteDivida = async (id: string) => {
    try {
      await deleteDividaTerra(id, organization.id);
      setDividasTerras(dividasTerras.filter((divida) => divida.id !== id));
      toast.success("Dívida de terra excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida de terra");
    }
  };
  
  // Function to calculate total from valores_por_safra
  const calculateTotal = (divida: DividasTerrasListItem) => {
    let total = 0;
    
    if (divida.valores_por_safra) {
      total = Object.values(divida.valores_por_safra)
        .reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
    }
    
    return total;
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Building2 className="h-5 w-5" />}
        title="Dívidas de Terras"
        description="Controle das dívidas relacionadas à aquisição de propriedades rurais"
        action={
          <Button
            variant="outline"
            size="default"
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Nova Dívida
          </Button>
        }
        className="mb-4"
      />
      <CardContent>
        <div className="space-y-4">
          <FinancialFilterBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={handleFilterChange}
            filterOptions={filterOptions}
            searchPlaceholder="Buscar por nome ou propriedade..."
          />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {totalDividasTerras} dívidas de terras
            </p>
          </div>

          {dividasTerras.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-4">
              <div>Nenhuma dívida de terra cadastrada.</div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Primeira Dívida
              </Button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhuma dívida encontrada para os filtros aplicados.</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Propriedade</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((divida) => (
                    <TableRow key={divida.id}>
                      <TableCell>{divida.nome}</TableCell>
                      <TableCell>{divida.propriedade_nome || "-"}</TableCell>
                      <TableCell>
                        {formatGenericCurrency(
                          calculateTotal(divida),
                          "BRL"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DividasTerrasRowActions
                          dividaTerra={divida}
                          onEdit={() => setEditingDivida(divida)}
                          onDelete={() => handleDeleteDivida(divida.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <FinancialPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={totalDividasTerras}
              />
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal para adicionar nova dívida */}
      <DividasTerrasForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddDivida}
      />

      {/* Modal para editar dívida existente */}
      {editingDivida && (
        <DividasTerrasForm
          open={!!editingDivida}
          onOpenChange={() => setEditingDivida(null)}
          organizationId={organization.id}
          existingDivida={editingDivida}
          onSubmit={handleUpdateDivida}
        />
      )}
    </Card>
  );
}