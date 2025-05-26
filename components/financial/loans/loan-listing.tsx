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
import { PlusCircle, HandCoins } from "lucide-react";
import { ThirdPartyLoan } from "@/schemas/financial/loans";
import { LoanForm } from "./loan-form";
import { LoanRowActions } from "./loan-row-actions";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";

interface LoanListingProps {
  organization: { id: string; nome: string };
  initialLoans: ThirdPartyLoan[];
}

export function LoanListing({ organization, initialLoans }: LoanListingProps) {
  const [loans, setLoans] = useState(initialLoans);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<ThirdPartyLoan | null>(null);

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
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<HandCoins className="h-5 w-5" />}
        title="Empréstimos a Terceiros"
        description="Controle de valores emprestados a terceiros"
        action={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Empréstimo
          </Button>
        }
        className="mb-4"
      />
      <CardContent>
        {loans.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum empréstimo cadastrado.</div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Primeiro Empréstimo
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Beneficiário</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">Valor</TableHead>
                  <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{loan.beneficiario}</TableCell>
                    <TableCell>
                      {formatCurrency(loan.valor)}
                    </TableCell>
                    <TableCell className="text-right">
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
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
