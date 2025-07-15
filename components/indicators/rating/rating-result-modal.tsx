"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Target,
  TrendingUp,
  Calculator,
  Calendar,
  FileText,
  Download,
  X,
  FileDown,
  Mail,
  Plus,
  Loader2,
} from "lucide-react";
import { getRatingFromScore } from "@/schemas/rating";
import { exportRatingPDF } from "@/lib/actions/rating-pdf-export";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendRatingResultByEmail } from "@/lib/actions/email-rating-actions";

interface RatingResultModalProps {
  calculation: any;
  isOpen: boolean;
  onClose: () => void;
  organizationName?: string;
}

// Formulas for quantitative metrics
const METRIC_FORMULAS: Record<string, string> = {
  AREA_PROPRIA: "Área Própria / Área Total",
  DIVIDA_EBITDA: "Dívida Estrutural* / EBITDA",
  DIVIDA_FATURAMENTO: "Dívida Total / Receita",
  LIQUIDEZ_CORRENTE: "(Caixa + Ativo Biológico) / Passivos Circulantes",
  DIVIDA_PATRIMONIO_LIQUIDO: "Dívida Total / Patrimônio Líquido",
  LTV: "(Dívida Total - Caixa) / Valor dos Ativos",
  CULTURAS_CORE: "Receita Culturas Core / Receita Total",
  MARGEM_EBITDA: "(EBITDA / Receita) × 100",
  TENDENCIA_PRODUTIVIDADE_5_ANOS: "Média de variação de produtividade últimos 5 anos"
};

// Detailed descriptions for metrics
const METRIC_DESCRIPTIONS: Record<string, string> = {
  DIVIDA_EBITDA: "*Dívida Estrutural = Ativos Operacionais - Passivos Operacionais\n• Ativos Operacionais: Caixa, Clientes, Estoque, Adiantamentos, Ativo Biológico\n• Passivos Operacionais: Bancos + Terras, Fornecedores, Adiantamentos\n\nIdeal que seja negativa ou muito baixa. Dívida estrutural positiva é necessário entender o motivo.\nFormas de ter dívida estrutural positiva: Investimentos, Prejuízo, Empréstimos para atividades fora produção"
};

export function RatingResultModal({
  calculation,
  isOpen,
  onClose,
  organizationName = "Organização",
}: RatingResultModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([""]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  if (!calculation) return null;

  const rating = getRatingFromScore(calculation.pontuacao_total);
  const detalhes = calculation.detalhes_calculo as Record<string, any> || {};
  const safra = detalhes.safra || "";
  const scenario = detalhes.scenario || "Base";

  // Extract metrics data
  const getMetricsData = () => {
    console.log("detalhes_calculo:", detalhes);
    
    // For SR/Prime model, detalhes might have metrics property
    if (detalhes.metrics && Array.isArray(detalhes.metrics)) {
      console.log("Using detalhes.metrics:", detalhes.metrics);
      return detalhes.metrics;
    }
    // Or it might be metricas (Portuguese)
    if (detalhes.metricas && Array.isArray(detalhes.metricas)) {
      console.log("Using detalhes.metricas:", detalhes.metricas);
      return detalhes.metricas;
    }
    // For other models, detalhes might be an array directly
    if (Array.isArray(detalhes)) {
      console.log("Using detalhes as array:", detalhes);
      return detalhes;
    }
    console.log("No metrics found, returning empty array");
    return [];
  };

  const metrics = getMetricsData();

  // Debug: Check MARGEM_EBITDA specifically
  const margemEbitdaMetric = metrics.find(m => m.codigo === 'MARGEM_EBITDA');
  console.log("MARGEM_EBITDA metric:", margemEbitdaMetric);

  // Separate metrics by type
  const quantitativeMetrics = metrics.filter(m => m.tipo === 'QUANTITATIVE' || m.source_type === 'CALCULATED');
  const qualitativeMetrics = metrics.filter(m => m.tipo === 'QUALITATIVE' || m.source_type === 'MANUAL');

  // Calculate totals
  const quantitativeTotal = quantitativeMetrics.reduce((sum, m) => sum + (m.pontuacao * m.peso / 100), 0);
  const qualitativeTotal = qualitativeMetrics.reduce((sum, m) => sum + (m.pontuacao * m.peso / 100), 0);

  const addEmail = () => {
    setEmailList([...emailList, ""]);
  };

  const removeEmail = (index: number) => {
    if (emailList.length > 1) {
      setEmailList(emailList.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emailList];
    newEmails[index] = value;
    setEmailList(newEmails);
  };

  const validateEmails = () => {
    const validEmails = emailList.filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.trim());
    });
    return validEmails;
  };

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true);
      
      // Validate emails
      const validEmails = validateEmails();
      if (validEmails.length === 0) {
        toast.error("Por favor, insira pelo menos um email válido.");
        return;
      }

      // First, export PDF
      const pdfResult = await exportRatingPDF(calculation, organizationName);
      
      if (!pdfResult.success || !pdfResult.data) {
        toast.error("Erro ao gerar PDF para envio");
        return;
      }

      // Prepare rating result data
      const ratingResult = {
        rating: calculation.rating_letra,
        finalScore: calculation.pontuacao_total,
        modelName: calculation.rating_model_nome || "SR/Prime Rating Model",
        safraName: safra || "N/A",
        scenarioName: scenario,
        calculatedAt: calculation.data_calculo,
        metrics: metrics.map(m => ({
          nome: m.nome,
          peso: m.peso,
          pontuacao: m.pontuacao,
          contribuicao: m.pontuacao * m.peso / 100
        }))
      };

      // Send emails
      const result = await sendRatingResultByEmail(
        organizationName,
        ratingResult,
        validEmails,
        emailSubject || `Relatório de Rating - ${organizationName}`,
        emailMessage,
        pdfResult.data
      );

      if (result.success) {
        if (result.successCount === validEmails.length) {
          toast.success(`Relatório enviado com sucesso para ${result.successCount} destinatário(s)!`);
        } else {
          toast.warning(`Relatório enviado para ${result.successCount} de ${validEmails.length} destinatários.`);
          if (result.errors) {
            result.errors.forEach(error => toast.error(error));
          }
        }
        
        // Close email dialog and reset
        setIsEmailDialogOpen(false);
        setEmailList([""]);
        setEmailSubject("");
        setEmailMessage("");
      } else {
        toast.error("Erro ao enviar relatório por email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Erro ao enviar email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const result = await exportRatingPDF(calculation, organizationName);
      
      if (result.success && result.data) {
        // Create a blob from the base64 data
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'rating-report.pdf';
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        toast.success("PDF exportado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao exportar PDF");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[90vw] max-w-[95vw] w-[90vw] min-h-[90vh] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              Resultado do Rating
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEmailDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Enviar por Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Exportar PDF
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Main Rating Display */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <div 
                      className="text-8xl font-bold"
                      style={{ color: rating.cor }}
                    >
                      {calculation.rating_letra}
                    </div>
                    <div className="text-3xl font-semibold">
                      {calculation.pontuacao_total?.toFixed(1) || '0.0'} pontos
                    </div>
                    <p className="text-lg text-muted-foreground">
                      {calculation.rating_descricao || rating.descricao}
                    </p>
                  </div>
                  
                  <Progress 
                    value={calculation.pontuacao_total} 
                    className="w-full h-4 max-w-2xl mx-auto"
                  />
                  
                  <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(calculation.data_calculo!).toLocaleDateString('pt-BR')}
                    </div>
                    {safra && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Safra: {safra}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Cenário: {scenario}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Análise Quantitativa (60%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {quantitativeTotal.toFixed(1)} pts
                    </div>
                    <Progress value={(quantitativeTotal / 60) * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {quantitativeMetrics.length} métricas calculadas automaticamente
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Análise Qualitativa (40%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {qualitativeTotal.toFixed(1)} pts
                    </div>
                    <Progress value={(qualitativeTotal / 40) * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {qualitativeMetrics.length} métricas avaliadas manualmente
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento por Métrica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Quantitative Metrics */}
                  {quantitativeMetrics.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-muted-foreground">
                        Métricas Quantitativas (Calculadas Automaticamente)
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {quantitativeMetrics.map((metric, index) => (
                          <div key={index} className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{metric.nome}</span>
                                <Badge variant="outline" className="text-xs">
                                  {metric.peso}%
                                </Badge>
                              </div>
                              <span className="font-semibold">
                                {metric.pontuacao.toFixed(0)} pts
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Valor: {formatMetricValue(metric.codigo, metric.valor)}</span>
                              <span>Contribuição: {(metric.pontuacao * metric.peso / 100).toFixed(1)} pts</span>
                            </div>
                            {METRIC_FORMULAS[metric.codigo] && (
                              <div className="text-xs text-muted-foreground italic">
                                Fórmula: {METRIC_FORMULAS[metric.codigo]}
                              </div>
                            )}
                            {METRIC_DESCRIPTIONS[metric.codigo] && (
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                {METRIC_DESCRIPTIONS[metric.codigo].split('\n').map((line, index) => (
                                  <div key={index} className={line.startsWith('•') ? 'ml-3' : ''}>
                                    {line}
                                  </div>
                                ))}
                              </div>
                            )}
                            <Progress 
                              value={metric.pontuacao} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Qualitative Metrics */}
                  {qualitativeMetrics.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-muted-foreground">
                        Métricas Qualitativas (Avaliadas Manualmente)
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {qualitativeMetrics.map((metric, index) => (
                          <div key={index} className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{metric.nome}</span>
                                <Badge variant="outline" className="text-xs">
                                  {metric.peso}%
                                </Badge>
                              </div>
                              <span className="font-semibold">
                                {metric.pontuacao.toFixed(0)} pts
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Nota: {metric.valor}/5</span>
                              <span>Contribuição: {(metric.pontuacao * metric.peso / 100).toFixed(1)} pts</span>
                            </div>
                            {metric.selected_option && (
                              <div className="text-sm text-primary mt-1">
                                {metric.valor} - {metric.selected_option}
                              </div>
                            )}
                            <Progress 
                              value={metric.pontuacao} 
                              className="h-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center p-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            {calculation.rating_model_nome || "SR/Prime Rating Model"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Relatório de Rating por Email</DialogTitle>
            <DialogDescription>
              Envie o relatório de rating para múltiplos destinatários
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Assunto (opcional)</Label>
              <Input
                id="emailSubject"
                placeholder={`Relatório de Rating - ${organizationName}`}
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailMessage">Mensagem (opcional)</Label>
              <Textarea
                id="emailMessage"
                placeholder="Digite uma mensagem personalizada para acompanhar o relatório..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Destinatários</Label>
              {emailList.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                  />
                  {emailList.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeEmail(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmail}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar destinatário
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={isSendingEmail}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="gap-2"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Enviar por Email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function formatMetricValue(code: string, value: number): string {
  if (value >= 999) {
    return 'N/A';
  }
  
  const formatters: Record<string, (v: number) => string> = {
    'LIQUIDEZ_CORRENTE': (v) => (v || 0).toFixed(2),
    'DIVIDA_EBITDA': (v) => (v || 0).toFixed(2) + 'x',
    'DIVIDA_FATURAMENTO': (v) => ((v || 0) * 100).toFixed(1) + '%',
    'DIVIDA_PATRIMONIO_LIQUIDO': (v) => ((v || 0) * 100).toFixed(1) + '%',
    'LTV': (v) => (v || 0).toFixed(1) + '%', // LTV já vem em porcentagem do banco
    'MARGEM_EBITDA': (v) => (v || 0).toFixed(1) + '%',
    'CULTURAS_CORE': (v) => (v || 0).toFixed(0) + '%',
    'AREA_PROPRIA': (v) => (v || 0).toFixed(0) + '%',
  };
  
  const formatter = formatters[code];
  return formatter ? formatter(value) : (value || 0).toFixed(2);
}