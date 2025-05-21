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
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

interface PropertyDebtListingProps {
  organization: { id: string; nome: string };
  initialPropertyDebts: Array<PropertyDebt & { propriedade: { id: string, nome: string } }>;
}

export function PropertyDebtListing({
  organization,
  initialPropertyDebts,
}: PropertyDebtListingProps) {
  const [propertyDebts, setPropertyDebts] = useState(initialPropertyDebts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<PropertyDebt | null>(null);

  // Filtrar dívidas baseado no termo de busca
  const filteredDebts = propertyDebts.filter((debt) => {
    return (
      debt.credor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.propriedade?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Adicionar nova dívida
  const handleAddDebt = (newDebt: PropertyDebt) => {
    setPropertyDebts((prev) => [
      { 
        ...newDebt, 
        propriedade: { 
          id: newDebt.propriedade_id || '', 
          nome: "Propriedade não informada" 
        } 
      },
      ...prev,
    ] as typeof prev);
    setIsAddModalOpen(false);
  };

  // Atualizar dívida existente
  const handleUpdateDebt = (updatedDebt: PropertyDebt) => {
    setPropertyDebts((prev) =>
      prev.map((debt) =>
        debt.id === updatedDebt.id
          ? { 
              ...updatedDebt, 
              propriedade: {
                id: updatedDebt.propriedade_id || '',
                nome: debt.propriedade?.nome || "Propriedade não informada"
              }
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
    <div className="space-y-4">
      <FinancialHeader
        title="Dívidas de Imóveis"
        description="Gerencie dívidas relacionadas às propriedades e imóveis"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Nova Dívida
          </Button>
        }
      />

      <FinancialFilterBar onSearch={setSearchTerm} />

      <Card>
        <CardContent className="p-0">
          {propertyDebts.length === 0 ? (
            <EmptyState
              title="Nenhuma dívida de imóvel cadastrada"
              description="Clique no botão abaixo para adicionar sua primeira dívida de imóvel."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Dívida
                </Button>
              }
            />
          ) : filteredDebts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma dívida encontrada para "{searchTerm}"</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Denominação do Imóvel</TableHead>
                    <TableHead>Credor</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell>{debt.denominacao_imovel || debt.propriedade?.nome || "—"}</TableCell>
                      <TableCell>{debt.credor}</TableCell>
                      <TableCell>
                        {formatGenericCurrency(debt.valor_total, debt.moeda)}
                      </TableCell>
                      <TableCell>
                        {debt.data_vencimento
                          ? new Date(debt.data_vencimento).toLocaleDateString("pt-BR")
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
              
              {/* Rodapé com totalização */}
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total de Dívidas de Imóveis:</span>
                  <span className="font-bold">
                    {(() => {
                      // Agrupar totais por moeda
                      const totals: { [key: string]: number } = {};
                      
                      filteredDebts.forEach(debt => {
                        const moeda = debt.moeda || 'BRL';
                        const total = debt.valor_total || 0;
                        
                        if (!totals[moeda]) {
                          totals[moeda] = 0;
                        }
                        
                        totals[moeda] += total;
                      });
                      
                      // Formatar e concatenar totais por moeda
                      return Object.entries(totals)
                        .map(([moeda, valor]) => formatGenericCurrency(valor, moeda as any))
                        .join(' + ');
                    })()}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}