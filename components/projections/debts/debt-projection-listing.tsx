"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DebtProjectionRowActions } from "./debt-projection-row-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { deleteProjecaoDivida } from "@/lib/actions/projections-actions";
import { formatCurrency } from "@/lib/utils/formatters";

interface ProjecaoDivida {
  id: string;
  organizacao_id: string;
  projecao_config_id: string;
  categoria: string;
  subcategoria?: string;
  ano: number;
  valor: number;
  moeda: string;
  created_at: string;
}

interface DebtProjectionListingProps {
  organization: { id: string; nome: string };
  initialProjections: ProjecaoDivida[];
}

export function DebtProjectionListing({
  organization,
  initialProjections,
}: DebtProjectionListingProps) {
  const [projections, setProjections] =
    useState<ProjecaoDivida[]>(initialProjections);

  const handleEdit = (projection: ProjecaoDivida) => {
    console.log("Editar projeção:", projection);
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteProjecaoDivida(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setProjections(projections.filter((p) => p.id !== id));
        toast.success("Projeção removida com sucesso");
      }
    } catch (error) {
      toast.error("Erro ao remover projeção");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Posição de Dívida Projetada
          </h2>
          <p className="text-muted-foreground">
            Gerencie projeções de dívidas por categoria e período
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nova Projeção
        </Button>
      </div>

      {/* Content */}
      {projections.length === 0 ? (
        <EmptyState
          icon="chart"
          title="Nenhuma projeção encontrada"
          description="Crie sua primeira projeção de dívida para começar"
          action={
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Nova Projeção
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead className="text-right">Ano</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Moeda</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projections.map((projection) => (
                  <TableRow key={projection.id}>
                    <TableCell>
                      <div className="font-medium">{projection.categoria}</div>
                    </TableCell>
                    <TableCell>
                      {projection.subcategoria && (
                        <Badge variant="outline">
                          {projection.subcategoria}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {projection.ano}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(projection.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          projection.moeda === "BRL" ? "default" : "secondary"
                        }
                      >
                        {projection.moeda}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DebtProjectionRowActions
                        debtProjection={{
                          id: projection.id,
                          categoria: projection.categoria,
                          subcategoria: projection.subcategoria,
                          valor: projection.valor,
                          ano: projection.ano,
                        }}
                        onEdit={(debtProjection) => {
                          // Convert DebtProjection back to ProjecaoDivida for the handler
                          const fullProjection = projections.find(
                            (p) => p.id === debtProjection.id
                          );
                          if (fullProjection) {
                            handleEdit(fullProjection);
                          }
                        }}
                        onDelete={handleDelete}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
