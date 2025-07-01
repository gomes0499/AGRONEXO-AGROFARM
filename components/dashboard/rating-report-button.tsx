"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Award, Loader2, Download, Mail, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { getSafras } from "@/lib/actions/production-actions";
import { getRatingData } from "@/lib/actions/rating-actions";
import { generateRatingPDF } from "@/lib/actions/rating-pdf-actions";
import { sendRatingReportByEmail } from "@/lib/actions/email-rating-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RatingReportButtonProps {
  organizationId: string;
  organizationName: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
}

export function RatingReportButton({ 
  organizationId, 
  organizationName,
  variant = "ghost",
  size = "default",
  showIcon = true,
  showText = true
}: RatingReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sendByEmail, setSendByEmail] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([""]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [selectedSafra, setSelectedSafra] = useState("");
  const [safras, setSafras] = useState<any[]>([]);

  useEffect(() => {
    if (isDialogOpen && organizationId) {
      // Carregar safras
      getSafras(organizationId).then(data => {
        setSafras(data || []);
        // Selecionar a safra mais recente por padrão
        if (data && data.length > 0) {
          const sortedSafras = [...data].sort((a, b) => b.ano_inicio - a.ano_inicio);
          setSelectedSafra(sortedSafras[0].id);
        }
      });

    }
  }, [isDialogOpen, organizationId]);

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

  const handleGenerateReport = async () => {
    try {
      if (!selectedSafra) {
        toast.error("Por favor, selecione a safra.");
        return;
      }

      setIsGenerating(true);
      setProgress(10);

      if (sendByEmail) {
        // Validar emails
        const validEmails = validateEmails();
        if (validEmails.length === 0) {
          toast.error("Por favor, insira pelo menos um email válido.");
          setIsGenerating(false);
          setProgress(0);
          return;
        }

        // Enviar por email
        toast.info(`Preparando envio para ${validEmails.length} destinatário(s)...`);
        setProgress(30);
        
        const result = await sendRatingReportByEmail(
          organizationId,
          organizationName,
          selectedSafra,
          validEmails,
          emailSubject,
          emailMessage
        );

        setProgress(100);

        if (result.success) {
          if (result.successCount === validEmails.length) {
            toast.success(
              `✅ Relatório de rating enviado com sucesso para todos os ${result.successCount} destinatário(s)!`
            );
          } else {
            toast.success(
              `✅ Relatório enviado para ${result.successCount} de ${validEmails.length} destinatário(s).`
            );
            if (result.failedCount > 0) {
              toast.warning(
                `⚠️ Falha ao enviar para ${result.failedCount} destinatário(s). Verifique os endereços de email.`
              );
            }
          }
        } else {
          toast.error("❌ Erro ao enviar o relatório por email. Tente novamente.");
        }
      } else {
        // Download direto
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 80));
        }, 500);

        const result = await generateRatingPDF(organizationId, selectedSafra);
        
        clearInterval(progressInterval);
        setProgress(90);
        
        if (result.url) {
          setProgress(100);

          // Download
          const link = document.createElement("a");
          link.href = result.url;
          const safraName = safras.find(s => s.id === selectedSafra)?.nome || "safra";
          link.download = `Rating_${organizationName.replace(/\s+/g, "_")}_${safraName}_${new Date().toISOString().split("T")[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success("Relatório de rating gerado com sucesso!");
        } else {
          throw new Error(result.error || "Erro ao gerar relatório");
        }
      }

      setIsDialogOpen(false);
      // Resetar formulário
      setSendByEmail(false);
      setEmailList([""]);
      setEmailSubject("");
      setEmailMessage("");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar o relatório. Tente novamente.");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className="w-full justify-start gap-2"
        >
          {showIcon && <Award className="h-4 w-4" />}
          {showText && "Relatório de Rating"}
        </Button>
      </DialogTrigger>
      <DialogContent className={sendByEmail ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>Gerar Relatório de Rating</DialogTitle>
          <DialogDescription>
            Gere uma análise de classificação (rating) baseada nos indicadores
            financeiros e produtivos da organização.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Seleção de safra e modelo */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="safra">Safra</Label>
              <Select value={selectedSafra} onValueChange={setSelectedSafra}>
                <SelectTrigger id="safra">
                  <SelectValue placeholder="Selecione a safra" />
                </SelectTrigger>
                <SelectContent>
                  {safras.map((safra) => (
                    <SelectItem key={safra.id} value={safra.id}>
                      {safra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Análises incluídas:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Classificação geral (AAA a D)</li>
              <li>• Análise de indicadores financeiros</li>
              <li>• Avaliação de risco</li>
              <li>• Comparativo com benchmarks</li>
              <li>• Recomendações de melhoria</li>
              <li>• Gráficos e visualizações</li>
            </ul>
          </div>

          {/* Opção de envio por email */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendByEmail"
                checked={sendByEmail}
                onChange={(e) => setSendByEmail(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="sendByEmail" className="text-sm font-medium cursor-pointer">
                Enviar por email
              </Label>
            </div>

            {sendByEmail && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto (opcional)</Label>
                  <Input
                    id="subject"
                    placeholder={`Relatório de Rating - ${organizationName}`}
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem (opcional)</Label>
                  <Textarea
                    id="message"
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
            )}
          </div>
          
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {sendByEmail ? "Enviando relatório..." : "Gerando relatório..."}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !selectedSafra}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {sendByEmail ? "Enviando..." : "Gerando..."}
                </>
              ) : (
                <>
                  {sendByEmail ? (
                    <>
                      <Mail className="h-4 w-4" />
                      Enviar por Email
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Baixar PDF
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}