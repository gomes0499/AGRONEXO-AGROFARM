"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp } from "lucide-react";
import { ReceitaFinanceira } from "@/schemas/financial/receitas_financeiras";
import { formatCurrency } from "@/lib/utils/formatters";
import { ReceitasFinanceirasRowActions } from "./receitas-financeiras-row-actions";
import { NewReceitasFinanceirasButton } from "./new-receitas-financeiras-button";

const categoryLabels: Record<string, string> = {
  JUROS_APLICACOES: "Juros de Aplicações",
  RENDIMENTOS_FUNDOS: "Rendimentos de Fundos",
  DESCONTOS_OBTIDOS: "Descontos Obtidos",
  VARIACAO_CAMBIAL: "Variação Cambial",
  HEDGE: "Hedge",
  DIVIDENDOS: "Dividendos",
  OUTRAS_RECEITAS: "Outras Receitas"
};

const categoryColors: Record<string, string> = {
  JUROS_APLICACOES: "bg-green-100 text-green-800",
  RENDIMENTOS_FUNDOS: "bg-blue-100 text-blue-800",
  DESCONTOS_OBTIDOS: "bg-purple-100 text-purple-800",
  VARIACAO_CAMBIAL: "bg-yellow-100 text-yellow-800",
  HEDGE: "bg-orange-100 text-orange-800",
  DIVIDENDOS: "bg-indigo-100 text-indigo-800",
  OUTRAS_RECEITAS: "bg-gray-100 text-gray-800"
};

interface ReceitasFinanceirasListingProps {
  organizationId: string;
  receitas: ReceitaFinanceira[];
  safras: Array<{ id: string; nome: string }>;
  selectedSafraId?: string;
  onUpdate?: () => void;
}

export function ReceitasFinanceirasListing({
  organizationId,
  receitas,
  safras,
  selectedSafraId,
  onUpdate,
}: ReceitasFinanceirasListingProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  // Use refresh instead of onUpdate if not provided
  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate();
    } else {
      router.refresh();
    }
  };

  // Calcular totais por categoria
  const totaisPorCategoria = receitas.reduce((acc, receita) => {
    // Nova estrutura: usar campo valor direto
    const valor = selectedSafraId && receita.safra_id !== selectedSafraId
      ? 0 
      : (receita.valor || 0);
    
    if (!acc[receita.categoria]) {
      acc[receita.categoria] = 0;
    }
    acc[receita.categoria] += valor;
    return acc;
  }, {} as Record<string, number>);

  // Calcular total geral
  const totalGeral = Object.values(totaisPorCategoria).reduce((sum, val) => sum + val, 0);

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
    ? safras.find(s => s.id === selectedSafraId)?.nome
    : "Todas as Safras";

  return (
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
          <NewReceitasFinanceirasButton
            organizationId={organizationId}
            safras={safras}
            onSuccess={handleUpdate}
          />
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
                  {Object.entries(receitasPorCategoria).map(([categoria, receitasCategoria]) => (
                    <>
                      {/* Linha de categoria */}
                      <TableRow key={`cat-${categoria}`} className="bg-muted/30">
                        <TableCell colSpan={3} className="font-medium">
                          <Badge 
                            variant="secondary" 
                            className={categoryColors[categoria] || categoryColors.OUTRAS_RECEITAS}
                          >
                            {categoryLabels[categoria] || categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(totaisPorCategoria[categoria] || 0)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      
                      {/* Linhas de receitas da categoria */}
                      {receitasCategoria.map((receita) => {
                        // Nova estrutura: usar campo valor direto
                        const valor = selectedSafraId && receita.safra_id !== selectedSafraId
                          ? 0 
                          : (receita.valor || 0);
                        
                        return (
                          <TableRow key={receita.id}>
                            <TableCell className="pl-8">{receita.descricao}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {categoryLabels[receita.categoria] || receita.categoria}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {receita.safra_id 
                                ? safras.find(s => s.id === receita.safra_id)?.nome || "-"
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(valor)}
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
                        );
                      })}
                    </>
                  ))}
                  
                  {/* Linha de total geral */}
                  <TableRow className="bg-muted font-medium">
                    <TableCell colSpan={3} className="text-right">
                      Total Geral
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalGeral)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}