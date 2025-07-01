"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { PropertyDebt } from "@/schemas/financial/property-debts";
import { PropertyDebtForm } from "./property-debt-form";
import { PropertyDebtRowActions } from "./property-debt-row-actions";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { Home } from "lucide-react";

interface PropertyDebtListingProps {
  organization: { id: string; nome: string };
  initialPropertyDebts: Array<
    PropertyDebt & { propriedade: { id: string; nome: string } }
  >;
}

export function PropertyDebtListing({
  organization,
  initialPropertyDebts,
}: PropertyDebtListingProps) {
  const [propertyDebts, setPropertyDebts] = useState(initialPropertyDebts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<PropertyDebt | null>(null);

  // Filtrar dívidas baseado no termo de busca
  const filteredDebts = propertyDebts.filter((debt) => {
    return true; // Removendo filtro temporariamente para simplificar
  });

  // Adicionar nova dívida
  const handleAddDebt = (newDebt: PropertyDebt) => {
    setPropertyDebts(
      (prev) =>
        [
          {
            ...newDebt,
            propriedade: {
              id: newDebt.propriedade_id || "",
              nome: "Propriedade não informada",
            },
          },
          ...prev,
        ] as typeof prev
    );
    setIsAddModalOpen(false);
  };

  // Atualizar dívida existente
  const handleUpdateDebt = (updatedDebt: PropertyDebt) => {
    setPropertyDebts(
      (prev) =>
        prev.map((debt) =>
          debt.id === updatedDebt.id
            ? {
                ...updatedDebt,
                propriedade: {
                  id: updatedDebt.propriedade_id || "",
                  nome: debt.propriedade?.nome || "Propriedade não informada",
                },
              }
            : debt
        ) as typeof prev
    );
    setEditingDebt(null);
  };

  // Excluir dívida
  const handleDeleteDebt = (id: string) => {
    setPropertyDebts((prev) => prev.filter((debt) => debt.id !== id));
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Home className="h-5 w-5" />}
        title="Dívidas de Imóveis"
        description="Controle de dívidas relacionadas à aquisição de propriedades"
        action={
          <Button
            variant="outline"
            size="default"
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Nova Dívida
          </Button>
        }
        className="mb-4"
      />
      <CardContent className="space-y-4">
        <Card>
          <CardContent className="p-0">
            {propertyDebts.length === 0 ? (
              <EmptyState
                title="Nenhuma dívida de imóvel cadastrada"
                description="Clique no botão acima para adicionar sua primeira dívida de imóvel."
                action={
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    Adicionar Dívida
                  </Button>
                }
              />
            ) : filteredDebts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma dívida encontrada
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="font-semibold text-primary-foreground rounded-tl-md">
                        Denominação do Imóvel
                      </TableHead>
                      <TableHead className="font-semibold text-primary-foreground">
                        Credor
                      </TableHead>
                      <TableHead className="font-semibold text-primary-foreground">
                        Valor Total
                      </TableHead>
                      <TableHead className="font-semibold text-primary-foreground">
                        Vencimento
                      </TableHead>
                      <TableHead className="font-semibold text-primary-foreground rounded-tr-md w-24">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDebts.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell>
                          {debt.denominacao_imovel ||
                            debt.propriedade?.nome ||
                            "—"}
                        </TableCell>
                        <TableCell>{debt.credor}</TableCell>
                        <TableCell>
                          {formatGenericCurrency(debt.valor_total, debt.moeda)}
                        </TableCell>
                        <TableCell>
                          {debt.data_vencimento
                            ? new Date(debt.data_vencimento).toLocaleDateString(
                                "pt-BR"
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <PropertyDebtRowActions
                            propertyDebt={debt}
                            onEdit={() => setEditingDebt(debt)}
                            onDelete={() => handleDeleteDebt(debt.id!)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </CardContent>

      {/* Modal para adicionar nova dívida */}
      <PropertyDebtForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddDebt}
      />

      {/* Modal para editar dívida existente */}
      {editingDebt && (
        <PropertyDebtForm
          open={!!editingDebt}
          onOpenChange={() => setEditingDebt(null)}
          organizationId={organization.id}
          existingDebt={editingDebt}
          onSubmit={handleUpdateDebt}
        />
      )}
    </Card>
  );
}
