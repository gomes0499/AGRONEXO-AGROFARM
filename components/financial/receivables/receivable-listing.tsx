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
import { ReceivableContract } from "@/schemas/financial/receivables";
import { ReceivableForm } from "./receivable-form";
import { ReceivableRowActions } from "./receivable-row-actions";
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

interface ReceivableListingProps {
  organization: { id: string; nome: string };
  initialReceivables: ReceivableContract[];
}

export function ReceivableListing({
  organization,
  initialReceivables,
}: ReceivableListingProps) {
  const [receivables, setReceivables] = useState(initialReceivables);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<ReceivableContract | null>(null);

  // Filtrar contratos recebíveis baseado no termo de busca
  const filteredReceivables = receivables.filter((receivable) => {
    return receivable.commodity?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calcular total de contratos recebíveis
  const totalReceivables = filteredReceivables.reduce((sum, receivable) => sum + receivable.valor, 0);

  // Converter o código da commodity para nome legível
  const getCommodityLabel = (code?: string) => {
    if (!code) return "—";
    
    const commodityLabels: Record<string, string> = {
      "SOJA": "Soja",
      "ALGODAO": "Algodão",
      "MILHO": "Milho",
      "MILHETO": "Milheto",
      "SORGO": "Sorgo",
      "FEIJAO_GURUTUBA": "Feijão Gurutuba",
      "FEIJAO_CARIOCA": "Feijão Carioca",
      "MAMONA": "Mamona",
      "SEM_PASTAGEM": "Sem Pastagem",
      "CAFE": "Café",
      "TRIGO": "Trigo",
      "PECUARIA": "Pecuária",
      "OUTROS": "Outros"
    };
    
    return commodityLabels[code] || code;
  };

  // Adicionar novo contrato recebível
  const handleAddReceivable = (newReceivable: ReceivableContract) => {
    setReceivables((prev) => [newReceivable, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar contrato recebível existente
  const handleUpdateReceivable = (updatedReceivable: ReceivableContract) => {
    setReceivables((prev) =>
      prev.map((receivable) =>
        receivable.id === updatedReceivable.id ? updatedReceivable : receivable
      )
    );
    setEditingReceivable(null);
  };

  // Excluir contrato recebível
  const handleDeleteReceivable = (id: string) => {
    setReceivables((prev) => prev.filter((receivable) => receivable.id !== id));
  };

  return (
    <div className="space-y-4">
      <FinancialHeader
        title="Contratos Recebíveis"
        description="Gerencie os contratos recebíveis e valores a receber"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Contrato
          </Button>
        }
      />

      <FinancialFilterBar onSearch={setSearchTerm} />

      <Card>
        <CardContent className="p-0">
          {receivables.length === 0 ? (
            <EmptyState
              title="Nenhum contrato recebível cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro contrato recebível."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Contrato
                </Button>
              }
            />
          ) : filteredReceivables.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum contrato recebível encontrado para "{searchTerm}"</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map((receivable) => (
                    <TableRow key={receivable.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getCommodityLabel(receivable.commodity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrencyUtil(receivable.valor)}
                      </TableCell>
                      <TableCell>
                        <ReceivableRowActions
                          receivable={receivable}
                          onEdit={() => setEditingReceivable(receivable)}
                          onDelete={() => handleDeleteReceivable(receivable.id!)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Rodapé com totalização */}
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Recebível:</span>
                  <span className="font-bold">{formatCurrencyUtil(totalReceivables)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar novo contrato recebível */}
      <ReceivableForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddReceivable}
      />

      {/* Modal para editar contrato recebível existente */}
      {editingReceivable && (
        <ReceivableForm
          open={!!editingReceivable}
          onOpenChange={() => setEditingReceivable(null)}
          organizationId={organization.id}
          existingReceivable={editingReceivable}
          onSubmit={handleUpdateReceivable}
        />
      )}
    </div>
  );
}