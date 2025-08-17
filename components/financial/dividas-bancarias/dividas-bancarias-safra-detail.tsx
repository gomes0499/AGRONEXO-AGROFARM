"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2, CalendarIcon, FileText } from "lucide-react";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { getSafras } from "@/lib/actions/production-actions";
import { getCotacoesCambio } from "@/lib/actions/financial-actions/cotacoes-cambio-actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SafraData {
  id: string;
  nome: string;
}

interface CotacaoData {
  safra_id: string;
  tipo_moeda: string;
  cotacao_atual: number;
  cotacoes_por_ano?: any;
}

interface DividasBancariasSafraDetailProps {
  divida: any;
  organizacaoId: string;
  // Novos props para dados pré-carregados (opcional para lazy loading)
  initialSafras?: SafraData[];
  initialCotacoes?: CotacaoData[];
}

export function DividasBancariasSafraDetail({
  divida,
  organizacaoId,
  initialSafras,
  initialCotacoes,
}: DividasBancariasSafraDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [safras, setSafras] = useState<SafraData[]>(initialSafras || []);
  const [cotacoes, setCotacoes] = useState<CotacaoData[]>(initialCotacoes || []);
  const [isPending, startTransition] = useTransition();
  
  // Obter valores por safra
  const getValoresPorSafra = () => {
    const valores = divida.valores_por_safra || divida.valores_por_ano || {};
    
    if (typeof valores === 'string') {
      try {
        return JSON.parse(valores);
      } catch (e) {
        console.error("Erro ao processar valores por safra:", e);
        return {};
      }
    }
    
    return valores;
  };
  
  const valoresPorSafra = getValoresPorSafra();
  
  // Verificar se há valores para mostrar
  if (Object.keys(valoresPorSafra).length === 0) {
    return null;
  }
  
  // Calcular valor total
  const total = Object.values(valoresPorSafra).reduce(
    (acc: number, val) => acc + Number(val || 0),
    0
  );
  
  // Obter nome da safra pelo ID
  const getSafraName = (safraId: string) => {
    const safra = safras.find(s => s.id === safraId);
    return safra ? safra.nome : "N/A";
  };
  
  // Obter cotação de câmbio para uma safra específica
  const getExchangeRateForSafra = (safraId: string): number => {
    const cotacao = cotacoes.find(c => 
      c.safra_id === safraId && 
      c.tipo_moeda === "DOLAR_FECHAMENTO"
    );
    
    if (cotacao && cotacao.cotacoes_por_ano) {
      const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string' 
        ? JSON.parse(cotacao.cotacoes_por_ano)
        : cotacao.cotacoes_por_ano;
        
      return cotacoesPorAno[safraId] || cotacao.cotacao_atual || 5.7;
    }
    
    return cotacao?.cotacao_atual || 5.7;
  };

  // Função para expandir e carregar dados se necessário
  const handleExpand = async () => {
    if (!isExpanded && safras.length === 0 && !initialSafras) {
      // Lazy load apenas se não temos dados iniciais
      startTransition(async () => {
        try {
          const [safrasData, cotacoesData] = await Promise.all([
            getSafras(organizacaoId),
            getCotacoesCambio(organizacaoId)
          ]);
          setSafras(safrasData || []);
          setCotacoes(cotacoesData || []);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        }
      });
    }
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        className="flex items-center justify-between w-full mb-2 border"
        onClick={handleExpand}
        disabled={isPending}
      >
        <span className="text-sm font-medium">
          Pagamentos por Safra
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            Total: {formatGenericCurrency(total as number, divida.moeda || "BRL")}
            <span className="ml-1 text-xs text-muted-foreground">
              {divida.moeda || "BRL"}
            </span>
          </span>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </Button>
      
      {isExpanded && (
        <div className="space-y-3 mt-2">
          {/* Informações do Contrato */}
          {(divida.numero_contrato || divida.quantidade_parcelas || divida.periodicidade || divida.datas_pagamento_irregular) && (
            <Card className="border-dashed">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informações do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {divida.numero_contrato && (
                    <div>
                      <span className="text-muted-foreground">Contrato:</span>
                      <p className="font-mono font-medium">{divida.numero_contrato}</p>
                    </div>
                  )}
                  {divida.quantidade_parcelas && (
                    <div>
                      <span className="text-muted-foreground">Parcelas:</span>
                      <p className="font-medium">{divida.quantidade_parcelas}x</p>
                    </div>
                  )}
                  {divida.periodicidade && (
                    <div>
                      <span className="text-muted-foreground">Periodicidade:</span>
                      <Badge 
                        variant={divida.periodicidade === "IRREGULAR" ? "destructive" : "outline"}
                        className="mt-1"
                      >
                        {divida.periodicidade === "MENSAL" ? "Mensal" :
                         divida.periodicidade === "BIMESTRAL" ? "Bimestral" :
                         divida.periodicidade === "TRIMESTRAL" ? "Trimestral" :
                         divida.periodicidade === "QUADRIMESTRAL" ? "Quadrimestral" :
                         divida.periodicidade === "SEMESTRAL" ? "Semestral" :
                         divida.periodicidade === "ANUAL" ? "Anual" :
                         divida.periodicidade === "IRREGULAR" ? "Irregular" : 
                         divida.periodicidade}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Datas Irregulares */}
                {divida.periodicidade === "IRREGULAR" && divida.datas_pagamento_irregular && divida.datas_pagamento_irregular.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Datas de Pagamento:</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {divida.datas_pagamento_irregular
                        .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
                        .map((data: string, index: number) => (
                          <Badge key={index} variant="secondary" className="justify-center">
                            {format(new Date(data), "dd/MM/yyyy", { locale: ptBR })}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabela de Valores por Safra */}
          <Card className="border-dashed">
            <CardContent className="p-3">
              {isPending || safras.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Carregando dados das safras...
                </div>
              ) : (
                <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="font-medium text-sm uppercase">Safra</TableHead>
                    <TableHead className="font-medium text-sm text-right uppercase">Valor</TableHead>
                    <TableHead className="font-medium text-sm text-right uppercase">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(valoresPorSafra).map(([safraId, valor]) => (
                    <TableRow key={safraId}>
                      <TableCell className="font-medium">{getSafraName(safraId)}</TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium text-sm">
                            {formatGenericCurrency(Number(valor), divida.moeda || "BRL")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {divida.moeda === "USD" 
                              ? formatGenericCurrency(Number(valor) * getExchangeRateForSafra(safraId), "BRL")
                              : formatGenericCurrency(Number(valor) / getExchangeRateForSafra(safraId), "USD")
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {(total as number) > 0 ? `${((Number(valor) / (total as number)) * 100).toFixed(1)}%` : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    )}
    </div>
  );
}