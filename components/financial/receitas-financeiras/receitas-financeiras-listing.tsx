"use client";

import React, { useState, useTransition, useCallback } from "react";
import { ReceitaFinanceira } from "@/schemas/financial/receitas_financeiras";
import { Button } from "@/components/ui/button";
import { TrendingUp, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatters";
import { ReceitasFinanceirasRowActions } from "./receitas-financeiras-row-actions";
import { NewReceitasFinanceirasButton } from "./new-receitas-financeiras-button";
import { ReceitasFinanceirasImportDialog } from "./receitas-financeiras-import-dialog";
import { getReceitasFinanceiras } from "@/lib/actions/financial-actions/receitas-financeiras-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  JUROS_APLICACOES: "Juros de Aplicações",
  RENDIMENTOS_FUNDOS: "Rendimentos de Fundos",
  DESCONTOS_OBTIDOS: "Descontos Obtidos",
  VARIACAO_CAMBIAL: "Variação Cambial",
  HEDGE: "Hedge",
  DIVIDENDOS: "Dividendos",
  OUTRAS_RECEITAS: "Outras Receitas",
};

const categoryColors: Record<string, string> = {
  JUROS_APLICACOES: "bg-green-100 text-green-800",
  RENDIMENTOS_FUNDOS: "bg-blue-100 text-blue-800",
  DESCONTOS_OBTIDOS: "bg-purple-100 text-purple-800",
  VARIACAO_CAMBIAL: "bg-yellow-100 text-yellow-800",
  HEDGE: "bg-orange-100 text-orange-800",
  DIVIDENDOS: "bg-indigo-100 text-indigo-800",
  OUTRAS_RECEITAS: "bg-gray-100 text-gray-800",
};

interface ReceitasFinanceirasListingProps {
  organizationId: string;
  receitas: ReceitaFinanceira[];
  projectionId?: string;
  safras?: Array<{ id: string; nome: string }>;
  selectedSafraId?: string;
  error?: string;
}

export function ReceitasFinanceirasListing({
  organizationId,
  receitas: initialReceitasFinanceiras,
  projectionId,
  safras = [],
  selectedSafraId,
  error: initialError,
}: ReceitasFinanceirasListingProps) {
  const [receitas, setReceitas] = useState<ReceitaFinanceira[]>(initialReceitasFinanceiras || []);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Refresh data when needed
  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const newReceitas = await getReceitasFinanceiras(organizationId);
        setReceitas(newReceitas);
        setError(null);
      } catch (err) {
        console.error("❌ Erro ao atualizar receitas financeiras:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar dados";
        setError(`Erro ao buscar receitas financeiras: ${errorMessage}`);
      }
    });
  }, [organizationId]);

  // Handle update
  const handleUpdate = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // Importar receitas via Excel
  const handleImportSuccess = useCallback((importedReceitas: ReceitaFinanceira[]) => {
    setIsImportModalOpen(false);
    refreshData();
    toast.success("Receitas importadas com sucesso!");
  }, [refreshData]);

  // Calcular totais por categoria
  const totaisPorCategoria = receitas.reduce((acc, receita) => {
    const valor =
      selectedSafraId && receita.safra_id !== selectedSafraId
        ? 0
        : receita.valor || 0;

    if (!acc[receita.categoria]) {
      acc[receita.categoria] = 0;
    }
    acc[receita.categoria] += valor;
    return acc;
  }, {} as Record<string, number>);

  // Calcular total geral
  const totalGeral = Object.values(totaisPorCategoria).reduce(
    (sum, val) => sum + val,
    0
  );

  // Agrupar receitas por categoria
  const receitasPorCategoria = receitas.reduce((acc, receita) => {
    if (!acc[receita.categoria]) {
      acc[receita.categoria] = [];
    }
    acc[receita.categoria].push(receita);
    return acc;
  }, {} as Record<string, ReceitaFinanceira[]>);

  // Safra selecionada
  const safraAtual = selectedSafraId
    ? safras.find((s) => s.id === selectedSafraId)?.nome
    : "Todas as Safras";

  if (error) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar receitas financeiras"
        description={error}
        action={
          <Button onClick={refreshData} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 relative">
      {isPending && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}

      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Receitas Financeiras
                </h3>
                <p className="text-sm text-white/80 mt-0.5">
                  Gerenciamento de receitas financeiras - {safraAtual}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsImportModalOpen(true)}
                className="bg-card hover:bg-accent text-card-foreground border border-border"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Importar Excel
              </Button>
              <NewReceitasFinanceirasButton
                organizationId={organizationId}
                safras={safras}
                onSuccess={handleUpdate}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {receitas.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma receita financeira cadastrada
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece adicionando suas receitas financeiras para melhor controle
              </p>
              <NewReceitasFinanceirasButton
                organizationId={organizationId}
                safras={safras}
                onSuccess={handleUpdate}
                variant="default"
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Safra</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(receitasPorCategoria).map(
                      ([categoria, receitasCategoria]) => (
                        <React.Fragment key={categoria}>
                          {/* Linha de categoria */}
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={3} className="font-medium">
                              <Badge
                                variant="secondary"
                                className={
                                  categoryColors[categoria] ||
                                  categoryColors.OUTRAS_RECEITAS
                                }
                              >
                                {categoryLabels[categoria] || categoria}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(totaisPorCategoria[categoria] || 0)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                          
                          {/* Linhas das receitas */}
                          {receitasCategoria
                            .filter(
                              (receita) =>
                                !selectedSafraId ||
                                receita.safra_id === selectedSafraId
                            )
                            .map((receita) => (
                              <TableRow key={receita.id}>
                                <TableCell className="pl-8">
                                  {receita.descricao}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {categoryLabels[receita.categoria] ||
                                      receita.categoria}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {safras.find((s) => s.id === receita.safra_id)
                                      ?.nome || "-"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(receita.valor || 0)}
                                </TableCell>
                                <TableCell>
                                  <ReceitasFinanceirasRowActions
                                    receita={receita}
                                    organizationId={organizationId}
                                    safras={safras}
                                    onUpdate={handleUpdate}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      )
                    )}
                    
                    {/* Linha de total geral */}
                    <TableRow className="bg-primary/10 font-medium">
                      <TableCell colSpan={3} className="text-right">
                        <strong>Total Geral:</strong>
                      </TableCell>
                      <TableCell className="text-right">
                        <strong>{formatCurrency(totalGeral)}</strong>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>

        {/* Modal para importar via Excel */}
        <ReceitasFinanceirasImportDialog
          isOpen={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          organizationId={organizationId}
          safras={safras}
          onSuccess={handleImportSuccess}
        />
      </Card>
    </div>
  );
}