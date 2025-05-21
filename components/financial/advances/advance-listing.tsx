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
import { SupplierAdvance } from "@/schemas/financial/advances";
import { AdvanceForm } from "./advance-form";
import { AdvanceRowActions } from "./advance-row-actions";
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { formatCurrency, formatGenericCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

interface AdvanceListingProps {
  organization: { id: string; nome: string };
  initialAdvances: SupplierAdvance[];
}

export function AdvanceListing({
  organization,
  initialAdvances,
}: AdvanceListingProps) {
  const [advances, setAdvances] = useState(initialAdvances);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<SupplierAdvance | null>(
    null
  );

  // Filtrar adiantamentos baseado no termo de busca
  const filteredAdvances = advances.filter((advance) => {
    if (searchTerm === "") return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Busca mais robusta pelo nome do fornecedor
    const fornecedorNome = advance.fornecedor?.nome || '';
    
    // Verifica se o termo está em qualquer campo relevante
    return (
      // Verifica pelo nome do fornecedor, se disponível
      fornecedorNome.toLowerCase().includes(searchTermLower) ||
      // Verifica pelo UUID do fornecedor
      (advance.fornecedor_id && advance.fornecedor_id.toLowerCase().includes(searchTermLower)) ||
      // Verifica pelo valor (convertido para string)
      (advance.valor && advance.valor.toString().includes(searchTerm))
    );
  });

  // Calcular total de adiantamentos
  const totalAdvances = filteredAdvances.reduce(
    (sum, advance) => sum + advance.valor,
    0
  );

  // Helper de formatação de data removido

  // Adicionar novo adiantamento
  const handleAddAdvance = (newAdvance: SupplierAdvance) => {
    setAdvances((prev) => [newAdvance, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar adiantamento existente
  const handleUpdateAdvance = (updatedAdvance: SupplierAdvance) => {
    setAdvances((prev) =>
      prev.map((advance) =>
        advance.id === updatedAdvance.id ? updatedAdvance : advance
      )
    );
    setEditingAdvance(null);
  };

  // Excluir adiantamento
  const handleDeleteAdvance = (id: string) => {
    setAdvances((prev) => prev.filter((advance) => advance.id !== id));
  };

  return (
    <div className="space-y-4">
      <FinancialHeader
        title="Adiantamentos a Fornecedores"
        description="Gerencie os adiantamentos realizados a fornecedores"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Adiantamento
          </Button>
        }
      />

      <FinancialFilterBar onSearch={setSearchTerm} />

      <Card>
        <CardContent className="p-0">
          {advances.length === 0 ? (
            <EmptyState
              title="Nenhum adiantamento cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro adiantamento a fornecedor."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Adiantamento
                </Button>
              }
            />
          ) : filteredAdvances.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum adiantamento encontrado para "{searchTerm}"
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdvances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell>
                        {/* Exibir nome do fornecedor ou ID formatado */}
                        {advance.fornecedor?.nome || 
                         (advance.fornecedor_id ? 
                          `Fornecedor ID: ${advance.fornecedor_id.substring(0, 8)}...` : 
                          "Fornecedor não definido")}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(advance.valor)}
                      </TableCell>
                      <TableCell>
                        <AdvanceRowActions
                          advance={advance}
                          onEdit={() => setEditingAdvance(advance)}
                          onDelete={() => handleDeleteAdvance(advance.id!)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Rodapé com totalização */}
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total em Adiantamentos:</span>
                  <span className="font-bold">
                    {formatCurrency(totalAdvances)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar novo adiantamento */}
      <AdvanceForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddAdvance}
      />

      {/* Modal para editar adiantamento existente */}
      {editingAdvance && (
        <AdvanceForm
          open={!!editingAdvance}
          onOpenChange={() => setEditingAdvance(null)}
          organizationId={organization.id}
          existingAdvance={editingAdvance}
          onSubmit={handleUpdateAdvance}
        />
      )}
    </div>
  );
}
