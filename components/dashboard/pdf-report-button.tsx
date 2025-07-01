"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Download, Mail, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { generateDefinitiveReport } from "@/lib/actions/definitive-report-actions";
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

interface PDFReportButtonProps {
  organizationId: string;
  organizationName: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
}

export function PDFReportButton({ 
  organizationId, 
  organizationName,
  variant = "ghost",
  size = "default",
  showIcon = true,
  showText = true
}: PDFReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sendByEmail, setSendByEmail] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([""]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

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

        // TODO: Implementar envio por email
        toast.info("Função de envio por email será implementada em breve.");
        setProgress(100);
      } else {
        // Download direto
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 80));
        }, 500);

        const result = await generateDefinitiveReport(organizationId);
        
        clearInterval(progressInterval);
        setProgress(90);
        
        if (result.success && result.data) {
          // Converter base64 para blob
          const binaryString = atob(result.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          
          setProgress(100);

          // Download
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = result.filename || `Relatorio_Completo_${organizationName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success("Relatório gerado com sucesso!");
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
          {showIcon && <FileText className="h-4 w-4" />}
          {showText && "Relatório Completo"}
        </Button>
      </DialogTrigger>
      <DialogContent className={sendByEmail ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>Gerar Relatório Completo</DialogTitle>
          <DialogDescription>
            O relatório incluirá todas as informações da organização de forma completa e detalhada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Opção de envio por email */}
          <div className="space-y-4">
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
                    placeholder={`Relatório Completo - ${organizationName}`}
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
              disabled={isGenerating}
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