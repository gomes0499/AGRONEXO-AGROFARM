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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { getSafras } from "@/lib/actions/production-actions";
import { getCotacoesCambio } from "@/lib/actions/financial-actions/cotacoes-cambio-actions";

interface DividasBancariasSafraDetailProps {
  divida: any;
  organizacaoId: string;
}

export function DividasBancariasSafraDetail({
  divida,
  organizacaoId,
}: DividasBancariasSafraDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [safras, setSafras] = useState<any[]>([]);
  const [cotacoes, setCotacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Carregar safras e cotações ao expandir
  useEffect(() => {
    if (isExpanded && safras.length === 0 && !isLoading) {
      setIsLoading(true);
      
      const loadData = async () => {
        try {
          const [safrasData, cotacoesData] = await Promise.all([
            getSafras(organizacaoId),
            getCotacoesCambio(organizacaoId)
          ]);
          setSafras(safrasData || []);
          setCotacoes(cotacoesData || []);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, [isExpanded, safras.length, organizacaoId, isLoading]);
  
  // Obter valores por safra
  const getValoresPorSafra = () => {
    // Aceitar tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
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
    return safra ? safra.nome : `Safra ${safraId.substring(0, 8)}`;
  };
  
  // Obter cotação de câmbio para uma safra específica
  const getExchangeRateForSafra = (safraId: string): number => {
    // Buscar cotação de DOLAR_FECHAMENTO para a safra
    const cotacao = cotacoes.find(c => 
      c.safra_id === safraId && 
      c.tipo_moeda === "DOLAR_FECHAMENTO"
    );
    
    if (cotacao && cotacao.cotacoes_por_ano) {
      // Se tem cotações por ano, pegar a cotação para o safraId
      const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string' 
        ? JSON.parse(cotacao.cotacoes_por_ano)
        : cotacao.cotacoes_por_ano;
        
      return cotacoesPorAno[safraId] || cotacao.cotacao_atual || 5.7;
    }
    
    return cotacao?.cotacao_atual || 5.7; // Default 5.7 como no CSV
  };
  
  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        className="flex items-center justify-between w-full mb-2 border"
        onClick={() => setIsExpanded(!isExpanded)}
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
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </Button>
      
      {isExpanded && (
        <Card className="mt-2 border-dashed">
          <CardContent className="p-3">
            {isLoading ? (
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
      )}
    </div>
  );
}