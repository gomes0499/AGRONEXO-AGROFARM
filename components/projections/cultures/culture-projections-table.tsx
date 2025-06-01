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
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CultureProjectionData } from "@/lib/actions/culture-projections-actions";

interface CultureProjectionsTableProps {
  projections: CultureProjectionData[];
  sementes: CultureProjectionData[];
  consolidado: CultureProjectionData;
  anos: string[];
}

export function CultureProjectionsTable({ projections, sementes, consolidado, anos }: CultureProjectionsTableProps) {
  // Filtrar anos para remover 2030/31 e 2031/32
  const anosFiltrados = anos.filter(ano => ano !== "2030/31" && ano !== "2031/32");

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Renderizar componente para cada seção de projeção usando accordion
  const renderProjectionAccordion = (projection: CultureProjectionData, key: string | number) => (
    <AccordionItem key={key} value={`projection-${key}`} className="border rounded-lg shadow-sm dark:border-gray-700">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <BarChart3 className="h-4 w-4 text-primary dark:text-white" />
          <div>
            <h3 className="font-semibold text-base">{projection.combination_title}</h3>
            <p className="text-sm text-muted-foreground">
              {projection.tipo === 'cultura' && `${projection.cultura_nome} - ${projection.sistema_nome}`}
              {projection.tipo === 'sementes' && `Vendas de ${projection.cultura_nome}`}
              {projection.tipo === 'consolidado' && `Consolidação geral de todas as culturas`}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md" style={{ maxWidth: '100%' }}>
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary dark:bg-primary/90 dark:hover:bg-primary/90">
                  <TableHead className="font-medium text-primary-foreground min-w-[200px] w-[200px] sticky left-0 bg-primary dark:bg-primary/90 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                    {projection.section_title}
                  </TableHead>
                  <TableHead className="font-medium text-primary-foreground text-center min-w-[100px] w-[100px] whitespace-nowrap">
                    Unidade
                  </TableHead>
                  {anosFiltrados.map((ano, anoIndex) => (
                    <TableHead 
                      key={ano} 
                      className={cn(
                        "font-medium text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                        anoIndex === anosFiltrados.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {ano}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableRows(projection)}
              </TableBody>
            </Table>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  // Função para renderizar linhas da tabela baseada no tipo
  const renderTableRows = (projection: CultureProjectionData) => {
    if (projection.tipo === 'sementes') {
      // Para vendas de sementes, mostrar apenas receita, custo total e EBITDA
      return (
        <>
          {/* Receita */}
          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-primary/5 dark:bg-primary/10">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 dark:bg-primary/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Receita
            </TableCell>
            <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5 dark:bg-primary/10">
              R$
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className="text-center font-medium text-primary dark:text-white min-w-[120px] w-[120px] bg-primary/5 dark:bg-primary/10"
              >
                {projection.projections_by_year[ano] 
                  ? formatNumber(projection.projections_by_year[ano].receita, 0)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>

          {/* Custo Total */}
          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Custo Total
            </TableCell>
            <TableCell className="text-center min-w-[100px] w-[100px]">
              R$
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className="text-center min-w-[120px] w-[120px]"
              >
                {projection.projections_by_year[ano] 
                  ? formatNumber(projection.projections_by_year[ano].custo_total, 0)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>

          {/* EBITDA */}
          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-primary/5 dark:bg-primary/10">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 dark:bg-primary/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              EBITDA
            </TableCell>
            <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5 dark:bg-primary/10">
              R$
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className={cn(
                  "text-center font-medium min-w-[120px] w-[120px] bg-primary/5 dark:bg-primary/10",
                  projection.projections_by_year[ano]?.ebitda >= 0 
                    ? "text-primary dark:text-white" 
                    : "text-destructive dark:text-red-400"
                )}
              >
                {projection.projections_by_year[ano] 
                  ? formatNumber(projection.projections_by_year[ano].ebitda, 0)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>

          {/* EBITDA % */}
          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-primary/5 dark:bg-primary/10">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 dark:bg-primary/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              EBITDA
            </TableCell>
            <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5 dark:bg-primary/10">
              %
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className={cn(
                  "text-center font-medium min-w-[120px] w-[120px] bg-primary/5 dark:bg-primary/10",
                  projection.projections_by_year[ano]?.ebitda_percent >= 0 
                    ? "text-primary dark:text-white" 
                    : "text-destructive dark:text-red-400"
                )}
              >
                {projection.projections_by_year[ano] 
                  ? formatPercent(projection.projections_by_year[ano].ebitda_percent)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>
        </>
      );
    }

    if (projection.tipo === 'consolidado') {
      // Para consolidado, mostrar área total, receita total, custo total e EBITDA
      return (
        <>
          {/* Área Total */}
          <TableRow className="hover:bg-muted/30">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Área Total
            </TableCell>
            <TableCell className="text-center font-mono min-w-[100px] w-[100px]">
              hectares
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className="text-center font-mono min-w-[120px] w-[120px]"
              >
                {projection.projections_by_year[ano] 
                  ? formatNumber(projection.projections_by_year[ano].area_plantada || 0, 0)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>

          {/* (+) Receita Total */}
          <TableRow className="hover:bg-muted/30 bg-primary/5">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              (+) Receita Total
            </TableCell>
            <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5">
              R$
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className="text-center font-medium text-primary dark:text-white min-w-[120px] w-[120px] bg-primary/5 dark:bg-primary/10"
              >
                {projection.projections_by_year[ano] 
                  ? formatNumber(projection.projections_by_year[ano].receita, 0)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>

          {/* (-) Custo Total */}
          <TableRow className="hover:bg-muted/30 bg-destructive/5">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-destructive/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              (-) Custo Total
            </TableCell>
            <TableCell className="text-center min-w-[100px] w-[100px] bg-destructive/5">
              R$
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className="text-center font-medium text-destructive min-w-[120px] w-[120px] bg-destructive/5"
              >
                {projection.projections_by_year[ano] 
                  ? formatNumber(projection.projections_by_year[ano].custo_total, 0)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>

          {/* EBITDA */}
          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-primary/5 dark:bg-primary/10">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 dark:bg-primary/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              EBITDA
            </TableCell>
            <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5 dark:bg-primary/10">
              R$
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className={cn(
                  "text-center font-medium min-w-[120px] w-[120px] bg-primary/5 dark:bg-primary/10",
                  projection.projections_by_year[ano]?.ebitda >= 0 
                    ? "text-primary dark:text-white" 
                    : "text-destructive dark:text-red-400"
                )}
              >
                {projection.projections_by_year[ano] 
                  ? formatNumber(projection.projections_by_year[ano].ebitda, 0)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>

          {/* EBITDA % */}
          <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-primary/5 dark:bg-primary/10">
            <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 dark:bg-primary/10 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              EBITDA
            </TableCell>
            <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5 dark:bg-primary/10">
              %
            </TableCell>
            {anosFiltrados.map((ano) => (
              <TableCell 
                key={ano} 
                className={cn(
                  "text-center font-medium min-w-[120px] w-[120px] bg-primary/5 dark:bg-primary/10",
                  projection.projections_by_year[ano]?.ebitda_percent >= 0 
                    ? "text-primary dark:text-white" 
                    : "text-destructive dark:text-red-400"
                )}
              >
                {projection.projections_by_year[ano] 
                  ? formatPercent(projection.projections_by_year[ano].ebitda_percent)
                  : '-'
                }
              </TableCell>
            ))}
          </TableRow>
        </>
      );
    }

    // Para culturas normais, renderizar todas as linhas
    return (
      <>
        {/* Área plantada */}
        <TableRow className="hover:bg-muted/30">
          <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Área Plantada
          </TableCell>
          <TableCell className="text-center min-w-[100px] w-[100px]">
            hectares
          </TableCell>
          {anosFiltrados.map((ano) => (
            <TableCell 
              key={ano} 
              className="text-center min-w-[120px] w-[120px]"
            >
              {projection.projections_by_year[ano] 
                ? formatNumber(projection.projections_by_year[ano].area_plantada || 0, 0)
                : '-'
              }
            </TableCell>
          ))}
        </TableRow>

        {/* Produtividade */}
        <TableRow className="hover:bg-muted/30">
          <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Produtividade
          </TableCell>
          <TableCell className="text-center min-w-[100px] w-[100px]">
            {Object.values(projection.projections_by_year)[0]?.unidade || 'Sc/ha'}
          </TableCell>
          {anosFiltrados.map((ano) => (
            <TableCell 
              key={ano} 
              className="text-center min-w-[120px] w-[120px]"
            >
              {projection.projections_by_year[ano] 
                ? formatNumber(projection.projections_by_year[ano].produtividade || 0, 2)
                : '-'
              }
            </TableCell>
          ))}
        </TableRow>

        {/* Preço */}
        <TableRow className="hover:bg-muted/30">
          <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Preço
          </TableCell>
          <TableCell className="text-center min-w-[100px] w-[100px]">
            R$/Sc
          </TableCell>
          {anosFiltrados.map((ano) => (
            <TableCell 
              key={ano} 
              className="text-center min-w-[120px] w-[120px]"
            >
              {projection.projections_by_year[ano] 
                ? formatNumber(projection.projections_by_year[ano].preco || 0, 2)
                : '-'
              }
            </TableCell>
          ))}
        </TableRow>

        {/* Receita */}
        <TableRow className="hover:bg-muted/30 bg-primary/5">
          <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Receita
          </TableCell>
          <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5">
            R$
          </TableCell>
          {anosFiltrados.map((ano) => (
            <TableCell 
              key={ano} 
              className="text-center font-medium text-primary dark:text-white min-w-[120px] w-[120px] bg-primary/5 dark:bg-primary/10"
            >
              {projection.projections_by_year[ano] 
                ? formatNumber(projection.projections_by_year[ano].receita, 0)
                : '-'
              }
            </TableCell>
          ))}
        </TableRow>

        {/* Custo por hectare */}
        <TableRow className="hover:bg-muted/30">
          <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Custo
          </TableCell>
          <TableCell className="text-center min-w-[100px] w-[100px]">
            R$/ha
          </TableCell>
          {anosFiltrados.map((ano) => (
            <TableCell 
              key={ano} 
              className="text-center min-w-[120px] w-[120px]"
            >
              {projection.projections_by_year[ano] 
                ? formatNumber(projection.projections_by_year[ano].custo_ha || 0, 2)
                : '-'
              }
            </TableCell>
          ))}
        </TableRow>

        {/* Custo total */}
        <TableRow className="hover:bg-muted/30">
          <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Custo Total
          </TableCell>
          <TableCell className="text-center min-w-[100px] w-[100px]">
            R$
          </TableCell>
          {anosFiltrados.map((ano) => (
            <TableCell 
              key={ano} 
              className="text-center min-w-[120px] w-[120px]"
            >
              {projection.projections_by_year[ano] 
                ? formatNumber(projection.projections_by_year[ano].custo_total, 0)
                : '-'
              }
            </TableCell>
          ))}
        </TableRow>

        {/* EBITDA */}
        <TableRow className="hover:bg-muted/30 bg-primary/5">
          <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Ebitda
          </TableCell>
          <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5">
            R$
          </TableCell>
          {anosFiltrados.map((ano) => (
            <TableCell 
              key={ano} 
              className={cn(
                "text-center font-medium min-w-[120px] w-[120px] bg-primary/5",
                projection.projections_by_year[ano]?.ebitda >= 0 ? "text-primary dark:text-white" : "text-destructive dark:text-red-400"
              )}
            >
              {projection.projections_by_year[ano] 
                ? formatNumber(projection.projections_by_year[ano].ebitda, 0)
                : '-'
              }
            </TableCell>
          ))}
        </TableRow>

        {/* EBITDA % */}
        <TableRow className="hover:bg-muted/30 bg-primary/5">
          <TableCell className="font-medium min-w-[200px] w-[200px] sticky left-0 bg-primary/5 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            Ebitda
          </TableCell>
          <TableCell className="text-center min-w-[100px] w-[100px] bg-primary/5">
            %
          </TableCell>
          {anosFiltrados.map((ano) => (
            <TableCell 
              key={ano} 
              className={cn(
                "text-center font-medium min-w-[120px] w-[120px] bg-primary/5",
                projection.projections_by_year[ano]?.ebitda_percent >= 0 ? "text-primary dark:text-white" : "text-destructive dark:text-red-400"
              )}
            >
              {projection.projections_by_year[ano] 
                ? formatPercent(projection.projections_by_year[ano].ebitda_percent)
                : '-'
              }
            </TableCell>
          ))}
        </TableRow>
      </>
    );
  };

  if (!projections || projections.length === 0) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<BarChart3 className="h-4 w-4" />}
          title="Projeções de Culturas por Safra"
          description="Análise detalhada por cultura: Área, Produtividade, Preço, Receita, Custo e EBITDA"
        />
        <CardContent className="p-6">
          <EmptyState
            icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
            title="Nenhuma projeção disponível"
            description="Não há dados suficientes para gerar projeções de culturas. Verifique se há áreas de plantio, produtividades e custos cadastrados."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<BarChart3 className="h-4 w-4" />}
          title="Projeções de Culturas por Safra"
          description="Análise detalhada por cultura: Área, Produtividade, Preço, Receita, Custo e EBITDA"
        />
        <CardContent className="p-6">
          <Accordion type="multiple" className="space-y-4">
            {/* Seção 1: Projeções de Culturas */}
            {projections.map((projection, index) => renderProjectionAccordion(projection, index))}
            
            {/* Seção 2: Vendas de Sementes */}
            {sementes.map((projection, index) => renderProjectionAccordion(projection, `sementes-${index}`))}
            
            {/* Seção 3: Consolidação Total */}
            {renderProjectionAccordion(consolidado, 'consolidado')}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}