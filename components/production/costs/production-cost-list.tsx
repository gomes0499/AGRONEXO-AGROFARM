"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
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
import {
  deleteProductionCost,
  getProductionCosts,
} from "@/lib/actions/production-actions";
import { ProductionCostForm } from "./production-cost-form";
import { formatCurrency } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { FormModal } from "../common/form-modal";
import { DeleteButton } from "../common/delete-button";
import { ProductionCost, Culture, System, Harvest } from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
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
      await deleteProductionCost(id);
      // Ainda mantemos a atualização local para uma UI responsiva
      // mas o revalidatePath no servidor vai garantir dados frescos na próxima renderização
      setCosts(costs.filter((item) => item.id !== id));
      toast.success("Registro de custo excluído com sucesso!");
    } catch (error) {
      toast.error("Ocorreu um erro ao excluir o registro de custo.");
    }
  };

  // Função para atualizar a lista após edição
  const handleUpdate = (updatedItem: ProductionCost) => {
    // Atualização local para UI responsiva
    setCosts(
      costs.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Ordenar itens por safra, categoria e cultura
  const sortedItems = [...costs].sort((a, b) => {
    const safraA = harvests.find((h) => h.id === a.safra_id)?.nome || "";
    const safraB = harvests.find((h) => h.id === b.safra_id)?.nome || "";

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
        harvests.find((h) => h.id === item.safra_id)?.nome || "Desconhecida",
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Registros de Custos</CardTitle>
          <CardDescription>
            Custos de produção por categoria, cultura, sistema e safra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {costs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum registro de custo cadastrado. Clique no botão "Novo Custo"
              para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Safra</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => {
                  const refs = getRefNames(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{refs.harvest}</TableCell>
                      <TableCell>{translateCategory(item.categoria)}</TableCell>
                      <TableCell>{refs.culture}</TableCell>
                      <TableCell>{refs.system}</TableCell>
                      <TableCell>{refs.property}</TableCell>
                      <TableCell>{formatCurrency(item.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          title="Excluir Registro"
                          description="Tem certeza que deseja excluir este registro de custo? Esta ação não pode ser desfeita."
                          onDelete={() => handleDelete(item.id || "")}
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
    </div>
  );
}
