"use client";

import React, { useState, useTransition, useCallback, useMemo } from "react";
import { OutrasDespesasListItem } from "@/schemas/financial/outras_despesas";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  DollarSignIcon,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
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
import {
  deleteOutraDespesa,
  getOutrasDespesas,
} from "@/lib/actions/financial-actions/outras-despesas";
import { OutrasDespesasRowActions } from "./outras-despesas-row-actions";
import { OutrasDespesasPopoverEditor } from "./outras-despesas-popover-editor";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialPagination } from "../common/financial-pagination";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OutrasDespesasSafraDetail } from "./outras-despesas-safra-detail";
import { OutrasDespesasImportDialog } from "./outras-despesas-import-dialog";
import { EmptyState } from "@/components/shared/empty-state";

interface OutrasDespesasListingProps {
  organization: { id: string; nome: string };
  initialOutrasDespesas: OutrasDespesasListItem[];
  projectionId?: string;
  error?: string;
  safras?: any[];
}

export function OutrasDespesasListing({
  organization,
  initialOutrasDespesas,
  projectionId,
  error: initialError,
  safras = [],
}: OutrasDespesasListingProps) {
  const [items, setItems] = useState<
    (OutrasDespesasListItem & { isExpanded?: boolean })[]
  >(
    (initialOutrasDespesas || []).map((item) => ({
      ...item,
      total: calculateTotal(item),
      isExpanded: false,
    }))
  );
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutrasDespesasListItem | null>(
    null
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = items.slice(startIndex, startIndex + itemsPerPage);

  // Calcular total geral
  const grandTotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (item.total || calculateTotal(item)),
      0
    );
  }, [items]);

  // Function to calculate total from valores_por_safra
  function calculateTotal(item: OutrasDespesasListItem): number {
    let total = 0;

    if (item.valores_por_safra) {
      if (typeof item.valores_por_safra === "string") {
        try {
          const parsedValues = JSON.parse(item.valores_por_safra);
          total = Object.values(parsedValues).reduce(
            (acc: number, val) => acc + (Number(val) || 0),
            0
          );
        } catch (e) {
          console.error("Erro ao processar valores_por_safra:", e);
        }
      } else {
        total = Object.values(item.valores_por_safra).reduce(
          (acc: number, val) => acc + (Number(val) || 0),
          0
        );
      }
    }

    return total;
  }

  // Refresh data when needed
  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const newItems = await getOutrasDespesas(organization.id);
        setItems(
          newItems.map((item) => ({
            ...item,
            total: calculateTotal(item),
            isExpanded: false,
          }))
        );
        setError(null);
      } catch (err) {
        console.error("❌ Erro ao atualizar outras despesas:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar dados";
        setError(`Erro ao buscar outras despesas: ${errorMessage}`);
      }
    });
  }, [organization.id]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Adicionar novo item
  const handleAddItem = useCallback((newItem: OutrasDespesasListItem) => {
    const itemWithTotal = {
      ...newItem,
      total: calculateTotal(newItem),
      isExpanded: false,
    };
    setItems((prev) => [itemWithTotal, ...prev]);
    setIsAddModalOpen(false);
    toast.success("Despesa adicionada com sucesso.");
  }, []);

  // Importar itens via Excel
  const handleImportSuccess = useCallback(
    (importedItems: OutrasDespesasListItem[]) => {
      const itemsWithTotal = importedItems.map((item) => ({
        ...item,
        total: calculateTotal(item),
        isExpanded: false,
      }));
      setItems((prev) => [...itemsWithTotal, ...prev]);
      setIsImportModalOpen(false);
      refreshData();
      toast.success("Itens importados com sucesso!");
    },
    [refreshData]
  );

  // Atualizar item existente
  const handleUpdateItem = useCallback(
    (updatedItem: OutrasDespesasListItem) => {
      setItems((prev) => {
        const updatedItemData = prev.find((i) => i.id === updatedItem.id);
        const itemWithTotal = {
          ...updatedItem,
          total: calculateTotal(updatedItem),
          isExpanded: updatedItemData?.isExpanded || false,
        };
        return prev.map((item) =>
          item.id === updatedItem.id ? itemWithTotal : item
        );
      });
      setEditingItem(null);
      toast.success("Despesa atualizada com sucesso.");
    },
    []
  );

  // Excluir item
  const handleDeleteItem = useCallback(
    async (id: string) => {
      try {
        await deleteOutraDespesa(id, organization.id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("Despesa excluída com sucesso.");
      } catch (error) {
        toast.error("Erro ao excluir despesa");
      }
    },
    [organization.id]
  );

  // Toggle expanded state for an item
  const toggleExpanded = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    );
  }, []);

  // Função para traduzir a categoria para um formato mais legível
  const formatCategoria = useCallback((categoria: string) => {
    const formatMap: Record<string, string> = {
      TRIBUTARIAS: "Impostos e Taxas",
      PRO_LABORE: "Pró-Labore",
      OUTRAS_OPERACIONAIS: "Outras Operacionais",
      DESPESAS_ADMINISTRATIVAS: "Despesas Administrativas",
      DESPESAS_COMERCIAIS: "Despesas Comerciais",
      DESPESAS_FINANCEIRAS: "Despesas Financeiras",
      MANUTENCAO: "Manutenção",
      SEGUROS: "Seguros",
      CONSULTORIAS: "Consultorias",
      DEPRECIACAO: "Depreciação",
      AMORTIZACAO: "Amortização",
      ARRENDAMENTOS: "Arrendamentos",
      PESSOAL: "Pessoal e Encargos",
      ENERGIA_COMBUSTIVEL: "Energia e Combustível",
      COMUNICACAO: "Comunicação",
      VIAGENS: "Viagens",
      MATERIAL_ESCRITORIO: "Material de Escritório",
      OUTROS: "Outros",
    };

    return formatMap[categoria] || categoria;
  }, []);

  // Função para renderizar badge de categoria com estilo padrão
  const renderCategoriaBadge = useCallback(
    (categoria: string) => {
      return (
        <Badge variant="default" className="font-normal">
          {formatCategoria(categoria)}
        </Badge>
      );
    },
    [formatCategoria]
  );

  if (error) {
    return (
      <EmptyState
        icon={<DollarSignIcon className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar outras despesas"
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
          icon={<DollarSignIcon className="h-5 w-5" />}
          title="Outras Despesas"
          description="Controle de despesas operacionais e administrativas"
          action={
            <div className="flex gap-2">
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
                Nova Despesa
              </Button>
            </div>
          }
          className="mb-4"
        />
        <CardContent>
          <div className="space-y-4">
            {items.length === 0 ? (
              <EmptyState
                icon={
                  <DollarSignIcon className="h-10 w-10 text-muted-foreground" />
                }
                title="Nenhuma despesa cadastrada"
                description="Comece adicionando suas despesas operacionais e administrativas."
                action={
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Primeira Despesa
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
                      <TableHead className="font-medium text-primary-foreground">
                        Nome
                      </TableHead>
                      <TableHead className="font-medium text-primary-foreground">
                        Categoria
                      </TableHead>
                      <TableHead className="font-medium text-primary-foreground w-[180px]">
                        Valor Total
                      </TableHead>
                      <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md w-[100px]">
                        Ações
                      </TableHead>
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
                              onClick={() => toggleExpanded(item.id || "")}
                            >
                              {item.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell
                            className="font-medium"
                            onClick={() => toggleExpanded(item.id || "")}
                          >
                            {item.nome}
                          </TableCell>
                          <TableCell
                            onClick={() => toggleExpanded(item.id || "")}
                          >
                            {renderCategoriaBadge(item.categoria)}
                          </TableCell>
                          <TableCell
                            onClick={() => toggleExpanded(item.id || "")}
                          >
                            <span className="font-medium text-sm">
                              {formatGenericCurrency(
                                item.total || calculateTotal(item),
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
                              <OutrasDespesasPopoverEditor
                                despesa={item}
                                organizationId={organization.id}
                                onUpdate={handleUpdateItem}
                              />

                              {/* Botões de Editar/Excluir */}
                              <OutrasDespesasRowActions
                                item={item}
                                onEdit={() => setEditingItem(item)}
                                onDelete={() => handleDeleteItem(item.id || "")}
                              />
                            </div>
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

                    {/* Linha de totalização */}
                    {items.length > 0 && (
                      <TableRow className="bg-muted/50 font-bold border-t-2">
                        <TableCell></TableCell>
                        <TableCell colSpan={2} className="text-right font-bold">
                          TOTAL GERAL
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatGenericCurrency(grandTotal, "BRL")}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
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
        <OutrasDespesasForm
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          organizationId={organization.id}
          onSubmit={handleAddItem}
          initialSafras={safras}
        />

        {/* Modal para editar item existente */}
        {editingItem && (
          <OutrasDespesasForm
            open={!!editingItem}
            onOpenChange={() => setEditingItem(null)}
            organizationId={organization.id}
            existingItem={editingItem}
            onSubmit={handleUpdateItem}
            initialSafras={safras}
          />
        )}

        {/* Modal para importar via Excel */}
        <OutrasDespesasImportDialog
          isOpen={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          organizationId={organization.id}
          onSuccess={handleImportSuccess}
        />
      </Card>
    </div>
  );
}
