"use client";

import React, { useState, useEffect } from "react";
import { Sprout, PlusIcon, Wheat, TreePine, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MobileTable } from "@/components/ui/mobile-table";
import { MobileModal } from "@/components/ui/mobile-modal";
import { deletePlantingArea } from "@/lib/actions/production-actions";
import { PlantingAreaForm } from "./planting-area-form";
import { MultiSafraPlantingAreaForm } from "./multi-safra-planting-area-form";
import { formatArea } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { ProductionTablePagination } from "../common/production-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PlantingArea,
  Culture,
  System,
  Cycle,
  Harvest,
} from "@/schemas/production";

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

export function PlantingAreaListMobile({
  initialPlantingAreas,
  properties,
  cultures,
  systems,
  cycles,
  harvests,
  organizationId,
}: PlantingAreaListProps) {
  const [plantingAreas, setPlantingAreas] = useState<PlantingArea[]>(initialPlantingAreas);
  const [editingArea, setEditingArea] = useState<PlantingArea | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isMultiSafraModalOpen, setIsMultiSafraModalOpen] = useState<boolean>(false);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const isMobile = useIsMobile();
  
  const totalPages = Math.ceil(plantingAreas.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = plantingAreas.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPlantingAreas(initialPlantingAreas);
  }, [initialPlantingAreas]);

  const handleEdit = (area: PlantingArea) => {
    setEditingArea(area);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (updatedArea: PlantingArea) => {
    setPlantingAreas(
      plantingAreas.map((area) =>
        area.id === updatedArea.id ? updatedArea : area
      )
    );
    setIsEditModalOpen(false);
    setEditingArea(null);
    toast.success("Área de plantio atualizada!");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta área de plantio?")) {
      setDeletingAreaId(id);
      try {
        await deletePlantingArea(id);
        setPlantingAreas(plantingAreas.filter((area) => area.id !== id));
        toast.success("Área de plantio excluída!");
      } catch (error) {
        toast.error("Erro ao excluir área de plantio");
      } finally {
        setDeletingAreaId(null);
      }
    }
  };

  const getReferenceNames = (area: PlantingArea) => ({
    property: properties.find((p) => p.id === area.propriedade_id)?.nome || "-",
    culture: cultures.find((c) => c.id === area.cultura_id)?.nome || "-",
    system: systems.find((s) => s.id === area.sistema_id)?.nome || "-",
    cycle: cycles.find((c) => c.id === area.ciclo_id)?.nome || "-",
    harvest: harvests.find((h) => h.id === (area as any).safra_id)?.nome || "-",
  });

  const getCultureIcon = (cultureName: string) => {
    if (cultureName.toLowerCase().includes("soja")) return <Wheat className="h-4 w-4" />;
    if (cultureName.toLowerCase().includes("milho")) return <TreePine className="h-4 w-4" />;
    return <Sprout className="h-4 w-4" />;
  };

  const columns = [
    {
      key: "property",
      header: "Propriedade",
      accessor: (area: PlantingArea) => {
        const names = getReferenceNames(area);
        return (
          <div>
            <div className="font-medium">{names.property}</div>
            <div className="text-xs text-muted-foreground">{names.harvest}</div>
          </div>
        );
      },
      priority: "high" as const,
    },
    {
      key: "culture",
      header: "Cultura",
      accessor: (area: PlantingArea) => {
        const names = getReferenceNames(area);
        return (
          <div className="flex items-center gap-2">
            {getCultureIcon(names.culture)}
            <span>{names.culture}</span>
          </div>
        );
      },
      priority: "high" as const,
    },
    {
      key: "area",
      header: "Área",
      accessor: (area: PlantingArea) => (
        <div className="font-semibold">{formatArea((area as any).area)}</div>
      ),
      priority: "high" as const,
    },
    {
      key: "system",
      header: "Sistema",
      accessor: (area: PlantingArea) => {
        const names = getReferenceNames(area);
        return <Badge variant="outline">{names.system}</Badge>;
      },
      priority: "medium" as const,
    },
    {
      key: "cycle",
      header: "Ciclo",
      accessor: (area: PlantingArea) => {
        const names = getReferenceNames(area);
        return <Badge>{names.cycle}</Badge>;
      },
      priority: "medium" as const,
    },
  ];

  const renderMobileCard = (area: PlantingArea) => {
    const names = getReferenceNames(area);
    
    return (
      <Card key={area.id} className="overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getCultureIcon(names.culture)}
                <h3 className="font-semibold">{names.culture}</h3>
                <Badge className="text-sm">{names.cycle}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{names.property}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatArea((area as any).area)}
              </div>
              <Badge variant="outline" className="text-sm mt-1">
                {names.system}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <Badge variant="secondary">{names.harvest}</Badge>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(area)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDelete(area.id || '')}
                disabled={deletingAreaId === area.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const totalArea = plantingAreas.reduce((sum, area) => sum + ((area as any).area || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              Áreas de Plantio
            </CardTitle>
            <CardDescription className="mt-1">
              {plantingAreas.length} {plantingAreas.length === 1 ? "área" : "áreas"} • {" "}
              {formatArea(totalArea)} total
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMultiSafraModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {isMobile ? "Multi-Safra" : "Adicionar Multi-Safra"}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {isMobile ? "Nova Área" : "Nova Área de Plantio"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isMobile ? (
          <div className="space-y-3">
            {paginatedData.map(renderMobileCard)}
          </div>
        ) : (
          <MobileTable
            data={paginatedData}
            columns={columns}
            keyExtractor={(area) => area.id || ''}
            emptyMessage="Nenhuma área de plantio cadastrada"
          />
        )}

        {totalPages > 1 && (
          <div className="mt-4">
            <ProductionTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={plantingAreas.length}
            />
          </div>
        )}
      </CardContent>

      {/* Modals */}
      <MobileModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingArea(null);
        }}
        title={editingArea ? "Editar Área de Plantio" : "Nova Área de Plantio"}
        size="lg"
      >
        {(() => {
          const PlantingAreaFormAny = PlantingAreaForm as any;
          return (
            <PlantingAreaFormAny
              area={editingArea as any}
              properties={properties}
              cultures={cultures}
              systems={systems}
              cycles={cycles}
              harvests={harvests}
              organizationId={organizationId}
              onSuccess={editingArea ? handleUpdate : (newArea: any) => {
                setPlantingAreas([...plantingAreas, newArea]);
                setIsEditModalOpen(false);
                toast.success("Área de plantio criada!");
              }}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingArea(null);
              }}
            />
          );
        })()}
      </MobileModal>

      <MobileModal
        isOpen={isMultiSafraModalOpen}
        onClose={() => setIsMultiSafraModalOpen(false)}
        title="Adicionar Áreas Multi-Safra"
        size="xl"
      >
        <MultiSafraPlantingAreaForm
          properties={properties}
          cultures={cultures}
          systems={systems}
          cycles={cycles}
          harvests={harvests}
          organizationId={organizationId}
          onSuccess={(newAreas) => {
            setPlantingAreas([...plantingAreas, ...newAreas]);
            setIsMultiSafraModalOpen(false);
            toast.success(`${newAreas.length} áreas de plantio criadas!`);
          }}
          onCancel={() => setIsMultiSafraModalOpen(false)}
        />
      </MobileModal>
    </Card>
  );
}