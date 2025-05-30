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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Save, Receipt, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatters";

// Tipos baseados no novo schema (CSV)
type OtherExpenseType = {
  id: string;
  organizacao_id: string;
  categoria: string;
  descricao: string;
  valores_por_safra: Record<string, number>; // safra_id -> valor
  created_at: string;
  updated_at: string;
};

type UnifiedOtherExpensesListingProps = {
  otherExpenses: OtherExpenseType[] | undefined;
  safras: Array<{ id: string; nome: string; ano_inicio: number }>;
};

export function UnifiedOtherExpensesListing({ 
  otherExpenses = [],
  safras = []
}: UnifiedOtherExpensesListingProps) {
  
  // Se não há outras despesas, mostrar estado vazio
  if (!otherExpenses || otherExpenses.length === 0) {
    return (
      <Card className="w-full shadow-sm border-muted/80">
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Outras Despesas</CardTitle>
              <CardDescription className="text-white/80">
                Gerencie despesas operacionais, pró-labore e tributárias por safra
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="mt-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <p className="text-amber-700 mb-4">
              Não encontramos outras despesas configuradas. Se você acabou de criar as tabelas, tente recarregar a página para inicializar os valores padrão.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Recarregar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [editingState, setEditingState] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Anos que queremos mostrar (2021-2029, sem 2020 e 2030)
  const yearsToShow = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

  // Inicializar estado de edição
  const initEditState = (expense: OtherExpenseType) => {
    if (!editingState[expense.id]) {
      const editValues: Record<string, string> = {};
      
      yearsToShow.forEach(year => {
        const safra = safras.find(s => s.ano_inicio === year);
        if (safra && expense.valores_por_safra[safra.id]) {
          editValues[`value${year}`] = expense.valores_por_safra[safra.id].toString();
        } else {
          editValues[`value${year}`] = "0";
        }
      });

      setEditingState(prev => ({
        ...prev,
        [expense.id]: editValues,
      }));
    }

    if (isLoading[expense.id] === undefined) {
      setIsLoading(prev => ({
        ...prev,
        [expense.id]: false,
      }));
    }
  };

  // Manipular mudança de input
  const handleInputChange = (id: string, field: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  // Salvar mudanças
  const handleSave = async (expense: OtherExpenseType) => {
    try {
      setIsLoading(prev => ({
        ...prev,
        [expense.id]: true,
      }));

      const editValues = editingState[expense.id];
      if (!editValues) return;

      // Preparar novos valores por safra
      const newValoresPorSafra: Record<string, number> = {};
      
      yearsToShow.forEach(year => {
        const safra = safras.find(s => s.ano_inicio === year);
        if (safra) {
          const value = parseFloat(editValues[`value${year}`] || "0");
          if (!isNaN(value) && value > 0) {
            newValoresPorSafra[safra.id] = value;
          }
        }
      });

      // Atualizar localmente (aqui seria a chamada para API)
      expense.valores_por_safra = newValoresPorSafra;

      toast.success("Despesa atualizada com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [expense.id]: false,
      }));
    }
  };

  // Obter valor para um ano específico
  const getValueForYear = (expense: OtherExpenseType, year: number): number => {
    const safra = safras.find(s => s.ano_inicio === year);
    if (safra && expense.valores_por_safra[safra.id]) {
      return expense.valores_por_safra[safra.id];
    }
    return 0;
  };

  // Obter badge da categoria
  const getCategoryBadge = (categoria: string) => {
    const categoryLabels: Record<string, string> = {
      "PRO_LABORE": "Pró-labore",
      "OUTRAS_OPERACIONAIS": "Operacionais",
      "TRIBUTARIAS": "Tributárias",
      "ADMINISTRATIVAS": "Administrativas",
      "FINANCEIRAS": "Financeiras",
      "OUTRAS": "Outras",
    };

    const categoryColors: Record<string, string> = {
      "PRO_LABORE": "bg-blue-500 hover:bg-blue-600",
      "OUTRAS_OPERACIONAIS": "bg-orange-500 hover:bg-orange-600",
      "TRIBUTARIAS": "bg-red-500 hover:bg-red-600",
      "ADMINISTRATIVAS": "bg-purple-500 hover:bg-purple-600",
      "FINANCEIRAS": "bg-green-500 hover:bg-green-600",
      "OUTRAS": "bg-gray-500 hover:bg-gray-600",
    };

    return (
      <Badge variant="default" className={categoryColors[categoria] || "bg-gray-500 hover:bg-gray-600"}>
        {categoryLabels[categoria] || categoria}
      </Badge>
    );
  };

  const renderTable = () => {
    return (
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-semibold text-primary-foreground rounded-tl-md w-[250px] bg-primary">
              Descrição
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground w-[120px] bg-primary">
              Categoria
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2021/22
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2022/23
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2023/24
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2024/25
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2025/26
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2026/27
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2027/28
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2028/29
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2029/30
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[60px] bg-primary">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {otherExpenses.map((expense) => {
            initEditState(expense);

            return (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.descricao}
                </TableCell>
                <TableCell>
                  {getCategoryBadge(expense.categoria)}
                </TableCell>
                {yearsToShow.map(year => (
                  <TableCell key={year}>
                    {formatCurrencyCompact(getValueForYear(expense, year))}
                  </TableCell>
                ))}
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-4">
                      <div className="grid gap-4 w-[800px] max-h-[500px] overflow-y-auto">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Editar Valores - {expense.descricao}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os valores por safra.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {yearsToShow.map((year) => (
                            <div key={year} className="space-y-2">
                              <Label htmlFor={`${expense.id}-value${year}`}>
                                {year}/{String(year + 1).slice(-2)}
                              </Label>
                              <Input
                                id={`${expense.id}-value${year}`}
                                type="number"
                                value={
                                  editingState[expense.id]?.[`value${year}`] ||
                                  getValueForYear(expense, year).toString()
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    expense.id,
                                    `value${year}`,
                                    e.target.value
                                  )
                                }
                                step="0.01"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleSave(expense)}
                          disabled={isLoading[expense.id]}
                          className="w-full"
                        >
                          {isLoading[expense.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar Alterações
                            </>
                          )}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="w-full shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Receipt className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Outras Despesas</CardTitle>
            <CardDescription className="text-white/80">
              Gerencie despesas operacionais, pró-labore e tributárias por safra
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="mt-4">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <div className="min-w-[1200px]">
              {renderTable()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}