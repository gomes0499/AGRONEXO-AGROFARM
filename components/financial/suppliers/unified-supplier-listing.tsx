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
import { Loader2, Pencil, Save, Building, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatters";

// Tipos baseados no novo schema (CSV)
type SupplierType = {
  id: string;
  organizacao_id: string;
  safra_id: string;
  nome: string;
  categoria: string;
  cnpj_cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  valores_por_ano: Record<string, number>;
  moeda: "BRL" | "USD";
  status: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
};

type UnifiedSupplierListingProps = {
  suppliers: SupplierType[] | undefined;
  safras: Array<{ id: string; nome: string; ano_inicio: number }>;
};

export function UnifiedSupplierListing({ 
  suppliers = [],
  safras = []
}: UnifiedSupplierListingProps) {
  
  // Se não há fornecedores, mostrar estado vazio
  if (!suppliers || suppliers.length === 0) {
    return (
      <Card className="w-full shadow-sm border-muted/80">
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Building className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Fornecedores</CardTitle>
              <CardDescription className="text-white/80">
                Gerencie fornecedores e valores por safra
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="mt-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <p className="text-amber-700 mb-4">
              Não encontramos fornecedores configurados. Se você acabou de criar as tabelas, tente recarregar a página para inicializar os valores padrão.
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
  const initEditState = (supplier: SupplierType) => {
    if (!editingState[supplier.id]) {
      const editValues: Record<string, string> = {};
      
      yearsToShow.forEach(year => {
        const safra = safras.find(s => s.ano_inicio === year);
        if (safra && supplier.valores_por_ano[safra.id]) {
          editValues[`value${year}`] = supplier.valores_por_ano[safra.id].toString();
        } else {
          editValues[`value${year}`] = "0";
        }
      });

      setEditingState(prev => ({
        ...prev,
        [supplier.id]: editValues,
      }));
    }

    if (isLoading[supplier.id] === undefined) {
      setIsLoading(prev => ({
        ...prev,
        [supplier.id]: false,
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
  const handleSave = async (supplier: SupplierType) => {
    try {
      setIsLoading(prev => ({
        ...prev,
        [supplier.id]: true,
      }));

      const editValues = editingState[supplier.id];
      if (!editValues) return;

      // Preparar novos valores por ano
      const newValoresPorAno: Record<string, number> = {};
      
      yearsToShow.forEach(year => {
        const safra = safras.find(s => s.ano_inicio === year);
        if (safra) {
          const value = parseFloat(editValues[`value${year}`] || "0");
          if (!isNaN(value) && value > 0) {
            newValoresPorAno[safra.id] = value;
          }
        }
      });

      // Atualizar localmente (aqui seria a chamada para API)
      supplier.valores_por_ano = newValoresPorAno;

      toast.success("Fornecedor atualizado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [supplier.id]: false,
      }));
    }
  };

  // Obter valor para um ano específico
  const getValueForYear = (supplier: SupplierType, year: number): number => {
    const safra = safras.find(s => s.ano_inicio === year);
    if (safra && supplier.valores_por_ano[safra.id]) {
      return supplier.valores_por_ano[safra.id];
    }
    return 0;
  };

  // Obter badge da categoria
  const getCategoryBadge = (categoria: string) => {
    const categoryLabels: Record<string, string> = {
      "INSUMOS_GERAIS": "Insumos Gerais",
      "FERTILIZANTES": "Fertilizantes",
      "DEFENSIVOS": "Defensivos",
      "SEMENTES": "Sementes",
      "COMBUSTIVEIS": "Combustíveis",
      "SERVICOS": "Serviços",
      "MAQUINAS": "Máquinas",
      "OUTROS": "Outros",
    };

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {categoryLabels[categoria] || categoria}
      </Badge>
    );
  };

  // Obter badge do status
  const getStatusBadge = (status: string) => {
    return status === "ATIVO" ? (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary">
        Inativo
      </Badge>
    );
  };

  const renderTable = () => {
    return (
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-semibold text-primary-foreground rounded-tl-md w-[200px] bg-primary">
              Fornecedor
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground w-[120px] bg-primary">
              Categoria
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground w-[80px] bg-primary">
              Status
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
          {suppliers.map((supplier) => {
            initEditState(supplier);

            return (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">
                  {supplier.nome}
                </TableCell>
                <TableCell>
                  {getCategoryBadge(supplier.categoria)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(supplier.status)}
                </TableCell>
                {yearsToShow.map(year => (
                  <TableCell key={year}>
                    {formatCurrencyCompact(getValueForYear(supplier, year))}
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
                            Editar Valores - {supplier.nome}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os valores por safra.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {yearsToShow.map((year) => (
                            <div key={year} className="space-y-2">
                              <Label htmlFor={`${supplier.id}-value${year}`}>
                                {year}/{String(year + 1).slice(-2)}
                              </Label>
                              <Input
                                id={`${supplier.id}-value${year}`}
                                type="number"
                                value={
                                  editingState[supplier.id]?.[`value${year}`] ||
                                  getValueForYear(supplier, year).toString()
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    supplier.id,
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
                          onClick={() => handleSave(supplier)}
                          disabled={isLoading[supplier.id]}
                          className="w-full"
                        >
                          {isLoading[supplier.id] ? (
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
            <Building className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Fornecedores</CardTitle>
            <CardDescription className="text-white/80">
              Gerencie fornecedores e valores por safra
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