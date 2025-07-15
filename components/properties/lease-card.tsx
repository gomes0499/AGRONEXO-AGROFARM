"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MapPin, FileText, TrendingUp } from "lucide-react";
import { Lease } from "@/schemas/properties";
import { formatCurrency } from "@/lib/utils/formatters";
import { Separator } from "@/components/ui/separator";
import { getCommodityPriceProjections } from "@/lib/actions/production-prices-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

interface LeaseCardProps {
  lease: Lease;
  propertyName?: string;
  safras?: any[];
}

export function LeaseCard({ lease, propertyName, safras = [] }: LeaseCardProps) {
  const [soyPrices, setSoyPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSoyPrices = async () => {
      try {
        const supabase = createClient();
        
        // Buscar diretamente da tabela commodity_price_projections
        const { data, error } = await supabase
          .from("commodity_price_projections")
          .select("commodity_type, precos_por_ano")
          .eq("organizacao_id", lease.organizacao_id)
          .eq("commodity_type", "SOJA_SEQUEIRO")
          .limit(1);

        if (error) {
          console.error("Erro ao buscar preços:", error);
          // Usar preços padrão se não encontrar
          setSoyPrices({});
        } else if (data && data.length > 0 && data[0].precos_por_ano) {
          setSoyPrices(data[0].precos_por_ano);
        } else {
          setSoyPrices({});
        }
      } catch (error) {
        console.error("Erro ao buscar preços da soja:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSoyPrices();
  }, [lease.organizacao_id]);

  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const calculateTotalCost = () => {
    if (!lease.custos_por_ano) return 0;
    let totalReais = 0;
    
    Object.entries(lease.custos_por_ano).forEach(([safraId, valorReais]) => {
      const valorReaisNum = typeof valorReais === 'number' ? valorReais : 0;
      // O valor já está em reais, não precisa multiplicar
      totalReais += valorReaisNum;
    });
    
    return totalReais;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-lg">{lease.nome_fazenda}</h4>
            <p className="text-sm text-muted-foreground">
              Contrato: {lease.numero_arrendamento}
            </p>
          </div>
          <Badge variant={lease.ativo ? "default" : "secondary"}>
            {lease.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Arrendantes</p>
              <p className="font-medium">{lease.arrendantes}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Período</p>
              <p className="font-medium">
                {formatDate(lease.data_inicio)} - {formatDate(lease.data_termino)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Área</p>
              <p className="font-medium">
                {lease.area_arrendada} ha de {lease.area_fazenda} ha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Custo/Hectare</p>
              <p className="font-medium">
                {lease.custo_hectare} {lease.tipo_pagamento === "SACAS" ? "sacas/ha" : "R$/ha"}
              </p>
            </div>
          </div>
        </div>

        {lease.custos_por_ano && Object.keys(lease.custos_por_ano).length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">Valores Calculados por Safra</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loading ? (
                  <>
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                  </>
                ) : (
                  Object.entries(lease.custos_por_ano)
                    .sort(([safraIdA], [safraIdB]) => {
                      // Ordenar pelas safras usando o array de safras
                      const safraA = safras.find(s => s.id === safraIdA);
                      const safraB = safras.find(s => s.id === safraIdB);
                      const anoA = safraA ? safraA.ano_inicio : 9999;
                      const anoB = safraB ? safraB.ano_inicio : 9999;
                      return anoA - anoB;
                    })
                    .map(([safraId, valor]) => {
                      const safra = safras.find(s => s.id === safraId);
                      const safraName = safra ? safra.nome : "Safra";
                      const valorReais = typeof valor === 'number' ? valor : 0;
                      const precoSoja = soyPrices[safraId] || 125; // Default para R$ 125,00/saca
                      // Calcular sacas baseado no valor em reais e preço da soja
                      const sacas = precoSoja > 0 ? valorReais / precoSoja : 0;
                      
                      return (
                        <div key={safraId} className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">{safraName}</p>
                          <p className="text-lg font-semibold">{formatCurrency(valorReais)}</p>
                          <p className="text-xs text-muted-foreground">
                            {sacas.toFixed(0)} sacas × R$ {precoSoja.toFixed(2)}/saca
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Custo Total do Arrendamento</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(calculateTotalCost())}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {lease.observacoes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-1">Observações</p>
            <p className="text-sm">{lease.observacoes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}