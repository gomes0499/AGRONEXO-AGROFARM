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
import { ThirdPartyLoan } from "@/schemas/financial/loans";
import { LoanForm } from "./loan-form";
import { LoanRowActions } from "./loan-row-actions";
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { formatCurrency, formatGenericCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

interface LoanListingProps {
  organization: { id: string; nome: string };
  initialLoans: ThirdPartyLoan[];
}

export function LoanListing({ organization, initialLoans }: LoanListingProps) {
  const [loans, setLoans] = useState(initialLoans);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<ThirdPartyLoan | null>(null);

  // Filtrar empréstimos baseado no termo de busca - simplificado
  const filteredLoans = loans.filter((loan) => {
    if (searchTerm === "") return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    return (
      // Busca pelo nome do beneficiário
      loan.beneficiario.toLowerCase().includes(searchTermLower) ||
      // Busca pelo valor
      loan.valor.toString().includes(searchTerm)
    );
  });

  // Calcular total de empréstimos
  const totalLoans = filteredLoans.reduce((sum, loan) => sum + loan.valor, 0);

  // Função de formatação de data removida

  // Adicionar novo empréstimo
  const handleAddLoan = (newLoan: ThirdPartyLoan) => {
    setLoans((prev) => [newLoan, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar empréstimo existente
  const handleUpdateLoan = (updatedLoan: ThirdPartyLoan) => {
    setLoans((prev) =>
      prev.map((loan) => (loan.id === updatedLoan.id ? updatedLoan : loan))
    );
    setEditingLoan(null);
  };

  // Excluir empréstimo
  const handleDeleteLoan = (id: string) => {
    setLoans((prev) => prev.filter((loan) => loan.id !== id));
  };

  return (
    <div className="space-y-4">
      <FinancialHeader
        title="Empréstimos a Terceiros"
        description="Gerencie os empréstimos concedidos a terceiros (onde você é o credor e o terceiro é o beneficiário)"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Empréstimo
          </Button>
        }
      />

      <FinancialFilterBar onSearch={setSearchTerm} />

      <Card>
        <CardContent className="p-0">
          {loans.length === 0 ? (
            <EmptyState
              title="Nenhum empréstimo cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro empréstimo a terceiros."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Empréstimo
                </Button>
              }
            />
          ) : filteredLoans.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum empréstimo encontrado para "{searchTerm}"
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>{loan.beneficiario}</TableCell>
                      <TableCell>
                        {formatCurrency(loan.valor)}
                      </TableCell>
                      <TableCell>
                        <LoanRowActions
                          loan={loan}
                          onEdit={() => setEditingLoan(loan)}
                          onDelete={() => handleDeleteLoan(loan.id!)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Rodapé com totalização */}
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total em Empréstimos:</span>
                  <span className="font-bold">
                    {formatCurrency(totalLoans)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar novo empréstimo */}
      <LoanForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddLoan}
      />

      {/* Modal para editar empréstimo existente */}
      {editingLoan && (
        <LoanForm
          open={!!editingLoan}
          onOpenChange={() => setEditingLoan(null)}
          organizationId={organization.id}
          existingLoan={editingLoan}
          onSubmit={handleUpdateLoan}
        />
      )}
    </div>
  );
}
