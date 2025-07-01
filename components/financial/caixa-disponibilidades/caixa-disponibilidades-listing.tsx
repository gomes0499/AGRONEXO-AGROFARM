"use client";

import React, { useState, useTransition, useCallback } from "react";
import { CaixaDisponibilidadesListItem, CaixaDisponibilidadesCategoriaType } from "@/schemas/financial/caixa_disponibilidades";
import { Button } from "@/components/ui/button";
import { PlusIcon, WalletIcon, ChevronDown, ChevronUp, Settings, FileSpreadsheet, Loader2 } from "lucide-react";
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
import { deleteCaixaDisponibilidades, getCaixaDisponibilidades } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { CaixaDisponibilidadesRowActions } from "./caixa-disponibilidades-row-actions";
import { CaixaDisponibilidadesPopoverEditor } from "./caixa-disponibilidades-popover-editor";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialPagination } from "../common/financial-pagination";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CaixaDisponibilidadesSafraDetail } from "./caixa-disponibilidades-safra-detail";
import { CashPolicyConfigDialog } from "./cash-policy-config-dialog";
import { CaixaDisponibilidadesImportDialog } from "./caixa-disponibilidades-import-dialog";
import { EmptyState } from "@/components/shared/empty-state";

interface CaixaDisponibilidadesListingProps {
  organization: { id: string; nome: string };
  initialItems: CaixaDisponibilidadesListItem[];
  projectionId?: string;
  error?: string;
  safras?: any[];
}

export function CaixaDisponibilidadesListing({
  organization,
  initialItems,
  projectionId,
  error: initialError,
  safras = [],
}: CaixaDisponibilidadesListingProps) {
  const [items, setItems] = useState<
    (CaixaDisponibilidadesListItem & { isExpanded?: boolean })[]
  >((initialItems || []).map(item => ({ ...item, isExpanded: false })));
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CaixaDisponibilidadesListItem | null>(null);
  const [isPolicyConfigOpen, setIsPolicyConfigOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = items.slice(startIndex, startIndex + itemsPerPage);

  // Refresh data when needed
  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const newItems = await getCaixaDisponibilidades(organization.id, projectionId);
        setItems(newItems.map(item => ({ ...item, isExpanded: false })));
        setError(null);
      } catch (err) {
        console.error("❌ Erro ao atualizar caixa e disponibilidades:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar dados";
        setError(`Erro ao buscar caixa e disponibilidades: ${errorMessage}`);
      }
    });
  }, [organization.id, projectionId]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Adicionar novo item
  const handleAddItem = useCallback((newItem: CaixaDisponibilidadesListItem) => {
    setItems([{ ...newItem, isExpanded: false }, ...items]);
    setIsAddModalOpen(false);
    toast.success("Item de caixa e disponibilidades adicionado com sucesso.");
  }, [items]);

  // Importar itens via Excel
  const handleImportSuccess = useCallback((importedItems: CaixaDisponibilidadesListItem[]) => {
    const itemsWithExpanded = importedItems.map(item => ({ ...item, isExpanded: false }));
    setItems([...itemsWithExpanded, ...items]);
    setIsImportModalOpen(false);
    refreshData();
    toast.success("Itens importados com sucesso!");
  }, [items, refreshData]);

  // Atualizar item existente
  const handleUpdateItem = useCallback((updatedItem: CaixaDisponibilidadesListItem) => {
    setItems(prevItems =>
      prevItems.map((item) =>
        item.id === updatedItem.id ? { ...updatedItem, isExpanded: item.isExpanded } : item
      )
    );
    setEditingItem(null);
    toast.success("Item de caixa e disponibilidades atualizado com sucesso.");
  }, []);

  // Excluir item
  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      await deleteCaixaDisponibilidades(id);
      setItems(prevItems => prevItems.filter((item) => item.id !== id));
      toast.success("Item de caixa e disponibilidades excluído com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir item de caixa e disponibilidades");
    }
  }, []);
  
  // Function to calculate total from valores_por_safra
  const calculateTotal = useCallback((item: CaixaDisponibilidadesListItem) => {
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
  }, []);

  // Toggle expanded state for an item
  const toggleExpanded = useCallback((id: string) => {
    setItems(prevItems =>
      prevItems.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  }, []);

  // Função para traduzir a categoria para um formato mais legível
  const formatCategoria = useCallback((categoria: CaixaDisponibilidadesCategoriaType) => {
    const formatMap: Record<CaixaDisponibilidadesCategoriaType, string> = {
      CAIXA_BANCOS: "Caixa e Bancos",
      CLIENTES: "Clientes",
      ADIANTAMENTOS: "Adiantamentos",
      EMPRESTIMOS: "Empréstimos",
      ESTOQUE_DEFENSIVOS: "Estoque de Defensivos",
      ESTOQUE_FERTILIZANTES: "Estoque de Fertilizantes",
      ESTOQUE_ALMOXARIFADO: "Estoque de Almoxarifado",
      ESTOQUE_COMMODITIES: "Estoque de Commodities",
      ESTOQUE_SEMENTES: "Estoque de Sementes",
      SEMOVENTES: "Semoventes",
      ATIVO_BIOLOGICO: "Ativo Biológico"
    };
    
    return formatMap[categoria] || categoria;
  }, []);

  // Função para renderizar badge de categoria com estilo padrão
  const renderCategoriaBadge = useCallback((categoria: CaixaDisponibilidadesCategoriaType) => {
    return (
      <Badge variant="default" className="font-normal">
        {formatCategoria(categoria)}
      </Badge>
    );
  }, [formatCategoria]);

  if (error) {
    return (
      <EmptyState
        icon={<WalletIcon className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar caixa e disponibilidades"
        description={error}
        action={
          <Button onClick={refreshData} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 relative">
      {isPending && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}

      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<WalletIcon className="h-5 w-5" />}
          title="Caixa e Disponibilidades"
          description="Gestão de ativos líquidos e disponibilidades financeiras"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
                onClick={() => setIsPolicyConfigOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
              <Button
                variant="outline"
                size="default"
                className="bg-card hover:bg-accent text-card-foreground border border-border gap-1"
                onClick={() => setIsImportModalOpen(true)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Importar Excel
              </Button>
              <Button
                variant="outline"
                size="default"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                Novo Item
              </Button>
            </div>
          }
          className="mb-4"
        />
        <CardContent>
          <div className="space-y-4">

            {items.length === 0 ? (
              <EmptyState
                icon={<WalletIcon className="h-10 w-10 text-muted-foreground" />}
                title="Nenhum item de caixa e disponibilidades cadastrado"
                description="Comece adicionando seus ativos líquidos e disponibilidades financeiras."
                action={
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Item
                  </Button>
                }
              />
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
                    totalItems={items.length}
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
          initialSafras={safras}
        />

        {/* Modal para editar item existente */}
        {editingItem && (
          <CaixaDisponibilidadesForm
            open={!!editingItem}
            onOpenChange={() => setEditingItem(null)}
            organizationId={organization.id}
            existingItem={editingItem}
            onSubmit={handleUpdateItem}
            initialSafras={safras}
          />
        )}

        {/* Dialog de configuração de política de caixa */}
        <CashPolicyConfigDialog
          open={isPolicyConfigOpen}
          onOpenChange={setIsPolicyConfigOpen}
          organizationId={organization.id}
        />

        {/* Modal para importar via Excel */}
        <CaixaDisponibilidadesImportDialog
          isOpen={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          organizationId={organization.id}
          onSuccess={handleImportSuccess}
        />
      </Card>
    </div>
  );
}