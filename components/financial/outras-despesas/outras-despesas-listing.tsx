"use client";

import React, { useState } from "react";
import { OutrasDespesasListItem } from "@/schemas/financial/outras_despesas";
import { Button } from "@/components/ui/button";
import { PlusIcon, DollarSignIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { OutrasDespesasForm } from "./outras-despesas-form";
import { deleteOutraDespesa } from "@/lib/actions/financial-actions/outras-despesas";
import { OutrasDespesasRowActions } from "./outras-despesas-row-actions";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OutrasDespesasSafraDetail } from "./outras-despesas-safra-detail";

interface OutrasDespesasListingProps {
  organization: { id: string; nome: string };
  initialItems: OutrasDespesasListItem[];
}

export function OutrasDespesasListing({
  organization,
  initialItems,
}: OutrasDespesasListingProps) {
  const [items, setItems] = useState<
    (OutrasDespesasListItem & { isExpanded?: boolean })[]
  >(initialItems.map(item => ({
    ...item,
    total: calculateTotal(item),
    isExpanded: false
  })));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutrasDespesasListItem | null>(null);

  const {
    filteredItems: filteredItems,
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
    totalItems: totalItems,
    filteredCount
  } = useFinancialFilters(items, {
    searchFields: ['nome'],
    categoriaField: 'categoria'
  });

  // Adicionar novo item
  const handleAddItem = (newItem: OutrasDespesasListItem) => {
    const itemWithTotal = {
      ...newItem,
      total: calculateTotal(newItem),
      isExpanded: false
    };
    setItems([itemWithTotal, ...items]);
    setIsAddModalOpen(false);
    toast.success("Despesa adicionada com sucesso.");
  };

  // Atualizar item existente
  const handleUpdateItem = (updatedItem: OutrasDespesasListItem) => {
    const updatedItemData = items.find(i => i.id === updatedItem.id);
    const itemWithTotal = {
      ...updatedItem,
      total: calculateTotal(updatedItem),
      isExpanded: updatedItemData?.isExpanded || false
    };
    setItems(
      items.map((item) =>
        item.id === updatedItem.id ? itemWithTotal : item
      )
    );
    setEditingItem(null);
    toast.success("Despesa atualizada com sucesso.");
  };

  // Excluir item
  const handleDeleteItem = async (id: string) => {
    try {
      await deleteOutraDespesa(id, organization.id);
      setItems(items.filter((item) => item.id !== id));
      toast.success("Despesa excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir despesa");
    }
  };
  
  // Toggle expanded state for an item
  const toggleExpanded = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };
  
  // Function to calculate total from valores_por_safra
  function calculateTotal(item: OutrasDespesasListItem): number {
    let total = 0;
    
    if (item.valores_por_safra) {
      if (typeof item.valores_por_safra === 'string') {
        try {
          const parsedValues = JSON.parse(item.valores_por_safra);
          total = Object.values(parsedValues).reduce((acc: number, val) => acc + (Number(val) || 0), 0);
        } catch (e) {
          console.error("Erro ao processar valores_por_safra:", e);
        }
      } else {
        total = Object.values(item.valores_por_safra).reduce((acc: number, val) => acc + (Number(val) || 0), 0);
      }
    }
    
    return total;
  }

  // Função para traduzir a categoria para um formato mais legível
  const formatCategoria = (categoria: string) => {
    const formatMap: Record<string, string> = {
      ARRENDAMENTO: "Arrendamento",
      PRO_LABORE: "Pró-Labore",
      DIVISAO_LUCROS: "Divisão de Lucros",
      FINANCEIRAS: "Despesas Financeiras",
      TRIBUTARIAS: "Despesas Tributárias",
      OUTROS: "Outros"
    };
    
    return formatMap[categoria] || categoria;
  };

  // Render category badge
  const renderCategoriaBadge = (categoria: string) => {
    let variant: "default" | "secondary" | "outline" = "default";
    
    switch (categoria) {
      case "PRO_LABORE":
      case "DIVISAO_LUCROS":
        variant = "default";
        break;
      case "TRIBUTARIAS":
      case "FINANCEIRAS":
        variant = "secondary";
        break;
      case "ARRENDAMENTO":
        variant = "outline";
        break;
      case "OUTROS":
      default:
        variant = "outline";
    }
    
    return (
      <Badge variant={variant} className="font-normal uppercase">
        {formatCategoria(categoria)}
      </Badge>
    );
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<DollarSignIcon className="h-5 w-5" />}
        title="Outras Despesas"
        description="Controle de despesas operacionais e administrativas"
        action={
          <Button
            variant="outline"
            size="default"
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Nova Despesa
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
            searchPlaceholder="Buscar por nome..."
          />

          {items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-4">
              <div>Nenhuma despesa cadastrada.</div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Primeira Despesa
              </Button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhuma despesa encontrada para os filtros aplicados.</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="w-10 font-semibold text-primary-foreground rounded-tl-md"></TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Nome</TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Categoria</TableHead>
                    <TableHead className="font-semibold text-primary-foreground w-[180px] uppercase">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px] uppercase">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => (
                    <React.Fragment key={item.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleExpanded(item.id)}
                          >
                            {item.isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium uppercase" onClick={() => toggleExpanded(item.id)}>
                          {item.nome}
                        </TableCell>
                        <TableCell className="uppercase" onClick={() => toggleExpanded(item.id)}>
                          {renderCategoriaBadge(item.categoria)}
                        </TableCell>
                        <TableCell className="uppercase" onClick={() => toggleExpanded(item.id)}>
                          <span className="font-medium text-sm">
                            {formatGenericCurrency(
                              item.total || 0,
                              "BRL"
                            )}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground uppercase">
                            BRL
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <OutrasDespesasRowActions
                            item={item}
                            onEdit={() => setEditingItem(item)}
                            onDelete={() => handleDeleteItem(item.id)}
                          />
                        </TableCell>
                      </TableRow>
                      {item.isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0 border-t-0">
                            <div className="bg-muted/20 px-4 pb-3">
                              <OutrasDespesasSafraDetail
                                item={item}
                                organizacaoId={organization.id}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
              
              <div className="p-2 bg-muted/10">
                <FinancialPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  totalItems={totalItems}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal para adicionar novo item */}
      <OutrasDespesasForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddItem}
      />

      {/* Modal para editar item existente */}
      {editingItem && (
        <OutrasDespesasForm
          open={!!editingItem}
          onOpenChange={() => setEditingItem(null)}
          organizationId={organization.id}
          existingItem={editingItem}
          onSubmit={handleUpdateItem}
        />
      )}
    </Card>
  );
}