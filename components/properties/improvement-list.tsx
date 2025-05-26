"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Improvement } from "@/schemas/properties";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImprovementRowActions } from "@/components/properties/improvement-row-actions";
import { ImprovementModal } from "@/components/properties/improvement-modal";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";

interface ImprovementListProps {
  improvements: Improvement[];
  propertyId: string;
  organizationId?: string;
}

export function ImprovementList({
  improvements,
  propertyId,
  organizationId,
}: ImprovementListProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  
  const totalValue = improvements.reduce(
    (sum, imp) => sum + (imp.valor || 0),
    0
  );

  const handleNewImprovement = () => {
    if (!propertyId || !organizationId) {
      console.error("Erro: IDs inválidos para criar benfeitoria", { propertyId, organizationId });
      return;
    }
    setShowModal(true);
  };

  const handleSuccess = () => {
    setShowModal(false);
    router.refresh();
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary 
        icon={<Building className="h-4 w-4" />}
        title="Benfeitorias"
        description={
          improvements.length > 0 
            ? `Infraestrutura e melhorias realizadas na propriedade • ${improvements.length} ${improvements.length === 1 ? 'item' : 'itens'} • Valor total: ${formatCurrency(totalValue)}`
            : "Infraestrutura e melhorias realizadas na propriedade"
        }
        action={
          propertyId && (
            <Button 
              variant="secondary"
              onClick={handleNewImprovement}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Benfeitoria
            </Button>
          )
        }
      />
      <CardContent className="mt-4">
        {improvements.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Descrição</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Dimensões</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Valor</TableHead>
                  <TableHead className="text-right font-semibold text-primary-foreground rounded-tr-md">Ações</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {improvements.map((improvement) => (
                <TableRow key={improvement.id}>
                  <TableCell className="font-medium">
                    {improvement.descricao}
                  </TableCell>
                  <TableCell>{improvement.dimensoes || "-"}</TableCell>
                  <TableCell>{formatCurrency(improvement.valor)}</TableCell>
                  <TableCell className="text-right">
                    <ImprovementRowActions
                      improvement={improvement}
                      propertyId={propertyId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Nenhuma benfeitoria cadastrada"
            description="Cadastre benfeitorias e melhorias realizadas nesta propriedade."
            icon={<Building size={48} className="text-muted-foreground" />}
            action={
              propertyId && (
                <Button onClick={handleNewImprovement}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Benfeitoria
                </Button>
              )
            }
          />
        )}
      </CardContent>

      {/* Modal para nova benfeitoria */}
      {showModal && (
        <ImprovementModal
          propertyId={propertyId}
          organizationId={organizationId || ""}
          open={showModal}
          onOpenChange={setShowModal}
          onSuccess={handleSuccess}
        />
      )}
    </Card>
  );
}
