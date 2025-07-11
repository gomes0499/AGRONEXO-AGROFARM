"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, Target, Calculator } from "lucide-react";
import type { RatingCalculation } from "@/schemas/rating";
import { getRatingFromScore } from "@/schemas/rating";
import { CalculateRatingModal } from "./calculate-rating-modal";

interface RatingCalculationViewProps {
  calculation: RatingCalculation;
  organizationName?: string;
  organizationId: string;
  onCalculate?: () => void;
}

export function RatingCalculationView({ calculation, organizationName, organizationId, onCalculate }: RatingCalculationViewProps) {
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const rating = getRatingFromScore(calculation.pontuacao_total);
  const detalhes = calculation.detalhes_calculo as Record<string, any> || {};
  const safra = detalhes.safra || "";

  // Handle both formats: metrics array or direct metric objects
  const getMetricsData = () => {
    if (detalhes.metrics && Array.isArray(detalhes.metrics)) {
      // New format from calculateRating
      return detalhes.metrics.reduce((acc: Record<string, any>, metric: any) => {
        acc[metric.codigo] = {
          valor: metric.valor,
          pontuacao: metric.pontuacao,
          peso: metric.peso
        };
        return acc;
      }, {});
    } else {
      // Current format from calculateRatingForOrganization
      return detalhes;
    }
  };

  const metricsData = getMetricsData();

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Target className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-white">
              Rating Calculado
            </CardTitle>
          </div>
          <Button
            onClick={() => setShowCalculateModal(true)}
            size="sm"
            className="bg-white hover:bg-gray-100 text-primary"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Main Rating Display */}
          <div className="p-6 text-center space-y-4 border-r">
            <h3 className="text-sm font-medium text-muted-foreground">Rating Atual</h3>
            <div className="space-y-2">
              <div 
                className="text-6xl font-bold"
                style={{ color: rating.cor }}
              >
                {calculation.rating_letra}
              </div>
              <div className="text-2xl font-semibold">
                {calculation.pontuacao_total?.toFixed(1) || '0.0'} pontos
              </div>
              <p className="text-muted-foreground">
                {rating.descricao}
              </p>
            </div>
            
            <Progress 
              value={calculation.pontuacao_total} 
              className="w-full h-3"
            />
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Calculado em {new Date(calculation.data_calculo!).toLocaleDateString('pt-BR')}
              </div>
              {organizationName && (
                <div className="text-sm text-muted-foreground">
                  Organização: <span className="font-medium">{organizationName}</span>
                </div>
              )}
              {safra && (
                <div className="text-sm text-muted-foreground">
                  Safra: <span className="font-medium">{safra}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metric Breakdown */}
          <div className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detalhamento por Métrica
            </h3>
            <div className="space-y-3">
              {Object.entries(metricsData)
                .filter(([key]) => key !== 'safra' && key !== 'safra_id' && key !== 'metrics' && key !== 'financialData') // Exclude non-metric fields
                .length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma métrica disponível
                  </p>
                ) : Object.entries(metricsData)
                .filter(([key]) => key !== 'safra' && key !== 'safra_id' && key !== 'metrics' && key !== 'financialData') // Exclude non-metric fields
                .map(([metricCode, metricData]) => {
                const data = metricData as { valor: number; pontuacao: number; peso: number };
                
                return (
                  <div key={metricCode} className="space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {getMetricDisplayName(metricCode)}
                      </span>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {data?.peso || 0}%
                        </Badge>
                        <span className="text-sm font-semibold">
                          {data?.pontuacao?.toFixed(0) || '0'} pts
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={data?.pontuacao || 0} 
                      className="w-full h-2"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Valor: {formatMetricValue(metricCode, data?.valor)}</span>
                      <span>Contribuição: {(((data?.pontuacao || 0) * (data?.peso || 0)) / 100).toFixed(1)} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Calculate Rating Modal */}
      <CalculateRatingModal
        organizationId={organizationId}
        modelId={calculation.rating_model_id || ""}
        modelName={detalhes.modelo_nome || "SR/Prime Rating Model"}
        isOpen={showCalculateModal}
        onClose={() => setShowCalculateModal(false)}
        onSuccess={() => {
          setShowCalculateModal(false);
          onCalculate?.();
        }}
      />
    </Card>
  );
}

function getMetricDisplayName(code: string): string {
  const names: Record<string, string> = {
    'LIQUIDEZ_CORRENTE': 'Liquidez Corrente',
    'DIVIDA_EBITDA': 'Dívida / EBITDA',
    'DIVIDA_FATURAMENTO': 'Dívida / Faturamento',
    'DIVIDA_PATRIMONIO_LIQUIDO': 'Dívida / Patrimônio Líquido',
    'LTV': 'LTV (Loan to Value)',
    'MARGEM_EBITDA': 'Margem EBITDA',
  };
  
  return names[code] || code;
}

function formatMetricValue(code: string, value: number): string {
  // Handle special cases for high values (division by zero)
  if (value >= 999) {
    return 'N/A';
  }
  
  const formatters: Record<string, (v: number) => string> = {
    'LIQUIDEZ_CORRENTE': (v) => (v || 0).toFixed(2),
    'DIVIDA_EBITDA': (v) => (v || 0).toFixed(2) + 'x',
    'DIVIDA_FATURAMENTO': (v) => ((v || 0) * 100).toFixed(1) + '%',
    'DIVIDA_PATRIMONIO_LIQUIDO': (v) => ((v || 0) * 100).toFixed(1) + '%',
    'LTV': (v) => ((v || 0) * 100).toFixed(1) + '%',
    'MARGEM_EBITDA': (v) => (v || 0).toFixed(1) + '%',
  };
  
  const formatter = formatters[code];
  return formatter ? formatter(value) : (value || 0).toFixed(2);
}