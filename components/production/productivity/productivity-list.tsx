"use client";

import { useState, useEffect } from "react";
import { Edit2Icon, Trash2, MoreHorizontal, TrendingUp, Plus } from "lucide-react";
import { ProductionTableFilter } from "../common/production-table-filter";
import { ProductionTablePagination } from "../common/production-table-pagination";
import { useProductionTable } from "@/hooks/use-production-table";
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

import { deleteProductivity } from "@/lib/actions/production-actions";
import { ProductivityForm } from "./productivity-form";
import { MultiSafraProductivityForm } from "./multi-safra-productivity-form";
import { toast } from "sonner";
import { FormModal } from "../common/form-modal";
import { Productivity, Culture, System, Harvest } from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface ProductivityListProps {
  initialProductivities: Productivity[];
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

export function ProductivityList({
  initialProductivities,
  cultures,
  systems,
  harvests,
  properties,
  organizationId,
}: ProductivityListProps) {
  const [productivities, setProductivities] = useState<Productivity[]>(
    initialProductivities
  );
  const [editingItem, setEditingItem] = useState<Productivity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isMultiSafraModalOpen, setIsMultiSafraModalOpen] = useState<boolean>(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Hook para gerenciar filtros e paginação
  const {
    searchTerm,
    filters,
    currentPage,
    pageSize,
    paginatedData,
    totalPages,
    totalItems,
    setSearchTerm,
    setFilters,
    setCurrentPage,
    setPageSize,
  } = useProductionTable({
    data: productivities,
    searchFields: ["cultura_id", "sistema_id"],
    initialPageSize: 20,
  });

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setProductivities(initialProductivities);
  }, [initialProductivities]);

  // Função para editar um item
  const handleEdit = (item: Productivity) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Função para excluir um item
  const handleDelete = async (id: string) => {
    try {
      setDeletingItemId(id);
      await deleteProductivity(id);
      setProductivities(productivities.filter((item) => item.id !== id));
      toast.success("Registro de produtividade excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir registro de produtividade:", error);
      toast.error("Ocorreu um erro ao excluir o registro de produtividade.");
    } finally {
      setDeletingItemId(null);
    }
  };

  // Função para atualizar a lista após edição
  const handleUpdate = (updatedItem: Productivity) => {
    setProductivities(
      productivities.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Função para adicionar múltiplos itens à lista
  const handleAddMultiple = (newItems: Productivity[]) => {
    setProductivities([...productivities, ...newItems]);
  };

  // Função para lidar com múltiplas produtividades
  const handleMultiSafraSuccess = (newItems: Productivity[]) => {
    handleAddMultiple(newItems);
    setIsMultiSafraModalOpen(false);
  };

  // Função para abrir modal de múltiplas safras
  const handleOpenMultiSafra = () => {
    setIsMultiSafraModalOpen(true);
  };

  // Criar opções para filtros
  const filterOptions = {
    safras: harvests.filter(h => h.id).map(h => ({ value: h.id!, label: h.nome })),
    culturas: cultures.filter(c => c.id).map(c => ({ value: c.id!, label: c.nome })),
    sistemas: systems.filter(s => s.id).map(s => ({ value: s.id!, label: s.nome })),
    propriedades: properties.filter(p => p.id).map(p => ({ value: p.id!, label: p.nome })),
  };

  // Ordenar itens paginados por safra e cultura
  const sortedItems = [...paginatedData].sort((a, b) => {
    // Get first safra_id from produtividades_por_safra keys
    const firstSafraIdA = Object.keys(a.produtividades_por_safra || {})[0] || "";
    const firstSafraIdB = Object.keys(b.produtividades_por_safra || {})[0] || "";
    
    const safraA = harvests.find((h) => h.id === firstSafraIdA)?.nome || "";
    const safraB = harvests.find((h) => h.id === firstSafraIdB)?.nome || "";

    // Primeiro por safra (decrescente)
    if (safraA !== safraB) {
      return safraB.localeCompare(safraA);
    }

    // Depois por cultura
    const culturaA = cultures.find((c) => c.id === a.cultura_id)?.nome || "";
    const culturaB = cultures.find((c) => c.id === b.cultura_id)?.nome || "";
    return culturaA.localeCompare(culturaB);
  });

  // Função para obter nomes de referência
  const getRefNames = (item: Productivity): ReferenceNames => {
    return {
      culture:
        cultures.find((c) => c.id === item.cultura_id)?.nome || "Desconhecida",
      system:
        systems.find((s) => s.id === item.sistema_id)?.nome || "Desconhecido",
      harvest:
        // Get the first safra from the produtividades_por_safra keys
        harvests.find((h) => h.id === Object.keys(item.produtividades_por_safra || {})[0])?.nome || "Desconhecida",
      property:
        properties.find((p) => p.id === item.propriedade_id)?.nome || "",
    };
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        title="Registros de Produtividade"
        icon={<TrendingUp className="h-5 w-5" />}
        description="Controle da produtividade por cultura, sistema e safra"
        action={
          <Button 
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
            onClick={handleOpenMultiSafra}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Produtividade
          </Button>
        }
        className="mb-4"
      />
      <CardContent>
        {/* Filtros e busca */}
        <ProductionTableFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFiltersChange={setFilters}
          safras={filterOptions.safras}
          culturas={filterOptions.culturas}
          sistemas={filterOptions.sistemas}
          propriedades={filterOptions.propriedades}
        />

        {productivities.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum registro de produtividade cadastrado.</div>
            <Button 
              onClick={handleOpenMultiSafra}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Produtividade
            </Button>
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum registro de produtividade encontrado com os filtros aplicados.</div>
            <Button 
              onClick={handleOpenMultiSafra}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Produtividade
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md uppercase">Safra</TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Cultura</TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Sistema</TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Propriedade</TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Produtividade</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px] uppercase">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => {
                    const refs = getRefNames(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium uppercase">{refs.harvest}</TableCell>
                        <TableCell className="uppercase">{refs.culture}</TableCell>
                        <TableCell className="uppercase">{refs.system}</TableCell>
                        <TableCell className="uppercase">{refs.property}</TableCell>
                        <TableCell className="uppercase">
                          {Object.entries(item.produtividades_por_safra || {}).map(([safraId, data], index) => (
                            <span key={safraId}>
                              {index > 0 && ", "}
                              {data.produtividade} {data.unidade}
                            </span>
                          ))}
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
                                    <AlertDialogTitle>Excluir Registro de Produtividade</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este registro de produtividade? Esta ação não pode ser desfeita.
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
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}

        {/* Modal de múltiplas safras */}
        <FormModal
          open={isMultiSafraModalOpen}
          onOpenChange={setIsMultiSafraModalOpen}
          title="Nova Produtividade - Múltiplas Safras"
          description="Adicione registros de produtividade para múltiplas safras de uma só vez."
          className="max-w-4xl"
        >
          <MultiSafraProductivityForm
            properties={properties}
            cultures={cultures}
            systems={systems}
            harvests={harvests}
            organizationId={organizationId}
            onSuccess={handleMultiSafraSuccess}
            onCancel={() => setIsMultiSafraModalOpen(false)}
          />
        </FormModal>

        {/* Modal de edição */}
        <FormModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Editar Produtividade"
          description="Faça as alterações necessárias no registro de produtividade."
        >
          {editingItem && (
            <ProductivityForm
              cultures={cultures}
              systems={systems}
              harvests={harvests}
              properties={properties}
              organizationId={organizationId}
              productivity={editingItem}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </FormModal>
      </CardContent>
    </Card>
  );
}
