"use client";

import { useState } from "react";
import { BankDebt } from "@/schemas/financial";
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
import { BankDebtForm } from "./bank-debt-form";
import { deleteBankDebt } from "@/lib/actions/financial-actions";
import { BankDebtRowActions } from "./bank-debt-row-actions";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";

interface BankDebtListingProps {
  organization: { id: string; nome: string };
  initialBankDebts: BankDebt[];
}

export function BankDebtListing({
  organization,
  initialBankDebts,
}: BankDebtListingProps) {
  const [bankDebts, setBankDebts] = useState<BankDebt[]>(() => {
    // Garantir que o fluxo_pagamento_anual esteja corretamente formatado
    return initialBankDebts.map(debt => {
      let fluxo_pagamento_anual = debt.fluxo_pagamento_anual;
      
      // Se for string, converter para objeto
      if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
        try {
          fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
        } catch (e) {
          console.error("Erro ao fazer parse do fluxo_pagamento_anual:", e);
          fluxo_pagamento_anual = {};
        }
      } else if (!fluxo_pagamento_anual) {
        fluxo_pagamento_anual = {};
      }
      
      return {
        ...debt,
        fluxo_pagamento_anual
      };
    });
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<BankDebt | null>(null);

  // Filtrar dívidas baseado no termo de busca
  const filteredDebts = bankDebts.filter((debt) => {
    return (
      debt.instituicao_bancaria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.modalidade.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Adicionar nova dívida
  const handleAddDebt = (newDebt: BankDebt) => {
    // Garantir que fluxo_pagamento_anual é um objeto
    let fluxo_pagamento_anual = newDebt.fluxo_pagamento_anual;
    if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
      try {
        fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
      } catch (e) {
        console.error("Erro ao fazer parse de fluxo_pagamento_anual:", e);
        fluxo_pagamento_anual = {};
      }
    }
    
    const processedDebt = {
      ...newDebt,
      fluxo_pagamento_anual
    };
    
    setBankDebts([processedDebt, ...bankDebts]);
    setIsAddModalOpen(false);
  };

  // Atualizar dívida existente
  const handleUpdateDebt = (updatedDebt: BankDebt) => {
    // Garantir que fluxo_pagamento_anual é um objeto
    let fluxo_pagamento_anual = updatedDebt.fluxo_pagamento_anual;
    if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
      try {
        fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
      } catch (e) {
        console.error("Erro ao fazer parse de fluxo_pagamento_anual:", e);
        fluxo_pagamento_anual = {};
      }
    }
    
    const processedDebt = {
      ...updatedDebt,
      fluxo_pagamento_anual
    };
    
    setBankDebts(
      bankDebts.map((debt) =>
        debt.id === processedDebt.id ? processedDebt : debt
      )
    );
    setEditingDebt(null);
  };

  // Excluir dívida
  const handleDeleteDebt = async (id: string) => {
    try {
      await deleteBankDebt(id);
      setBankDebts(bankDebts.filter((debt) => debt.id !== id));
      toast.success("Dívida bancária excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida bancária");
    }
  };
  
  // Function to calculate total from fluxo_pagamento_anual
  const calculateTotal = (debt: BankDebt) => {
    let total = 0;
    
    if (debt.fluxo_pagamento_anual) {
      // Se for uma string, tentar fazer parse para objeto
      let flowData = debt.fluxo_pagamento_anual;
      if (typeof flowData === 'string') {
        try {
          flowData = JSON.parse(flowData);
        } catch (e) {
          console.error("Erro ao fazer parse do JSON:", e);
        }
      }
      
      // Agora calcular o total
      if (typeof flowData === 'object' && flowData !== null) {
        total = Object.values(flowData as Record<string, number>)
          .reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      }
    }
    
    return total;
  };

  return (
    <div className="space-y-4">
      <FinancialHeader
        title="Dívidas Bancárias"
        description="Gerencie dívidas bancárias e financiamentos"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Nova Dívida
          </Button>
        }
      />

      <FinancialFilterBar onSearch={setSearchTerm} />

      <Card>
        <CardContent className="p-0">
          {bankDebts.length === 0 ? (
            <EmptyState
              title="Nenhuma dívida bancária cadastrada"
              description="Clique no botão acima para adicionar uma nova dívida bancária."
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
                    <TableHead>Instituição</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Ano Contratação</TableHead>
                    <TableHead>Indexador</TableHead>
                    <TableHead>Taxa Real</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell>{debt.instituicao_bancaria}</TableCell>
                      <TableCell>{debt.modalidade}</TableCell>
                      <TableCell>{debt.ano_contratacao}</TableCell>
                      <TableCell>{debt.indexador || "-"}</TableCell>
                      <TableCell>
                        {debt.taxa_real ? `${debt.taxa_real}%` : "-"}
                      </TableCell>
                      <TableCell>
                        {formatGenericCurrency(
                          calculateTotal(debt),
                          debt.moeda || "BRL"
                        )}
                      </TableCell>
                      <TableCell>
                        <BankDebtRowActions
                          bankDebt={debt}
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
                  <span className="font-medium">Total de Dívidas Bancárias:</span>
                  <span className="font-bold">
                    {(() => {
                      // Agrupar totais por moeda
                      const totals: { [key: string]: number } = {};
                      
                      filteredDebts.forEach(debt => {
                        const moeda = debt.moeda || 'BRL';
                        const total = calculateTotal(debt);
                        
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
      <BankDebtForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddDebt}
      />

      {/* Modal para editar dívida existente */}
      {editingDebt && (
        <BankDebtForm
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
