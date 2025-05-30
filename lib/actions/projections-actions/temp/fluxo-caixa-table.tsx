"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingDown, TrendingUp, CircleDollarSign, DollarSign, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import type { FluxoCaixaData } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";

interface FluxoCaixaTableProps {
  data: FluxoCaixaData;
}

export function FluxoCaixaTable({ data }: FluxoCaixaTableProps) {
  if (!data || !data.anos || data.anos.length === 0) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<DollarSign className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise consolidada de receitas, despesas e fluxo de caixa"
        />
        <CardContent className="p-6">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar seção de receitas agrícolas
  const renderReceitasSection = () => (
    <AccordionItem value="receitas" className="border rounded-lg shadow-sm">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-semibold text-base">Receitas Agrícolas</h3>
            <p className="text-sm text-muted-foreground">
              Receitas projetadas por cultura agrícola
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground min-w-[200px] w-[200px] sticky left-0 bg-primary z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                    RECEITAS AGRÍCOLAS
                  </TableHead>
                  {data.anos.map((ano, index) => (
                    <TableHead 
                      key={ano} 
                      className={cn(
                        "font-semibold text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                        index === data.anos.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {ano}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Linhas de receitas por cultura */}
                {Object.keys(data.receitas_agricolas.culturas).map((cultura, index) => (
                  <TableRow key={`receita-${cultura}`} className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {cultura}
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.receitas_agricolas.culturas[cultura][ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                
                {/* Total de receitas */}
                <TableRow className="hover:bg-muted/30 bg-primary/5 font-medium">
                  <TableCell className="font-semibold min-w-[200px] w-[200px] sticky left-0 bg-primary/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Total Receitas Agrícolas
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center font-medium text-primary min-w-[120px] w-[120px] bg-primary/5"
                    >
                      {formatCurrency(data.receitas_agricolas.total_por_ano[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  // Renderizar seção de despesas agrícolas
  const renderDespesasSection = () => (
    <AccordionItem value="despesas" className="border rounded-lg shadow-sm">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <TrendingDown className="h-4 w-4 text-destructive" />
          <div>
            <h3 className="font-semibold text-base">Despesas Agrícolas</h3>
            <p className="text-sm text-muted-foreground">
              Custos de produção projetados por cultura
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-destructive hover:bg-destructive">
                  <TableHead className="font-semibold text-destructive-foreground min-w-[200px] w-[200px] sticky left-0 bg-destructive z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                    DESPESAS AGRÍCOLAS
                  </TableHead>
                  {data.anos.map((ano, index) => (
                    <TableHead 
                      key={ano} 
                      className={cn(
                        "font-semibold text-destructive-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                        index === data.anos.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {ano}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Linhas de despesas por cultura */}
                {Object.keys(data.despesas_agricolas.culturas).map((cultura, index) => (
                  <TableRow key={`despesa-${cultura}`} className="hover:bg-muted/30">
                    <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {cultura}
                    </TableCell>
                    {data.anos.map((ano) => (
                      <TableCell 
                        key={ano} 
                        className="text-center min-w-[120px] w-[120px]"
                      >
                        {formatCurrency(data.despesas_agricolas.culturas[cultura][ano] || 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                
                {/* Total de despesas */}
                <TableRow className="hover:bg-muted/30 bg-destructive/5 font-medium">
                  <TableCell className="font-semibold min-w-[200px] w-[200px] sticky left-0 bg-destructive/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Total Despesas Agrícolas
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center font-medium text-destructive min-w-[120px] w-[120px] bg-destructive/5"
                    >
                      {formatCurrency(data.despesas_agricolas.total_por_ano[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  // Renderizar seção de outras despesas
  const renderOutrasDespesasSection = () => (
    <AccordionItem value="outras" className="border rounded-lg shadow-sm">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <CircleDollarSign className="h-4 w-4 text-destructive" />
          <div>
            <h3 className="font-semibold text-base">Outras Despesas</h3>
            <p className="text-sm text-muted-foreground">
              Despesas financeiras, tributárias, arrendamento e administrativas
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-destructive hover:bg-destructive">
                  <TableHead className="font-semibold text-destructive-foreground min-w-[200px] w-[200px] sticky left-0 bg-destructive z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                    OUTRAS DESPESAS
                  </TableHead>
                  {data.anos.map((ano, index) => (
                    <TableHead 
                      key={ano} 
                      className={cn(
                        "font-semibold text-destructive-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                        index === data.anos.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {ano}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Linhas de outras despesas por categoria */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Financeiras
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.outras_despesas.financeiras[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Tributárias
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.outras_despesas.tributarias[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Arrendamento
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.outras_despesas.arrendamento[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Pró-Labore
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.outras_despesas.pro_labore[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Divisão de Lucros
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.outras_despesas.divisao_lucros[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Outras
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.outras_despesas.outras[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Total de outras despesas */}
                <TableRow className="hover:bg-muted/30 bg-destructive/5 font-medium">
                  <TableCell className="font-semibold min-w-[200px] w-[200px] sticky left-0 bg-destructive/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Total Outras Despesas
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center font-medium text-destructive min-w-[120px] w-[120px] bg-destructive/5"
                    >
                      {formatCurrency(data.outras_despesas.total_por_ano[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Fluxo de Caixa da Atividade - movido para depois do Total Outras Despesas */}
                <TableRow className="hover:bg-muted/30 bg-primary/5 font-medium mt-2 border-t">
                  <TableCell className="font-semibold min-w-[200px] w-[200px] sticky left-0 bg-primary/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Fluxo de Caixa da Atividade
                  </TableCell>
                  {data.anos.map((ano) => {
                    const valor = data.fluxo_atividade[ano] || 0;
                    return (
                      <TableCell 
                        key={ano} 
                        className={cn(
                          "text-center font-medium min-w-[120px] w-[120px] bg-primary/5",
                          valor >= 0 ? "text-primary" : "text-destructive"
                        )}
                      >
                        {formatCurrency(valor)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  // Renderizar seção de financeiras
  const renderFinanceirasSection = () => (
    <AccordionItem value="financeiras" className="border rounded-lg shadow-sm">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <div>
            <h3 className="font-semibold text-base">Financeiras</h3>
            <p className="text-sm text-muted-foreground">
              Serviço da dívida, pagamentos e novas linhas de crédito
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-600 hover:bg-blue-600">
                  <TableHead className="font-semibold text-white min-w-[200px] w-[200px] sticky left-0 bg-blue-600 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                    FINANCEIRAS
                  </TableHead>
                  {data.anos.map((ano, index) => (
                    <TableHead 
                      key={ano} 
                      className={cn(
                        "font-semibold text-white text-center min-w-[120px] w-[120px] whitespace-nowrap",
                        index === data.anos.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {ano}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Serviço da dívida */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Serviço da dívida
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center text-destructive min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(-(data.financeiras.servico_divida[ano] || 0))}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Pagamentos - Bancos/Adto. Clientes */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Pagamentos - Bancos/Adto. Clientes
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center text-destructive min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(-(data.financeiras.pagamentos_bancos[ano] || 0))}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Novas Linhas Crédito-Bancos/Adto. Clientes */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Novas Linhas Crédito-Bancos/Adto. Clientes
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center text-primary min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.financeiras.novas_linhas_credito[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Total financeiras */}
                <TableRow className="hover:bg-muted/30 bg-blue-50 font-medium">
                  <TableCell className="font-semibold min-w-[200px] w-[200px] sticky left-0 bg-blue-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Total Financeiras
                  </TableCell>
                  {data.anos.map((ano) => {
                    const valor = data.financeiras.total_por_ano[ano] || 0;
                    return (
                      <TableCell 
                        key={ano} 
                        className={cn(
                          "text-center font-medium min-w-[120px] w-[120px] bg-blue-50",
                          valor >= 0 ? "text-primary" : "text-destructive"
                        )}
                      >
                        {formatCurrency(valor)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  // Renderizar seção de investimentos
  const renderInvestimentosSection = () => (
    <AccordionItem value="investimentos" className="border rounded-lg shadow-sm">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <TrendingDown className="h-4 w-4 text-destructive" />
          <div>
            <h3 className="font-semibold text-base">Investimentos</h3>
            <p className="text-sm text-muted-foreground">
              Investimentos projetados por categoria
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-destructive hover:bg-destructive">
                  <TableHead className="font-semibold text-destructive-foreground min-w-[200px] w-[200px] sticky left-0 bg-destructive z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                    INVESTIMENTOS
                  </TableHead>
                  {data.anos.map((ano, index) => (
                    <TableHead 
                      key={ano} 
                      className={cn(
                        "font-semibold text-destructive-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                        index === data.anos.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {ano}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Total investimentos */}
                <TableRow className="hover:bg-muted/30 bg-destructive/5 font-medium">
                  <TableCell className="font-semibold min-w-[200px] w-[200px] sticky left-0 bg-destructive/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Investimentos
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center font-medium text-destructive min-w-[120px] w-[120px] bg-destructive/5"
                    >
                      {formatCurrency(data.investimentos.total[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Terras */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Terras
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.investimentos.terras[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Maquinários */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Maquinários
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.investimentos.maquinarios[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Outros */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Outros
                  </TableCell>
                  {data.anos.map((ano) => (
                    <TableCell 
                      key={ano} 
                      className="text-center min-w-[120px] w-[120px]"
                    >
                      {formatCurrency(data.investimentos.outros[ano] || 0)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  // Renderizar seção de fluxo de caixa
  const renderFluxoSection = () => (
    <AccordionItem value="fluxo" className="border rounded-lg shadow-sm">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <DollarSign className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-semibold text-base">Fluxo de Caixa</h3>
            <p className="text-sm text-muted-foreground">
              Fluxo líquido e análise acumulada
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground min-w-[200px] w-[200px] sticky left-0 bg-primary z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                    FLUXO DE CAIXA
                  </TableHead>
                  {data.anos.map((ano, index) => (
                    <TableHead 
                      key={ano} 
                      className={cn(
                        "font-semibold text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                        index === data.anos.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {ano}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Fluxo Líquido */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Fluxo Líquido
                  </TableCell>
                  {data.anos.map((ano) => {
                    const valor = data.fluxo_liquido[ano] || 0;
                    return (
                      <TableCell 
                        key={ano} 
                        className={cn(
                          "text-center min-w-[120px] w-[120px]",
                          valor >= 0 ? "text-primary" : "text-destructive"
                        )}
                      >
                        {formatCurrency(valor)}
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* Fluxo Acumulado */}
                <TableRow className="hover:bg-muted/30 bg-primary/5">
                  <TableCell className="font-semibold min-w-[200px] w-[200px] sticky left-0 bg-primary/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Fluxo Acumulado
                  </TableCell>
                  {data.anos.map((ano) => {
                    const valor = data.fluxo_acumulado[ano] || 0;
                    return (
                      <TableCell 
                        key={ano} 
                        className={cn(
                          "text-center font-medium min-w-[120px] w-[120px] bg-primary/5",
                          valor >= 0 ? "text-primary" : "text-destructive"
                        )}
                      >
                        {formatCurrency(valor)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<DollarSign className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise consolidada de receitas, despesas e fluxo de caixa"
        />
        <CardContent className="p-6">
          <Accordion type="multiple" defaultValue={["receitas", "despesas", "outras", "financeiras", "investimentos", "fluxo"]} className="space-y-4">
            {renderReceitasSection()}
            {renderDespesasSection()}
            {renderOutrasDespesasSection()}
            {renderFinanceirasSection()}
            {renderInvestimentosSection()}
            {renderFluxoSection()}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}