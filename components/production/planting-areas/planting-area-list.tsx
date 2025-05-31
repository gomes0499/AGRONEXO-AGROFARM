"use client";

import { useState, useEffect } from "react";
import { Sprout, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deletePlantingArea } from "@/lib/actions/production-actions";
import { PlantingAreaForm } from "./planting-area-form";
import { MultiSafraPlantingAreaForm } from "./multi-safra-planting-area-form";
import { PlantingAreaRowActions } from "./planting-area-row-actions";
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
  organizacao_id: string;
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
  const [isMultiSafraModalOpen, setIsMultiSafraModalOpen] =
    useState<boolean>(false);
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
    searchFields: ["cultura_id", "sistema_id"], // Campos para busca textual
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

  // Função para adicionar múltiplas áreas à lista
  const handleAddMultiple = (newAreas: PlantingArea[]) => {
    setPlantingAreas([...plantingAreas, ...newAreas]);
  };

  // Função para lidar com múltiplas áreas
  const handleMultiSafraSuccess = (newAreas: PlantingArea[]) => {
    handleAddMultiple(newAreas);
    setIsMultiSafraModalOpen(false);
  };

  // Função para abrir modal de múltiplas safras
  const handleOpenMultiSafra = () => {
    setIsMultiSafraModalOpen(true);
  };

  // Criar opções para filtros
  const filterOptions = {
    safras: harvests
      .filter((h) => h.id)
      .map((h) => ({ value: h.id!, label: h.nome })),
    culturas: cultures
      .filter((c) => c.id)
      .map((c) => ({ value: c.id!, label: c.nome })),
    sistemas: systems
      .filter((s) => s.id)
      .map((s) => ({ value: s.id!, label: s.nome })),
    propriedades: properties
      .filter((p) => p.id)
      .map((p) => ({ value: p.id!, label: p.nome })),
  };

  // Ordenar áreas paginadas por safra, cultura e sistema
  const sortedAreas = [...paginatedData].sort((a, b) => {
    // Get first safra_id from areas_por_safra keys
    const firstSafraIdA = Object.keys(a.areas_por_safra || {})[0] || "";
    const firstSafraIdB = Object.keys(b.areas_por_safra || {})[0] || "";
    
    const safraA = harvests.find((h) => h.id === firstSafraIdA)?.nome || "";
    const safraB = harvests.find((h) => h.id === firstSafraIdB)?.nome || "";

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
        // Get the first safra from the areas_por_safra keys
        harvests.find((h) => h.id === Object.keys(area.areas_por_safra || {})[0])?.nome || "Desconhecida",
    };
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              Áreas de Plantio
            </CardTitle>
            <CardDescription className="text-white/80">
              Registros de áreas plantadas por safra, cultura e sistema
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="gap-1"
            onClick={handleOpenMultiSafra}
          >
            <PlusIcon className="h-4 w-4" />
            Nova Área
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {totalItems} áreas de plantio
            </p>
          </div>

          {plantingAreas.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhuma área de plantio cadastrada.</div>
            <Button 
              onClick={handleOpenMultiSafra}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Primeira Área
            </Button>
          </div>
          ) : totalItems === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhuma área de plantio encontrada para os filtros aplicados.</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-primary rounded-t-md">
                  <TableRow className="border-b-0 hover:bg-primary">
                    <TableHead className="text-white font-medium first:rounded-tl-md">
                      Safra
                    </TableHead>
                    <TableHead className="text-white font-medium">
                      Propriedade
                    </TableHead>
                    <TableHead className="text-white font-medium">
                      Cultura
                    </TableHead>
                    <TableHead className="text-white font-medium">
                      Sistema
                    </TableHead>
                    <TableHead className="text-white font-medium">
                      Ciclo
                    </TableHead>
                    <TableHead className="text-white font-medium">
                      Área
                    </TableHead>
                    <TableHead className="text-white font-medium text-right last:rounded-tr-md w-[100px]">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAreas.map((area) => {
                    const refs = getRefNames(area);
                    return (
                      <TableRow key={area.id}>
                        <TableCell className="font-medium">
                          {refs.harvest}
                        </TableCell>
                        <TableCell>{refs.property}</TableCell>
                        <TableCell>{refs.culture}</TableCell>
                        <TableCell>{refs.system}</TableCell>
                        <TableCell>{refs.cycle}</TableCell>
                        <TableCell>
                          {Object.entries(area.areas_por_safra || {}).map(([safraId, areaValue], index) => (
                            <span key={safraId}>
                              {index > 0 && ", "}
                              {formatArea(areaValue)}
                            </span>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          <PlantingAreaRowActions
                            plantingArea={area}
                            harvests={harvests}
                            onEdit={() => handleEdit(area)}
                            onDelete={() => {
                              setPlantingAreas(plantingAreas.filter((a) => a.id !== area.id));
                              toast.success("Área de plantio excluída com sucesso!");
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <ProductionTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>

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

        {/* Modal de múltiplas safras */}
        <FormModal
          open={isMultiSafraModalOpen}
          onOpenChange={setIsMultiSafraModalOpen}
          title="Nova Área - Múltiplas Safras"
          description="Adicione áreas de plantio para múltiplas safras de uma só vez."
          className="max-w-4xl"
        >
          <MultiSafraPlantingAreaForm
            properties={properties}
            cultures={cultures}
            systems={systems}
            cycles={cycles}
            harvests={harvests}
            organizationId={organizationId}
            onSuccess={handleMultiSafraSuccess}
            onCancel={() => setIsMultiSafraModalOpen(false)}
          />
        </FormModal>

      </CardContent>
    </Card>
  );
}
