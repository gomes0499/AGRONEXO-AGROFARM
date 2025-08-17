"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

interface CashFlowProjectionProps {
  organizationId: string;
  safras: any[];
  cultures: any[];
  projectionId?: string;
}

interface CashFlowData {
  safra: string;
  receitasAgricolas: number;
  despesasAgricolas: number;
  outrasReceitas: number;
  outrasDespesas: number;
  arrendamento: number;
  proLabore: number;
  fluxoCaixaOperacional: number;
  investimentos: number;
  financeiras: number;
  servicoDivida: number;
  pagamentosBancos: number;
  novasLinhas: number;
  fluxoCaixaLivre: number;
  fluxoCaixaAcumulado: number;
}

export function CashFlowProjection({
  organizationId,
  safras,
  cultures,
  projectionId,
}: CashFlowProjectionProps) {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateCashFlowData();
  }, [safras, cultures]);

  const generateCashFlowData = () => {
    // TODO: Buscar dados reais da API
    // Por enquanto, vamos gerar dados mockados baseados na estrutura da planilha
    let acumulado = 4550000; // Saldo inicial
    
    const data = safras.map((safra, index) => {
      const receitasAgricolas = 111648710 + (index * 10000000);
      const despesasAgricolas = 82189480 + (index * 5000000);
      const outrasReceitas = 0;
      const arrendamento = 9484715 + (index * 500000);
      const proLabore = 3000000;
      const outrasDespesas = arrendamento + proLabore;
      
      const fluxoCaixaOperacional = receitasAgricolas - despesasAgricolas - outrasDespesas;
      
      const investimentos = index < 2 ? 22157214 : 10000000;
      const servicoDivida = 8296694 + (index * 1000000);
      const pagamentosBancos = 14349092;
      const novasLinhas = index < 2 ? 34953524 : 16129987;
      const financeiras = servicoDivida + pagamentosBancos - novasLinhas;
      
      const fluxoCaixaLivre = fluxoCaixaOperacional - investimentos + financeiras;
      acumulado += fluxoCaixaLivre;
      
      return {
        safra: safra.nome,
        receitasAgricolas,
        despesasAgricolas,
        outrasReceitas,
        outrasDespesas,
        arrendamento,
        proLabore,
        fluxoCaixaOperacional,
        investimentos,
        financeiras,
        servicoDivida,
        pagamentosBancos,
        novasLinhas,
        fluxoCaixaLivre,
        fluxoCaixaAcumulado: acumulado,
      };
    });
    
    setCashFlowData(data);
    setIsLoading(false);
  };

  const chartData = cashFlowData.map(item => ({
    safra: item.safra,
    "Fluxo Operacional": item.fluxoCaixaOperacional,
    "Fluxo Livre": item.fluxoCaixaLivre,
    "Fluxo Acumulado": item.fluxoCaixaAcumulado,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando fluxo de caixa...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico do Fluxo de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Fluxo de Caixa</CardTitle>
          <CardDescription>
            Projeção do fluxo de caixa operacional, livre e acumulado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="safra" />
              <YAxis tickFormatter={(value) => formatCurrency(value / 1000000, 0) + "M"} />
              <Tooltip formatter={(value: number) => formatCurrency(value, 0)} />
              <Legend />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="Fluxo Operacional"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Fluxo Livre"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Fluxo Acumulado"
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa Projetado Detalhado</CardTitle>
          <CardDescription>
            Detalhamento completo do fluxo de caixa por safra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Item</TableHead>
                  {safras.map(safra => (
                    <TableHead key={safra.id} className="text-right min-w-[120px]">
                      {safra.nome}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Receitas */}
                <TableRow className="bg-muted/30">
                  <TableCell className="sticky left-0 bg-muted/30 font-semibold">
                    RECEITAS OPERACIONAIS
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right"></TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background pl-6">
                    Receitas Agrícolas
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right">
                      {formatCurrency(data.receitasAgricolas, 0)}
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Despesas */}
                <TableRow className="bg-muted/30">
                  <TableCell className="sticky left-0 bg-muted/30 font-semibold">
                    DESPESAS OPERACIONAIS
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right"></TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background pl-6">
                    Despesas Agrícolas
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right text-red-600">
                      ({formatCurrency(data.despesasAgricolas, 0)})
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background pl-6">
                    Arrendamento
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right text-red-600">
                      ({formatCurrency(data.arrendamento, 0)})
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background pl-6">
                    Pró-Labore
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right text-red-600">
                      ({formatCurrency(data.proLabore, 0)})
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Fluxo Operacional */}
                <TableRow className="bg-blue-50 dark:bg-blue-950/30 font-semibold">
                  <TableCell className="sticky left-0 bg-blue-50 dark:bg-blue-950/30">
                    FLUXO DE CAIXA OPERACIONAL
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right">
                      <span className={cn(
                        data.fluxoCaixaOperacional > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(data.fluxoCaixaOperacional, 0)}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Investimentos */}
                <TableRow className="bg-muted/30">
                  <TableCell className="sticky left-0 bg-muted/30 font-semibold">
                    INVESTIMENTOS
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right"></TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background pl-6">
                    CAPEX
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right text-red-600">
                      ({formatCurrency(data.investimentos, 0)})
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Financeiras */}
                <TableRow className="bg-muted/30">
                  <TableCell className="sticky left-0 bg-muted/30 font-semibold">
                    ATIVIDADES FINANCEIRAS
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right"></TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background pl-6">
                    Serviço da Dívida
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right text-red-600">
                      ({formatCurrency(data.servicoDivida, 0)})
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background pl-6">
                    Pagamentos Bancos
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right text-red-600">
                      ({formatCurrency(data.pagamentosBancos, 0)})
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background pl-6">
                    Novas Linhas/Refinanciamento
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right text-green-600">
                      {formatCurrency(data.novasLinhas, 0)}
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Fluxo Livre */}
                <TableRow className="bg-green-50 dark:bg-green-950/30 font-semibold">
                  <TableCell className="sticky left-0 bg-green-50 dark:bg-green-950/30">
                    FLUXO DE CAIXA LIVRE
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {data.fluxoCaixaLivre > 0 ? (
                          <ArrowUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={cn(
                          data.fluxoCaixaLivre > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(data.fluxoCaixaLivre, 0)}
                        </span>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Fluxo Acumulado */}
                <TableRow className="bg-purple-50 dark:bg-purple-950/30 font-bold">
                  <TableCell className="sticky left-0 bg-purple-50 dark:bg-purple-950/30">
                    FLUXO DE CAIXA ACUMULADO
                  </TableCell>
                  {cashFlowData.map((data, idx) => (
                    <TableCell key={idx} className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-purple-600">
                          {formatCurrency(data.fluxoCaixaAcumulado, 0)}
                        </span>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}