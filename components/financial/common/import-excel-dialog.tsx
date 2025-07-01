"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ImportExcelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (items: any[]) => void;
  title: string;
  description: string;
  templateData: any[];
  headers: string[];
  validateRow: (row: any, index: number) => ValidationError[];
  processImport: (data: any[], organizationId: string) => Promise<any>;
  instructions: string[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function ImportExcelDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
  title,
  description,
  templateData,
  headers,
  validateRow,
  processImport,
  instructions,
}: ImportExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validData, setValidData] = useState<any[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");

  const downloadTemplate = () => {
    // Converter para CSV com separador padrão brasileiro
    const csvContent = [
      headers.join(";"),
      ...templateData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Formatar valores numéricos com vírgula para o padrão brasileiro
          if (typeof value === 'number') {
            return `"${value.toLocaleString('pt-BR')}"`;
          }
          return `"${value || ""}"`;
        }).join(";")
      ),
    ].join("\n");

    // Adicionar BOM para garantir encoding UTF-8
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `template_${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template baixado com sucesso!");
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const text = await file.text();
      
      // Processar CSV com suporte a separadores diferentes
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("Arquivo deve conter pelo menos uma linha de dados além do cabeçalho");
      }

      // Detectar separador (vírgula ou ponto e vírgula)
      const firstLine = lines[0];
      const separator = firstLine.includes(';') ? ';' : ',';
      
      const fileHeaders = firstLine.split(separator).map(h => h.trim().replace(/"/g, ''));
      
      // Verificar se todas as colunas obrigatórias estão presentes
      const missingHeaders = headers.filter(header => 
        !fileHeaders.some(h => h.toLowerCase() === header.toLowerCase())
      );
      if (missingHeaders.length > 0) {
        throw new Error(`Colunas obrigatórias faltando: ${missingHeaders.join(", ")}`);
      }

      const rows = [];
      const allErrors: ValidationError[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Pular linhas vazias
        
        const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        fileHeaders.forEach((header, index) => {
          row[header.toLowerCase()] = values[index] || "";
        });

        // Converter tipos numéricos e datas
        Object.keys(row).forEach(key => {
          const value = row[key];
          
          // Tentar converter valores monetários
          if (key.includes('valor') || key.includes('taxa') || key.includes('total')) {
            let numStr = value.toString()
              .replace(/[R$\s]/g, '')
              .replace(/\./g, '') // Remover pontos (separadores de milhares)
              .replace(',', '.'); // Trocar vírgula por ponto decimal
            row[key] = numStr ? parseFloat(numStr) : 0;
          }
          
          // Tentar converter anos
          else if (key.includes('ano')) {
            row[key] = value ? parseInt(value.toString().replace(/\D/g, '')) : 0;
          }
          
          // Tentar converter datas
          else if (key.includes('data')) {
            // Formato DD/MM/YYYY para YYYY-MM-DD
            const parts = value.split('/');
            if (parts.length === 3) {
              row[key] = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        });

        const rowErrors = validateRow(row, i - 1);
        allErrors.push(...rowErrors);

        if (rowErrors.length === 0) {
          rows.push(row);
        }
      }

      setValidData(rows);
      setErrors(allErrors);
      
      if (allErrors.length === 0) {
        setStep("preview");
        toast.success(`${rows.length} registros validados com sucesso!`);
      } else {
        toast.error(`${allErrors.length} erros encontrados. Corrija e tente novamente.`);
      }
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar arquivo");
      setErrors([]);
      setValidData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const importData = async () => {
    if (validData.length === 0) return;

    setStep("importing");
    setIsProcessing(true);

    try {
      const result = await processImport(validData, organizationId);
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      onSuccess(result.data || result);
      onOpenChange(false);
      
      toast.success(`${validData.length} registros importados com sucesso!`);
      
      // Reset state
      setFile(null);
      setValidData([]);
      setErrors([]);
      setStep("upload");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar dados");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setValidData([]);
    setErrors([]);
    setStep("upload");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4" />
                Baixar Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Baixe o template com exemplos e a estrutura correta de dados.
              </p>
              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Baixar Template CSV
              </Button>
            </CardContent>
          </Card>

          {/* Upload Section */}
          {step === "upload" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload do Arquivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Selecione um arquivo CSV ou Excel
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: .csv, .xlsx, .xls
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    disabled={isProcessing}
                  />
                </div>
                
                {isProcessing && (
                  <div className="flex items-center justify-center mt-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Processando arquivo...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Errors Display */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">
                    {errors.length} erro(s) encontrado(s):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {errors.slice(0, 10).map((error, index) => (
                      <p key={index} className="text-xs">
                        Linha {error.row}, {error.field}: {error.message}
                      </p>
                    ))}
                    {errors.length > 10 && (
                      <p className="text-xs">... e mais {errors.length - 10} erro(s)</p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Section */}
          {step === "preview" && validData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Pré-visualização ({validData.length} registros)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {headers.slice(0, 5).map((header) => (
                          <th key={header} className="text-left p-2">
                            {header.replace(/_/g, ' ').toUpperCase()}
                          </th>
                        ))}
                        {headers.length > 5 && (
                          <th className="text-left p-2">...</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {validData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t">
                          {headers.slice(0, 5).map((header) => (
                            <td key={header} className="p-2">
                              {typeof row[header] === 'number' 
                                ? row[header].toLocaleString('pt-BR')
                                : row[header] || '-'}
                            </td>
                          ))}
                          {headers.length > 5 && (
                            <td className="p-2">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validData.length > 10 && (
                    <div className="p-2 text-center text-xs text-muted-foreground border-t">
                      ... e mais {validData.length - 10} registros
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={importData}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar {validData.length} Registros
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetImport}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Importing Status */}
          {step === "importing" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-sm font-medium">Importando dados...</p>
                  <p className="text-xs text-muted-foreground">
                    Por favor, aguarde enquanto os dados são processados
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Instruções de Importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {instructions.map((instruction, index) => (
                <p key={index}>{instruction}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}