"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2, Download, Mail, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { exportOrganizationDataToExcel } from "@/lib/actions/excel-export-actions";
import { sendExcelByEmail } from "@/lib/actions/email-excel-actions";
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

interface ExcelExportButtonProps {
  organizationId: string;
  organizationName: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
}

export function ExcelExportButton({ 
  organizationId, 
  organizationName,
  variant = "ghost",
  size = "default",
  showIcon = true,
  showText = true
}: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(10);

      if (sendByEmail) {
        // Validar emails
        const validEmails = validateEmails();
        if (validEmails.length === 0) {
          toast.error("Por favor, insira pelo menos um email válido.");
          setIsExporting(false);
          setProgress(0);
          return;
        }

        // Enviar por email
        toast.info(`Preparando envio para ${validEmails.length} destinatário(s)...`);
        setProgress(30);
        
        const result = await sendExcelByEmail(
          organizationId,
          organizationName,
          validEmails,
          emailSubject || undefined,
          emailMessage || undefined
        );

        setProgress(100);

        if (result.success) {
          if (result.successCount === validEmails.length) {
            toast.success(
              `✅ Planilha enviada com sucesso para todos os ${result.successCount} destinatário(s)!`
            );
          } else {
            toast.success(
              `✅ Planilha enviada para ${result.successCount} de ${validEmails.length} destinatário(s).`
            );
            if (result.failedCount > 0) {
              toast.warning(
                `⚠️ Falha ao enviar para ${result.failedCount} destinatário(s). Verifique os endereços de email.`
              );
            }
          }
        } else {
          toast.error("❌ Erro ao enviar a planilha por email. Tente novamente.");
        }
      } else {
        // Download direto
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 80));
        }, 300);

        const result = await exportOrganizationDataToExcel(organizationId);
        
        clearInterval(progressInterval);
        setProgress(90);
        
        if (result && result.data) {
          // Converter base64 para blob
          const binaryString = atob(result.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          setProgress(100);

          // Download
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = result.filename || `Dados_${organizationName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success("Dados exportados com sucesso!");
        } else {
          throw new Error("Erro ao exportar dados");
        }
      }

      setIsDialogOpen(false);
      // Resetar formulário
      setSendByEmail(false);
      setEmailList([""]);
      setEmailSubject("");
      setEmailMessage("");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar os dados. Tente novamente.");
    } finally {
      setIsExporting(false);
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
          {showIcon && <FileSpreadsheet className="h-4 w-4" />}
          {showText && "Exportar Dados"}
        </Button>
      </DialogTrigger>
      <DialogContent className={sendByEmail ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>Exportar Dados para Excel</DialogTitle>
          <DialogDescription>
            Exporte todos os dados da organização em formato Excel (.xlsx).
            A planilha incluirá informações de propriedades, produção,
            financeiro e indicadores.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Dados incluídos:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Dados da Organização</li>
              <li>• Propriedades e Arrendamentos</li>
              <li>• Áreas de Plantio por Safra</li>
              <li>• Produtividade e Custos</li>
              <li>• Dívidas e Financiamentos</li>
              <li>• Indicadores Financeiros</li>
              <li>• Fluxo de Caixa</li>
              <li>• DRE e Balanço Patrimonial</li>
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
                    placeholder={`Dados Excel - ${organizationName}`}
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem (opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Digite uma mensagem personalizada para acompanhar a planilha..."
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
          
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {sendByEmail ? "Enviando planilha..." : "Exportando dados..."}
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
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {sendByEmail ? "Enviando..." : "Exportando..."}
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
                      Baixar Excel
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