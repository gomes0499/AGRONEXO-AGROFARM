"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, FileText, X, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { exportRatingToPDF } from "@/lib/services/rating-pdf-export";

interface MetricResult {
  nome: string;
  codigo: string;
  categoria: string;
  valor: number;
  peso: number;
  pontuacao: number;
  contribuicao: number;
  unidade?: string;
}

interface RatingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  result: {
    modelName: string;
    safraName: string;
    scenarioName: string;
    finalScore: number;
    rating: string;
    ratingColor: string;
    metrics: MetricResult[];
    calculatedAt: Date;
  } | null;
}

export function RatingResultModal({ isOpen, onClose, onSave, result }: RatingResultModalProps) {
  if (!result) return null;

  const getRatingDescription = (rating: string) => {
    const descriptions: Record<string, string> = {
      AAA: "Excelente capacidade de crédito",
      AA: "Muito boa capacidade de pagamento",
      A: "Boa capacidade de pagamento",
      BBB: "Capacidade adequada de pagamento",
      BB: "Capacidade de pagamento com incertezas",
      B: "Capacidade limitada de pagamento",
      C: "Capacidade frágil de pagamento",
    };
    return descriptions[rating] || "Capacidade de pagamento indefinida";
  };

  const formatValue = (value: number, codigo: string, unidade?: string) => {
    // Format based on metric type
    if (codigo.includes("DIVIDA") || codigo.includes("LTV")) {
      return value.toFixed(2) + "x";
    } else if (codigo.includes("MARGEM")) {
      return value.toFixed(1) + "%";
    } else if (codigo === "LIQUIDEZ_CORRENTE") {
      return value.toFixed(2) + "x";
    }
    return value.toFixed(2) + (unidade ? ` ${unidade}` : "");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[50%] max-w-[95%] w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Resultado do Rating
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header com informações gerais */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Análise de Rating</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.modelName} • Safra {result.safraName} • {result.scenarioName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {format(result.calculatedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(result.calculatedAt, "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <Award className="h-16 w-16 mx-auto text-primary" />
                  <div className="space-y-2">
                    <div className="text-5xl font-bold">{result.finalScore.toFixed(1)}</div>
                    <Badge 
                      className={`${result.ratingColor} text-white text-2xl px-6 py-2`}
                    >
                      {result.rating}
                    </Badge>
                    <p className="text-muted-foreground">
                      {getRatingDescription(result.rating)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento das métricas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Composição da Nota</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detalhamento da contribuição de cada indicador
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {result.metrics.map((metric, index) => (
                  <div key={index} className="space-y-3 p-5 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{metric.nome}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-sm">
                            {metric.categoria}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Peso: {metric.peso}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {metric.contribuicao.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">pontos</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Valor</p>
                        <p className="font-semibold text-lg">
                          {formatValue(metric.valor, metric.codigo, metric.unidade)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Pontuação</p>
                        <p className="font-semibold text-lg">{metric.pontuacao.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Cálculo</p>
                        <p className="text-sm font-mono">
                          {metric.pontuacao.toFixed(1)} × {metric.peso}% = {metric.contribuicao.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={(metric.pontuacao / 100) * 100} 
                      className="h-3 mt-3"
                    />
                  </div>
                ))}

              </div>
              
              {/* Resumo final */}
              <div className="mt-6 p-6 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Pontuação Final</span>
                  <span className="text-3xl font-bold">{result.finalScore.toFixed(1)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Soma ponderada de todas as contribuições
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-between">
            <div>
              {onSave && (
                <Button variant="outline" onClick={() => {
                  onSave();
                  toast.success("Cálculo salvo com sucesso");
                }}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Cálculo
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                if (result) {
                  try {
                    exportRatingToPDF(result);
                    toast.success("PDF exportado com sucesso!");
                  } catch (error) {
                    console.error("Erro ao exportar PDF:", error);
                    toast.error("Erro ao exportar PDF");
                  }
                }
              }}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button onClick={onClose}>Fechar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}