"use client";

import React, { useState } from "react";
import { CaixaDisponibilidadesListItem, CaixaDisponibilidadesCategoriaType } from "@/schemas/financial/caixa_disponibilidades";
import { Button } from "@/components/ui/button";
import { PlusIcon, WalletIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { CaixaDisponibilidadesForm } from "./caixa-disponibilidades-form";
import { deleteCaixaDisponibilidades } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { CaixaDisponibilidadesRowActions } from "./caixa-disponibilidades-row-actions";
import { CaixaDisponibilidadesPopoverEditor } from "./caixa-disponibilidades-popover-editor";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CaixaDisponibilidadesSafraDetail } from "./caixa-disponibilidades-safra-detail";

interface CaixaDisponibilidadesListingProps {
  organization: { id: string; nome: string };
  initialItems: CaixaDisponibilidadesListItem[];
}

export function CaixaDisponibilidadesListing({
  organization,
  initialItems,
}: CaixaDisponibilidadesListingProps) {
  const [items, setItems] = useState<
    (CaixaDisponibilidadesListItem & { isExpanded?: boolean })[]
  >(initialItems.map(item => ({ ...item, isExpanded: false })));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CaixaDisponibilidadesListItem | null>(null);

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
  const handleAddItem = (newItem: CaixaDisponibilidadesListItem) => {
    setItems([{ ...newItem, isExpanded: false }, ...items]);
    setIsAddModalOpen(false);
    toast.success("Item de caixa e disponibilidades adicionado com sucesso.");
  };

  // Atualizar item existente
  const handleUpdateItem = (updatedItem: CaixaDisponibilidadesListItem) => {
    setItems(
      items.map((item) =>
        item.id === updatedItem.id ? { ...updatedItem, isExpanded: item.isExpanded } : item
      )
    );
    setEditingItem(null);
    toast.success("Item de caixa e disponibilidades atualizado com sucesso.");
  };

  // Excluir item
  const handleDeleteItem = async (id: string) => {
    try {
      await deleteCaixaDisponibilidades(id);
      setItems(items.filter((item) => item.id !== id));
      toast.success("Item de caixa e disponibilidades excluído com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir item de caixa e disponibilidades");
    }
  };
  
  // Function to calculate total from valores_por_safra
  const calculateTotal = (item: CaixaDisponibilidadesListItem) => {
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
  };

  // Toggle expanded state for an item
  const toggleExpanded = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  };

  // Função para traduzir a categoria para um formato mais legível
  const formatCategoria = (categoria: CaixaDisponibilidadesCategoriaType) => {
    const formatMap: Record<CaixaDisponibilidadesCategoriaType, string> = {
      CAIXA_BANCOS: "Caixa e Bancos",
      CLIENTES: "Clientes",
      ADIANTAMENTOS: "Adiantamentos",
      EMPRESTIMOS: "Empréstimos",
      ESTOQUE_DEFENSIVOS: "Estoque de Defensivos",
      ESTOQUE_FERTILIZANTES: "Estoque de Fertilizantes",
      ESTOQUE_ALMOXARIFADO: "Estoque de Almoxarifado",
      ESTOQUE_COMMODITIES: "Estoque de Commodities",
      SEMOVENTES: "Semoventes",
      ATIVO_BIOLOGICO: "Ativo Biológico"
    };
    
    return formatMap[categoria] || categoria;
  };

  // Função para renderizar badge de categoria com estilo padrão
  const renderCategoriaBadge = (categoria: CaixaDisponibilidadesCategoriaType) => {
    return (
      <Badge variant="default" className="font-normal">
        {formatCategoria(categoria)}
      </Badge>
    );
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<WalletIcon className="h-5 w-5" />}
        title="Caixa e Disponibilidades"
        description="Gestão de ativos líquidos e disponibilidades financeiras"
        action={
          <Button
            variant="outline"
            size="default"
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Novo Item
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
              <div>Nenhum item de caixa e disponibilidades cadastrado.</div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhum item encontrado para os filtros aplicados.</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="w-10 font-medium text-primary-foreground rounded-tl-md"></TableHead>
                    <TableHead className="font-medium text-primary-foreground">Nome</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Categoria</TableHead>
                    <TableHead className="font-medium text-primary-foreground w-[180px]">Valor Total</TableHead>
                    <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
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
                            onClick={() => toggleExpanded(item.id || '')}
                          >
                            {item.isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium" onClick={() => toggleExpanded(item.id || '')}>
                          {item.nome}
                        </TableCell>
                        <TableCell onClick={() => toggleExpanded(item.id || '')}>
                          {renderCategoriaBadge(item.categoria)}
                        </TableCell>
                        <TableCell onClick={() => toggleExpanded(item.id || '')}>
                          <span className="font-medium text-sm">
                            {formatGenericCurrency(
                              calculateTotal(item),
                              "BRL"
                            )}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            BRL
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Editor de Valores por Safra via Popover */}
                            <CaixaDisponibilidadesPopoverEditor
                              item={item}
                              organizationId={organization.id}
                              onUpdate={handleUpdateItem}
                            />
                            
                            {/* Botões de Editar/Excluir */}
                            <CaixaDisponibilidadesRowActions
                              item={item}
                              onEdit={() => setEditingItem(item)}
                              onDelete={() => handleDeleteItem(item.id || '')}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      {item.isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0 border-t-0">
                            <div className="bg-muted/20 px-4 pb-3">
                              <CaixaDisponibilidadesSafraDetail
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
              
              <div className="mt-8">
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
      <CaixaDisponibilidadesForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddItem}
      />

      {/* Modal para editar item existente */}
      {editingItem && (
        <CaixaDisponibilidadesForm
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