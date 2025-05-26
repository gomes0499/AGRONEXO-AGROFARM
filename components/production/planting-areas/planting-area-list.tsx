"use client";

import { useState, useEffect } from "react";
import { Edit2Icon, Trash2, MoreHorizontal, Sprout, Plus } from "lucide-react";
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

import { deletePlantingArea } from "@/lib/actions/production-actions";
import { PlantingAreaForm } from "./planting-area-form";
import { formatArea } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { FormModal } from "../common/form-modal";
import { ProductionTableFilter } from "../common/production-table-filter";
import { ProductionTablePagination } from "../common/production-table-pagination";
import { useProductionTable } from "@/hooks/use-production-table";
import {
  PlantingArea,
  Culture,
  System,
  Cycle,
  Harvest,
} from "@/schemas/production";

// Define interfaces for the property and reference entities
interface Property {
  id: string;
  nome: string;
  [key: string]: any;
}

interface PlantingAreaListProps {
  initialPlantingAreas: PlantingArea[];
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  harvests: Harvest[];
  organizationId: string;
}

interface ReferenceNames {
  property: string;
  culture: string;
  system: string;
  cycle: string;
  harvest: string;
}

export function PlantingAreaList({
  initialPlantingAreas,
  properties,
  cultures,
  systems,
  cycles,
  harvests,
  organizationId,
}: PlantingAreaListProps) {
  const [plantingAreas, setPlantingAreas] =
    useState<PlantingArea[]>(initialPlantingAreas);
  const [editingArea, setEditingArea] = useState<PlantingArea | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);

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
    data: plantingAreas,
    searchFields: ["area"], // Campos para busca textual
    initialPageSize: 20,
  });

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setPlantingAreas(initialPlantingAreas);
  }, [initialPlantingAreas]);

  // Função para editar uma área
  const handleEdit = (area: PlantingArea) => {
    setEditingArea(area);
    setIsEditModalOpen(true);
  };

  // Função para excluir uma área
  const handleDelete = async (id: string) => {
    try {
      setDeletingAreaId(id);
      await deletePlantingArea(id);
      setPlantingAreas(plantingAreas.filter((area) => area.id !== id));
      toast.success("Área de plantio excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir área de plantio:", error);
      toast.error("Ocorreu um erro ao excluir a área de plantio.");
    } finally {
      setDeletingAreaId(null);
    }
  };

  // Função para atualizar a lista após edição
  const handleUpdate = (updatedArea: PlantingArea) => {
    setPlantingAreas(
      plantingAreas.map((area) =>
        area.id === updatedArea.id ? updatedArea : area
      )
    );
    setIsEditModalOpen(false);
    setEditingArea(null);
  };

  // Função para adicionar nova área à lista
  const handleAdd = (newArea: PlantingArea) => {
    setPlantingAreas([...plantingAreas, newArea]);
    setIsCreateModalOpen(false);
  };

  // Função para abrir modal de criação
  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  // Criar opções para filtros
  const filterOptions = {
    safras: harvests.filter(h => h.id).map(h => ({ value: h.id!, label: h.nome })),
    culturas: cultures.filter(c => c.id).map(c => ({ value: c.id!, label: c.nome })),
    sistemas: systems.filter(s => s.id).map(s => ({ value: s.id!, label: s.nome })),
    propriedades: properties.filter(p => p.id).map(p => ({ value: p.id!, label: p.nome })),
  };

  // Ordenar áreas paginadas por safra, cultura e sistema
  const sortedAreas = [...paginatedData].sort((a, b) => {
    const safraA = harvests.find((h) => h.id === a.safra_id)?.nome || "";
    const safraB = harvests.find((h) => h.id === b.safra_id)?.nome || "";

    // Primeiro por safra (decrescente)
    if (safraA !== safraB) {
      return safraB.localeCompare(safraA);
    }

    // Depois por cultura
    const culturaA = cultures.find((c) => c.id === a.cultura_id)?.nome || "";
    const culturaB = cultures.find((c) => c.id === b.cultura_id)?.nome || "";
    if (culturaA !== culturaB) {
      return culturaA.localeCompare(culturaB);
    }

    // Por último, por sistema
    const sistemaA = systems.find((s) => s.id === a.sistema_id)?.nome || "";
    const sistemaB = systems.find((s) => s.id === b.sistema_id)?.nome || "";
    return sistemaA.localeCompare(sistemaB);
  });

  // Função para obter nomes de referência
  const getRefNames = (area: PlantingArea): ReferenceNames => {
    return {
      property:
        properties.find((p) => p.id === area.propriedade_id)?.nome ||
        "Desconhecida",
      culture:
        cultures.find((c) => c.id === area.cultura_id)?.nome || "Desconhecida",
      system:
        systems.find((s) => s.id === area.sistema_id)?.nome || "Desconhecido",
      cycle: cycles.find((c) => c.id === area.ciclo_id)?.nome || "Desconhecido",
      harvest:
        harvests.find((h) => h.id === area.safra_id)?.nome || "Desconhecida",
    };
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        title="Áreas de Plantio"
        icon={<Sprout className="h-5 w-5" />}
        description="Registros de áreas plantadas por safra, cultura e sistema"
        action={
          <Button 
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Área
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

        {plantingAreas.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhuma área de plantio cadastrada.</div>
            <Button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Área
            </Button>
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhuma área de plantio encontrada com os filtros aplicados.</div>
            <Button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Área
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Safra</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Propriedade</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Cultura</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Sistema</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Ciclo</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Área</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAreas.map((area) => {
                    const refs = getRefNames(area);
                    return (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">{refs.harvest}</TableCell>
                        <TableCell>{refs.property}</TableCell>
                        <TableCell>{refs.culture}</TableCell>
                        <TableCell>{refs.system}</TableCell>
                        <TableCell>{refs.cycle}</TableCell>
                        <TableCell>{formatArea(area.area)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                disabled={deletingAreaId === area.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(area)}>
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
                                    <AlertDialogTitle>Excluir Área de Plantio</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir esta área de plantio? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(area.id || "")}
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                      {deletingAreaId === area.id ? "Excluindo..." : "Excluir"}
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

        {/* Modal de criação */}
        <FormModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          title="Nova Área de Plantio"
          description="Adicione uma nova área de plantio."
        >
          <PlantingAreaForm
            properties={properties}
            cultures={cultures}
            systems={systems}
            cycles={cycles}
            harvests={harvests}
            organizationId={organizationId}
            onSuccess={handleAdd}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </FormModal>

        {/* Modal de edição */}
        <FormModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Editar Área de Plantio"
          description="Faça as alterações necessárias na área de plantio."
        >
          {editingArea && (
            <PlantingAreaForm
              properties={properties}
              cultures={cultures}
              systems={systems}
              cycles={cycles}
              harvests={harvests}
              organizationId={organizationId}
              plantingArea={editingArea}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </FormModal>
      </CardContent>
    </Card>
  );
}
