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
import { LiquidityFactor } from "@/schemas/financial/liquidity";
import { LiquidityFactorForm } from "./liquidity-factor-form";
import { LiquidityFactorRowActions } from "./liquidity-factor-row-actions";
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

interface LiquidityFactorListingProps {
  organization: { id: string; nome: string };
  initialLiquidityFactors: LiquidityFactor[];
}

export function LiquidityFactorListing({
  organization,
  initialLiquidityFactors,
}: LiquidityFactorListingProps) {
  const [liquidityFactors, setLiquidityFactors] = useState(
    initialLiquidityFactors
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState<LiquidityFactor | null>(
    null
  );

  // Filtros para o tipo de fator de liquidez
  const [filters, setFilters] = useState<{
    [key: string]: {
      label: string;
      options: Array<{ value: string; label: string }>;
      value: string | null;
    };
  }>({
    tipo: {
      label: "Tipo",
      options: [
        { value: "CAIXA", label: "CAIXA" },
        { value: "SALDO_CC", label: "SALDO C/C" },
        { value: "APLICACOES", label: "APLICAÇÕES" },
      ],
      value: null,
    },
  });

  // Filtrar fatores de liquidez baseado no termo de busca e filtros
  const filteredFactors = liquidityFactors.filter((factor) => {
    // Verificar filtro de tipo
    if (filters.tipo.value && factor.tipo !== filters.tipo.value) {
      return false;
    }

    // Verificar termo de busca (no tipo do fator ou nome do banco)
    return (
      factor.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (factor.banco && factor.banco.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Calcular o total de liquidez
  const totalLiquidity = filteredFactors.reduce(
    (sum, factor) => sum + factor.valor,
    0
  );

  // Traduzir o tipo de fator para exibição
  const getFactorTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      CAIXA: "CAIXA",
      SALDO_CC: "SALDO C/C",
      APLICACOES: "APLICAÇÕES",
    };
    return typeMap[type] || type;
  };

  // Adicionar novo fator de liquidez
  const handleAddFactor = (newFactor: LiquidityFactor) => {
    setLiquidityFactors((prev) => [newFactor, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar fator de liquidez existente
  const handleUpdateFactor = (updatedFactor: LiquidityFactor) => {
    setLiquidityFactors((prev) =>
      prev.map((factor) =>
        factor.id === updatedFactor.id ? updatedFactor : factor
      )
    );
    setEditingFactor(null);
  };

  // Excluir fator de liquidez
  const handleDeleteFactor = (id: string) => {
    setLiquidityFactors((prev) => prev.filter((factor) => factor.id !== id));
  };

  // Atualizar filtros
  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <FinancialHeader
        title="Fatores de Liquidez"
        description="Gerencie recursos financeiros disponíveis como caixa, bancos e investimentos"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Fator
          </Button>
        }
      />

      <FinancialFilterBar
        onSearch={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <Card>
        <CardContent className="p-0">
          {liquidityFactors.length === 0 ? (
            <EmptyState
              title="Nenhum fator de liquidez cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro fator de liquidez."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Fator
                </Button>
              }
            />
          ) : filteredFactors.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum fator de liquidez encontrado com os filtros atuais
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFactors.map((factor) => (
                    <TableRow key={factor.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getFactorTypeLabel(factor.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>{factor.banco || "-"}</TableCell>
                      <TableCell>{formatCurrency(factor.valor)}</TableCell>
                      <TableCell>
                        <LiquidityFactorRowActions
                          liquidityFactor={factor}
                          onEdit={() => setEditingFactor(factor)}
                          onDelete={() => handleDeleteFactor(factor.id!)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Rodapé com totalização */}
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total de Liquidez:</span>
                  <span className="font-bold">
                    {formatCurrency(totalLiquidity)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar novo fator */}
      <LiquidityFactorForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddFactor}
      />

      {/* Modal para editar fator existente */}
      {editingFactor && (
        <LiquidityFactorForm
          open={!!editingFactor}
          onOpenChange={() => setEditingFactor(null)}
          organizationId={organization.id}
          existingFactor={editingFactor}
          onSubmit={handleUpdateFactor}
        />
      )}
    </div>
  );
}
