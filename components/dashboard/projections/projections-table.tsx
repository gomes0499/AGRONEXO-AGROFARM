"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2, 
  Save, 
  X,
  TrendingUp,
  TrendingDown,
  Calculator
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface ProjectionsTableProps {
  organizationId: string;
  safras: any[];
  cultures: any[];
  properties: any[];
  projectionId?: string;
}

interface ProjectionRow {
  id: string;
  cultura: string;
  culturaId: string;
  safra: string;
  safraId: string;
  area: number;
  produtividade: number;
  preco: number;
  custoHa: number;
  receita: number;
  custoTotal: number;
  ebitda: number;
  ebitdaMargin: number;
  breakEven: number;
}

export function ProjectionsTable({
  organizationId,
  safras,
  cultures,
  properties,
  projectionId,
}: ProjectionsTableProps) {
  const [projections, setProjections] = useState<ProjectionRow[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<ProjectionRow>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjections();
  }, [organizationId, safras, cultures]);

  const loadProjections = async () => {
    // TODO: Implementar chamada para API
    // Por enquanto, vamos criar dados mockados baseados na estrutura da planilha
    const mockData: ProjectionRow[] = [];
    
    cultures.forEach(cultura => {
      safras.forEach(safra => {
        const area = cultura.nome === "SOJA" ? 12000 : 
                    cultura.nome === "MILHO" ? 1500 : 
                    cultura.nome === "FEIJÃO" ? 700 : 1000;
        const produtividade = cultura.nome === "SOJA" ? 70 : 
                             cultura.nome === "MILHO" ? 180 : 
                             cultura.nome === "FEIJÃO" ? 25 : 75;
        const preco = cultura.nome === "SOJA" ? 122 : 
                     cultura.nome === "MILHO" ? 60 : 
                     cultura.nome === "FEIJÃO" ? 250 : 50;
        const custoHa = cultura.nome === "SOJA" ? 5200 : 
                       cultura.nome === "MILHO" ? 7500 : 
                       cultura.nome === "FEIJÃO" ? 1300 : 2800;
        
        const receita = area * produtividade * preco;
        const custoTotal = area * custoHa;
        const ebitda = receita - custoTotal;
        const ebitdaMargin = (ebitda / receita) * 100;
        const breakEven = custoHa / preco;
        
        mockData.push({
          id: `${cultura.id}-${safra.id}`,
          cultura: cultura.nome,
          culturaId: cultura.id,
          safra: safra.nome,
          safraId: safra.id,
          area,
          produtividade,
          preco,
          custoHa,
          receita,
          custoTotal,
          ebitda,
          ebitdaMargin,
          breakEven,
        });
      });
    });
    
    setProjections(mockData);
    setIsLoading(false);
  };

  const handleEdit = (row: ProjectionRow) => {
    setEditingRow(row.id);
    setEditedValues({
      area: row.area,
      produtividade: row.produtividade,
      preco: row.preco,
      custoHa: row.custoHa,
    });
  };

  const handleSave = () => {
    if (!editingRow || !editedValues) return;
    
    // Recalcular valores derivados
    const area = editedValues.area || 0;
    const produtividade = editedValues.produtividade || 0;
    const preco = editedValues.preco || 0;
    const custoHa = editedValues.custoHa || 0;
    
    const receita = area * produtividade * preco;
    const custoTotal = area * custoHa;
    const ebitda = receita - custoTotal;
    const ebitdaMargin = receita > 0 ? (ebitda / receita) * 100 : 0;
    const breakEven = preco > 0 ? custoHa / preco : 0;
    
    setProjections(prev => prev.map(row => {
      if (row.id === editingRow) {
        return {
          ...row,
          ...editedValues,
          receita,
          custoTotal,
          ebitda,
          ebitdaMargin,
          breakEven,
        };
      }
      return row;
    }));
    
    setEditingRow(null);
    setEditedValues({});
    
    // TODO: Salvar no banco de dados
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditedValues({});
  };

  const handleInputChange = (field: keyof ProjectionRow, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedValues(prev => ({ ...prev, [field]: numValue }));
  };

  // Agrupar por cultura
  const groupedProjections = cultures.map(cultura => ({
    cultura,
    projections: projections.filter(p => p.culturaId === cultura.id),
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando projeções...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Projeções por Cultura</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              <Calculator className="h-3 w-3 mr-1" />
              Valores calculados automaticamente
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {groupedProjections.map(({ cultura, projections: culturaProjections }) => (
            <div key={cultura.id} className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {cultura.nome}
                <Badge variant="secondary">{culturaProjections.length} safras</Badge>
              </h3>
              
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Safra</TableHead>
                      <TableHead className="text-right">Área (ha)</TableHead>
                      <TableHead className="text-right">Produtividade</TableHead>
                      <TableHead className="text-right">Preço (R$)</TableHead>
                      <TableHead className="text-right">Custo/ha (R$)</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                      <TableHead className="text-right">EBITDA</TableHead>
                      <TableHead className="text-right">Margem %</TableHead>
                      <TableHead className="text-right">Break Even</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {culturaProjections.map((row) => {
                      const isEditing = editingRow === row.id;
                      
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.safra}</TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editedValues.area}
                                onChange={(e) => handleInputChange('area', e.target.value)}
                                className="w-24 text-right"
                              />
                            ) : (
                              formatNumber(row.area)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editedValues.produtividade}
                                onChange={(e) => handleInputChange('produtividade', e.target.value)}
                                className="w-20 text-right"
                              />
                            ) : (
                              formatNumber(row.produtividade)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editedValues.preco}
                                onChange={(e) => handleInputChange('preco', e.target.value)}
                                className="w-20 text-right"
                              />
                            ) : (
                              formatCurrency(row.preco, 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editedValues.custoHa}
                                onChange={(e) => handleInputChange('custoHa', e.target.value)}
                                className="w-24 text-right"
                              />
                            ) : (
                              formatCurrency(row.custoHa, 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(row.receita, 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.custoTotal, 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-medium",
                              row.ebitda > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCurrency(row.ebitda, 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {row.ebitdaMargin > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={cn(
                                row.ebitdaMargin > 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {formatPercent(row.ebitdaMargin)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(row.breakEven, 2)} sc
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleSave}
                                  className="h-8 w-8"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleCancel}
                                  className="h-8 w-8"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(row)}
                                className="h-8 w-8"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Linha de totalização por cultura */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>Total {cultura.nome}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(
                          culturaProjections.reduce((sum, r) => sum + r.area, 0)
                        )}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          culturaProjections.reduce((sum, r) => sum + r.receita, 0),
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          culturaProjections.reduce((sum, r) => sum + r.custoTotal, 0),
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          culturaProjections.reduce((sum, r) => sum + r.ebitda, 0),
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(
                          (culturaProjections.reduce((sum, r) => sum + r.ebitda, 0) /
                           culturaProjections.reduce((sum, r) => sum + r.receita, 0)) * 100
                        )}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}