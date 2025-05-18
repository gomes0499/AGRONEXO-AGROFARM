"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { deletePlantingArea } from "@/lib/actions/production-actions";
import { PlantingAreaForm } from "./planting-area-form";
import { formatArea } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { FormModal } from "../common/form-modal";
import { DeleteButton } from "../common/delete-button";
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
      await deletePlantingArea(id);
      setPlantingAreas(plantingAreas.filter((area) => area.id !== id));
      toast.success("Área de plantio excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir área de plantio:", error);
      toast.error("Ocorreu um erro ao excluir a área de plantio.");
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
  };

  // Ordenar áreas por safra, cultura e sistema
  const sortedAreas = [...plantingAreas].sort((a, b) => {
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Áreas de Plantio</CardTitle>
          <CardDescription>
            Listagem de todas as áreas de plantio por propriedade, cultura e
            safra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plantingAreas.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma área de plantio cadastrada. Clique no botão "Nova Área"
              para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Safra</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAreas.map((area) => {
                  const refs = getRefNames(area);
                  return (
                    <TableRow key={area.id}>
                      <TableCell>{refs.harvest}</TableCell>
                      <TableCell>{refs.property}</TableCell>
                      <TableCell>{refs.culture}</TableCell>
                      <TableCell>{refs.system}</TableCell>
                      <TableCell>{refs.cycle}</TableCell>
                      <TableCell>{formatArea(area.area)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(area)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          title="Excluir Área de Plantio"
                          description="Tem certeza que deseja excluir esta área de plantio? Esta ação não pode ser desfeita."
                          onDelete={() => handleDelete(area.id || "")}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
