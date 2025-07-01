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

interface ImportRow {
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportConfig {
  title: string;
  description: string;
  templateFileName: string;
  requiredFields: string[];
  optionalFields: string[];
  fieldMappings: Record<string, string>;
  templateData: any[];
  instructions: string[];
  validateRow: (row: any, index: number) => ValidationError[];
  importFunction: (data: any[]) => Promise<{ data?: any[]; error?: string }>;
}

interface GenericImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (items: any[]) => void;
  config: ImportConfig;
}

export function GenericImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
  config,
}: GenericImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validData, setValidData] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");

  const downloadTemplate = () => {
    // Criar headers do template
    const headers = [...config.requiredFields, ...config.optionalFields];

    const csvContent = [
      headers.join(";"),
      ...config.templateData.map(row => 
        headers.map(header => `"${row[header] || ""}"`).join(";")
      ),
    ].join("\n");

    // Adicionar BOM para garantir encoding UTF-8
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", config.templateFileName);
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
      
      const headers = firstLine.split(separator).map(h => h.trim().replace(/"/g, ''));
      
      // Verificar se todas as colunas obrigatórias estão presentes
      const missingHeaders = config.requiredFields.filter(field => 
        !headers.some(h => {
          const normalizedHeader = h.toLowerCase();
          const mappedField = config.fieldMappings[normalizedHeader] || normalizedHeader;
          return mappedField === field.toLowerCase();
        })
      );
      
      if (missingHeaders.length > 0) {
        throw new Error(`Colunas obrigatórias faltando: ${missingHeaders.join(", ")}`);
      }

      const rows = [];
      const allErrors: ValidationError[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Pular linhas vazias
        
        const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
        const row: any = { organizacao_id: organizationId };
        
        headers.forEach((header, index) => {
          const normalizedHeader = header.toLowerCase();
          const mappedField = config.fieldMappings[normalizedHeader] || normalizedHeader;
          row[mappedField] = values[index] || "";
        });

        const rowErrors = config.validateRow(row, i - 1);
        allErrors.push(...rowErrors);

        if (rowErrors.length === 0) {
          rows.push(row);
        }
      }

      setValidData(rows);
      setErrors(allErrors);
      
      if (allErrors.length === 0) {
        setStep("preview");
        toast.success(`${rows.length} itens validados com sucesso!`);
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

  const importItems = async () => {
    if (validData.length === 0) return;

    setStep("importing");
    setIsProcessing(true);

    try {
      const result = await config.importFunction(validData);
      
      if ('error' in result && result.error) {
        throw new Error(`Erro ao importar: ${result.error}`);
      }
      
      onSuccess(result.data || []);
      onOpenChange(false);
      
      toast.success(`${result.data?.length || validData.length} itens importados com sucesso!`);
      
      // Reset state
      setFile(null);
      setValidData([]);
      setErrors([]);
      setStep("upload");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar itens");
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
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
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
                <label htmlFor="file-upload" className="block">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all"></div>
                        <div className="relative bg-background border border-border rounded-full p-4 group-hover:border-primary/50 transition-all">
                          <FileSpreadsheet className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-base font-semibold">
                          Arraste seu arquivo aqui ou clique para selecionar
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Formatos aceitos: CSV, XLSX, XLS • Tamanho máximo: 10MB
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>CSV</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Excel</span>
                        </div>
                      </div>
                    </div>
                    
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </div>
                </label>
                
                {file && !isProcessing && (
                  <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setValidData([]);
                        setErrors([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
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
                  Pré-visualização ({validData.length} itens)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {config.requiredFields.slice(0, 5).map(field => (
                          <th key={field} className="text-left p-2 capitalize">
                            {field.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t">
                          {config.requiredFields.slice(0, 5).map(field => (
                            <td key={field} className="p-2">
                              {typeof row[field] === 'string' && row[field].length > 20 
                                ? `${row[field].substring(0, 20)}...`
                                : row[field]?.toString() || "-"
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validData.length > 10 && (
                    <div className="p-2 text-center text-xs text-muted-foreground border-t">
                      ... e mais {validData.length - 10} itens
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={importItems}
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
                        Importar {validData.length} Itens
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
              {config.instructions.map((instruction, index) => (
                <p key={index}>• {instruction}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}