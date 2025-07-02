"use client";

import React, { useState, useTransition, useCallback } from "react";
import { ReceitaFinanceira } from "@/schemas/financial/receitas_financeiras";
import { Button } from "@/components/ui/button";
import { TrendingUp, FileSpreadsheet, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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
  safras?: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
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
  const [receitas, setReceitas] = useState<any[]>(
    (initialReceitasFinanceiras || []).map((receita) => ({
      ...receita,
      isExpanded: false,
    }))
  );
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Refresh data when needed
  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const newReceitas = await getReceitasFinanceiras(organizationId);
        setReceitas(
          newReceitas.map((receita) => ({
            ...receita,
            isExpanded: false,
          }))
        );
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

  // Toggle expansion
  const toggleExpansion = useCallback((id: string) => {
    setReceitas((prev) =>
      prev.map((receita) =>
        receita.id === id
          ? { ...receita, isExpanded: !receita.isExpanded }
          : receita
      )
    );
  }, []);

  // Calcular total geral
  const totalGeral = receitas.reduce((sum, receita) => {
    return sum + (receita.valor || 0);
  }, 0);

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
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Safra</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitas.map((receita) => (
                      <React.Fragment key={receita.id}>
                        {/* Linha principal */}
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpansion(receita.id)}
                            >
                              {receita.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {receita.descricao}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                categoryColors[receita.categoria] ||
                                categoryColors.OUTRAS_RECEITAS
                              }
                            >
                              {categoryLabels[receita.categoria] || receita.categoria}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            -
                          </TableCell>
                          <TableCell className="text-right font-medium">
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

                        {/* Detalhamento por safra (expandido) */}
                        {receita.isExpanded && receita.valores_por_safra && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/20 p-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium">Detalhamento por Safra</h4>
                                  <div className="text-sm font-medium">
                                    Total: {formatCurrency(receita.valor || 0)}
                                  </div>
                                </div>
                                
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>SAFRA</TableHead>
                                      <TableHead className="text-right">VALOR</TableHead>
                                      <TableHead className="text-right">% DO TOTAL</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {/* Ordenar safras por ano */}
                                    {safras
                                      .filter(safra => receita.valores_por_safra[safra.id])
                                      .sort((a, b) => a.ano_inicio - b.ano_inicio)
                                      .map((safra) => {
                                        const valor = receita.valores_por_safra[safra.id] || 0;
                                        const percentual = receita.valor > 0 
                                          ? ((valor / receita.valor) * 100).toFixed(1)
                                          : "0.0";
                                        
                                        return (
                                          <TableRow key={safra.id}>
                                            <TableCell>{safra.nome}</TableCell>
                                            <TableCell className="text-right">
                                              {formatCurrency(valor)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {percentual}%
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                    
                    {/* Linha de total geral */}
                    <TableRow className="bg-primary/10 font-medium">
                      <TableCell colSpan={4} className="text-right">
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