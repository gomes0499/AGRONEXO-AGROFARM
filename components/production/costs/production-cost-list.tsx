"use client";

import { useState, useEffect } from "react";
import { Edit2Icon, Trash2, MoreHorizontal, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";

import { deleteProductionCost } from "@/lib/actions/production-actions";
import { ProductionCostForm } from "./production-cost-form";
import { MultiSafraProductionCostForm } from "./multi-safra-cost-form";
import { formatCurrency } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { FormModal } from "../common/form-modal";
import { ProductionTablePagination } from "../common/production-table-pagination";
import { ProductionCost, Culture, System, Harvest } from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface ProductionCostListProps {
  initialCosts: ProductionCost[];
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  properties: Property[];
  organizationId: string;
}

interface ReferenceNames {
  culture: string;
  system: string;
  harvest: string;
  property?: string;
}

export function ProductionCostList({
  initialCosts,
  cultures,
  systems,
  harvests,
  properties,
  organizationId,
}: ProductionCostListProps) {
  const [costs, setCosts] = useState<ProductionCost[]>(initialCosts);
  const [editingItem, setEditingItem] = useState<ProductionCost | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isMultiSafraModalOpen, setIsMultiSafraModalOpen] = useState<boolean>(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const totalPages = Math.ceil(costs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = costs.slice(startIndex, startIndex + pageSize);
  const totalItems = costs.length;
  
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setCosts(initialCosts);
  }, [initialCosts]);

  // Função para editar um item
  const handleEdit = (item: ProductionCost) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Função para excluir um item
  const handleDelete = async (id: string) => {
    try {
      setDeletingItemId(id);
      await deleteProductionCost(id);
      setCosts(costs.filter((item) => item.id !== id));
      toast.success("Registro de custo excluído com sucesso!");
    } catch (error) {
      toast.error("Ocorreu um erro ao excluir o registro de custo.");
    } finally {
      setDeletingItemId(null);
    }
  };

  // Função para atualizar a lista após edição
  const handleUpdate = (updatedItem: ProductionCost) => {
    setCosts(
      costs.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Função para adicionar múltiplos itens à lista
  const handleAddMultiple = (newItems: ProductionCost[]) => {
    setCosts([...costs, ...newItems]);
  };

  // Função para lidar com múltiplos custos
  const handleMultiSafraSuccess = (newItems: ProductionCost[]) => {
    handleAddMultiple(newItems);
    setIsMultiSafraModalOpen(false);
  };

  // Função para abrir modal de múltiplas safras
  const handleOpenMultiSafra = () => {
    setIsMultiSafraModalOpen(true);
  };

  // Ordenar itens paginados por safra, categoria e cultura
  const sortedItems = [...paginatedData].sort((a, b) => {
    // Use custos_por_safra keys to get safra_id since ProductionCost doesn't have safra_id directly
    const safraIdA = Object.keys(a.custos_por_safra || {})[0] || "";
    const safraA = harvests.find((h) => h.id === safraIdA)?.nome || "";
    const safraIdB = Object.keys(b.custos_por_safra || {})[0] || "";
    const safraB = harvests.find((h) => h.id === safraIdB)?.nome || "";

    // Primeiro por safra (decrescente)
    if (safraA !== safraB) {
      return safraB.localeCompare(safraA);
    }

    // Depois por categoria
    if (a.categoria !== b.categoria) {
      return a.categoria.localeCompare(b.categoria);
    }

    // Por último, por cultura
    const culturaA = cultures.find((c) => c.id === a.cultura_id)?.nome || "";
    const culturaB = cultures.find((c) => c.id === b.cultura_id)?.nome || "";
    return culturaA.localeCompare(culturaB);
  });

  // Função para obter nomes de referência
  const getRefNames = (item: ProductionCost): ReferenceNames => {
    return {
      culture:
        cultures.find((c) => c.id === item.cultura_id)?.nome || "Desconhecida",
      system:
        systems.find((s) => s.id === item.sistema_id)?.nome || "Desconhecido",
      harvest:
        harvests.find((h) => h.id === Object.keys(item.custos_por_safra || {})[0])?.nome || "Desconhecida",
      property:
        properties.find((p) => p.id === item.propriedade_id)?.nome || "",
    };
  };

  // Função para traduzir categoria
  const translateCategory = (category: string): string => {
    const categories: Record<string, string> = {
      CALCARIO: "Calcário",
      FERTILIZANTE: "Fertilizante",
      SEMENTES: "Sementes",
      TRATAMENTO_SEMENTES: "Tratamento de Sementes",
      HERBICIDA: "Herbicida",
      INSETICIDA: "Inseticida",
      FUNGICIDA: "Fungicida",
      OUTROS: "Outros",
      BENEFICIAMENTO: "Beneficiamento",
      SERVICOS: "Serviços",
      ADMINISTRATIVO: "Administrativo",
    };

    return categories[category] || category;
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        title="Registros de Custos"
        icon={<DollarSign className="h-5 w-5" />}
        description="Controle dos custos de produção por categoria e cultura"
        action={
          <Button 
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
            onClick={handleOpenMultiSafra}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Custo
          </Button>
        }
        className="mb-4"
      />
      <CardContent>
        {costs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum registro de custo cadastrado.</div>
            <Button 
              onClick={handleOpenMultiSafra}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Custo
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-medium text-primary-foreground rounded-tl-md">Safra</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Categoria</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Cultura</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Sistema</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Propriedade</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Valor</TableHead>
                    <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => {
                    const refs = getRefNames(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{refs.harvest}</TableCell>
                        <TableCell>{translateCategory(item.categoria)}</TableCell>
                        <TableCell>{refs.culture}</TableCell>
                        <TableCell>{refs.system}</TableCell>
                        <TableCell>{refs.property}</TableCell>
                        <TableCell>
                          {formatCurrency(Object.values(item.custos_por_safra || {}).reduce((sum, val) => sum + val, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                disabled={deletingItemId === item.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Edit2Icon className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Registro de Custo</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este registro de custo? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item.id || "")}
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                      {deletingItemId === item.id ? "Excluindo..." : "Excluir"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginação */}
            <ProductionTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}

        {/* Modal de múltiplas safras */}
        <FormModal
          open={isMultiSafraModalOpen}
          onOpenChange={setIsMultiSafraModalOpen}
          title="Novo Custo - Múltiplas Safras"
          description="Adicione custos para múltiplas safras de uma só vez."
          className="max-w-4xl"
        >
          <MultiSafraProductionCostForm
            cultures={cultures}
            systems={systems}
            harvests={harvests}
            properties={properties}
            organizationId={organizationId}
            onSuccess={handleMultiSafraSuccess}
            onCancel={() => setIsMultiSafraModalOpen(false)}
          />
        </FormModal>

        {/* Modal de edição */}
        <FormModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Editar Custo"
          description="Faça as alterações necessárias no registro de custo."
        >
          {editingItem && (
            <ProductionCostForm
              cultures={cultures}
              systems={systems}
              harvests={harvests}
              properties={properties}
              organizationId={organizationId}
              cost={editingItem}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </FormModal>
      </CardContent>
    </Card>
  );
}
