"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { bankDebtSchema } from "@/schemas/financial/bank-debts";
import { z } from "zod";

// Componente para exibir uma dívida bancária em formato de card
export function BankDebtCard({
  debt,
  onEdit,
  onDelete,
}: {
  debt: z.infer<typeof bankDebtSchema>;
  onEdit: (debt: z.infer<typeof bankDebtSchema>) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  // Função para formatar valores monetários
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "BRL",
    }).format(value);
  };

  // Calcular o valor total das parcelas do fluxo de pagamento
  const totalPayment = Object.values(debt.fluxo_pagamento_anual || {}).reduce(
    (acc, curr) => acc + (typeof curr === "number" ? curr : 0),
    0
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {debt.instituicao_bancaria}
          </CardTitle>
          <Badge
            variant={debt.modalidade === "CUSTEIO" ? "outline" : "secondary"}
          >
            {debt.modalidade === "CUSTEIO" ? "Custeio" : "Investimentos"}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {debt.ano_contratacao} • {debt.indexador}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Taxa real:</span>
            <span className="font-medium">{debt.taxa_real}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Valor total:</span>
            <span className="font-medium">
              {formatCurrency(totalPayment, debt.moeda)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Moeda:</span>
            <Badge variant="outline">{debt.moeda}</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(debt)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (debt.id) {
              onDelete(debt.id);
            }
          }}
          disabled={!debt.id}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}