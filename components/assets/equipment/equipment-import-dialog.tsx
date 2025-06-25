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
import { createEquipmentsBatch } from "@/lib/actions/patrimonio-actions";
import { Equipment } from "@/schemas/patrimonio";

interface EquipmentImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (equipments: Equipment[]) => void;
}

interface ImportRow {
  equipamento: string;
  marca: string;
  modelo: string;
  ano_fabricacao: number;
  quantidade: number;
  valor_unitario: number;
  numero_serie?: string;
  numero_chassi?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function EquipmentImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: EquipmentImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validData, setValidData] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing">("upload");

  const downloadTemplate = () => {
    // Criar dados de exemplo para o template
    const templateData = [
      {
        equipamento: "TRATOR",
        marca: "JOHN_DEERE",
        modelo: "6110J",
        ano_fabricacao: 2023,
        quantidade: 1,
        valor_unitario: "350.000,00",
        numero_serie: "1M06110JXNM123456",
        numero_chassi: "1M06110JXNM123456",
      },
      {
        equipamento: "COLHEITADEIRA",
        marca: "CASE",
        modelo: "8230",
        ano_fabricacao: 2022,
        quantidade: 1,
        valor_unitario: "1.200.000,00",
        numero_serie: "CASE8230XYZ789",
        numero_chassi: "CASE8230XYZ789",
      },
      {
        equipamento: "PULVERIZADOR",
        marca: "JACTO",
        modelo: "UNIPORT 3030",
        ano_fabricacao: 2023,
        quantidade: 2,
        valor_unitario: "180.000,00",
        numero_serie: "JACTO123456",
        numero_chassi: "JACTO123456",
      },
      {
        equipamento: "PLANTADEIRA",
        marca: "SEMEATO",
        modelo: "PHM 2732",
        ano_fabricacao: 2021,
        quantidade: 1,
        valor_unitario: "420.000,00",
        numero_serie: "SEM2732ABC",
        numero_chassi: "SEM2732ABC",
      },
      {
        equipamento: "GRADE_PESADA",
        marca: "MARCHESAN",
        modelo: "GTCR 7000",
        ano_fabricacao: 2020,
        quantidade: 1,
        valor_unitario: "85.000,00",
        numero_serie: "MAR7000XYZ",
        numero_chassi: "MAR7000XYZ",
      },
    ];

    // Converter para CSV com separador padrão brasileiro
    const headers = [
      "equipamento",
      "marca", 
      "modelo",
      "ano_fabricacao",
      "quantidade",
      "valor_unitario",
      "numero_serie",
      "numero_chassi",
    ];

    const csvContent = [
      headers.join(";"),
      ...templateData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row] || ""}"`).join(";")
      ),
    ].join("\n");

    // Adicionar BOM para garantir encoding UTF-8
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "template_equipamentos.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template baixado com sucesso!");
  };

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNumber = index + 2; // +2 porque começamos da linha 2 (após header)

    // Validações obrigatórias
    if (!row.equipamento?.trim()) {
      errors.push({
        row: rowNumber,
        field: "equipamento",
        message: "Equipamento é obrigatório",
      });
    }

    if (!row.marca?.trim()) {
      errors.push({
        row: rowNumber,
        field: "marca",
        message: "Marca é obrigatória",
      });
    }

    const ano = parseInt(row.ano_fabricacao);
    if (!ano || ano < 1900 || ano > new Date().getFullYear() + 5) {
      errors.push({
        row: rowNumber,
        field: "ano_fabricacao",
        message: "Ano de fabricação inválido",
      });
    }

    const quantidade = parseInt(row.quantidade);
    if (!quantidade || quantidade < 1) {
      errors.push({
        row: rowNumber,
        field: "quantidade",
        message: "Quantidade deve ser pelo menos 1",
      });
    }

    const valor = parseFloat(row.valor_unitario);
    if (!valor || valor <= 0) {
      errors.push({
        row: rowNumber,
        field: "valor_unitario",
        message: "Valor unitário deve ser maior que zero",
      });
    }

    return errors;
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
      const requiredHeaders = ["equipamento", "marca", "ano_fabricacao", "quantidade", "valor_unitario"];
      
      // Verificar se todas as colunas obrigatórias estão presentes
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase() === header.toLowerCase())
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
        
        headers.forEach((header, index) => {
          const normalizedHeader = header.toLowerCase();
          let mappedHeader = header;
          
          // Mapear headers case-insensitive
          if (normalizedHeader === 'equipamento') mappedHeader = 'equipamento';
          else if (normalizedHeader === 'marca') mappedHeader = 'marca';
          else if (normalizedHeader === 'modelo') mappedHeader = 'modelo';
          else if (normalizedHeader === 'ano_fabricacao' || normalizedHeader === 'ano') mappedHeader = 'ano_fabricacao';
          else if (normalizedHeader === 'quantidade' || normalizedHeader === 'qtd') mappedHeader = 'quantidade';
          else if (normalizedHeader === 'valor_unitario' || normalizedHeader === 'valor') mappedHeader = 'valor_unitario';
          else if (normalizedHeader === 'numero_serie' || normalizedHeader === 'serie') mappedHeader = 'numero_serie';
          else if (normalizedHeader === 'numero_chassi' || normalizedHeader === 'chassi') mappedHeader = 'numero_chassi';
          
          row[mappedHeader] = values[index] || "";
        });

        // Converter tipos com tratamento de erro
        try {
          row.ano_fabricacao = row.ano_fabricacao ? parseInt(row.ano_fabricacao.toString().replace(/\D/g, '')) : 0;
          row.quantidade = row.quantidade ? parseInt(row.quantidade.toString().replace(/\D/g, '')) : 0;
          
          // Tratar valor monetário (remover R$, pontos, vírgulas etc)
          let valorStr = row.valor_unitario.toString()
            .replace(/[R$\s]/g, '')
            .replace(/\./g, '') // Remover pontos (separadores de milhares)
            .replace(',', '.'); // Trocar vírgula por ponto decimal
          row.valor_unitario = valorStr ? parseFloat(valorStr) : 0;
        } catch (e) {
          console.warn(`Erro ao converter tipos na linha ${i + 1}:`, e);
        }

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
        toast.success(`${rows.length} equipamentos validados com sucesso!`);
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

  const importEquipments = async () => {
    if (validData.length === 0) return;

    setStep("importing");
    setIsProcessing(true);

    try {
      // Preparar dados para importação em lote
      const equipmentsData = validData.map(row => ({
        organizacao_id: organizationId,
        equipamento: row.equipamento,
        marca: row.marca,
        modelo: row.modelo || "",
        ano_fabricacao: row.ano_fabricacao,
        quantidade: row.quantidade,
        valor_unitario: row.valor_unitario,
        numero_serie: row.numero_serie || "",
        numero_chassi: row.numero_chassi || "",
      }));

      const result = await createEquipmentsBatch(equipmentsData);
      
      if ('error' in result) {
        throw new Error(`Erro ao importar equipamentos: ${result.error}`);
      }
      
      onSuccess(result.data);
      onOpenChange(false);
      
      toast.success(`${result.data.length} equipamentos importados com sucesso!`);
      
      // Reset state
      setFile(null);
      setValidData([]);
      setErrors([]);
      setStep("upload");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar equipamentos");
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
          <DialogTitle>Importar Equipamentos via Excel/CSV</DialogTitle>
          <DialogDescription>
            Importe múltiplos equipamentos de uma vez usando um arquivo Excel ou CSV
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
                Baixe o template com exemplos de equipamentos e a estrutura correta de dados.
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
                  Pré-visualização ({validData.length} equipamentos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Equipamento</th>
                        <th className="text-left p-2">Marca</th>
                        <th className="text-left p-2">Modelo</th>
                        <th className="text-left p-2">Ano</th>
                        <th className="text-left p-2">Qtd</th>
                        <th className="text-left p-2">Valor Unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            <Badge variant="secondary" className="text-xs">
                              {row.equipamento}
                            </Badge>
                          </td>
                          <td className="p-2">{row.marca}</td>
                          <td className="p-2">{row.modelo || "-"}</td>
                          <td className="p-2">{row.ano_fabricacao}</td>
                          <td className="p-2">{row.quantidade}</td>
                          <td className="p-2">
                            R$ {row.valor_unitario.toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validData.length > 10 && (
                    <div className="p-2 text-center text-xs text-muted-foreground border-t">
                      ... e mais {validData.length - 10} equipamentos
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={importEquipments}
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
                        Importar {validData.length} Equipamentos
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
                  <p className="text-sm font-medium">Importando equipamentos...</p>
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
              <p>• Baixe o template e preencha com os dados dos equipamentos</p>
              <p>• Campos obrigatórios: equipamento, marca, ano_fabricacao, quantidade, valor_unitario</p>
              <p>• Campos opcionais: modelo, numero_serie, numero_chassi</p>
              <p>• <strong>Equipamentos aceitos:</strong> TRATOR, COLHEITADEIRA, PULVERIZADOR, PLANTADEIRA, GRADE_PESADA, ARADO, CULTIVADOR, SUBSOLADOR, DISTRIBUIDOR_CALCARIO, DISTRIBUIDORA_ADUBO, OUTROS</p>
              <p>• <strong>Marcas aceitas:</strong> JOHN_DEERE, CASE, NEW_HOLLAND, MASSEY_FERGUSON, VALTRA, FENDT, CLAAS, JACTO, SEMEATO, MARCHESAN, BALDAN, TATU, OUTROS</p>
              <p>• Valores monetários podem usar formato brasileiro (ex: 350.000,00) ou decimal (350000.00)</p>
              <p>• O valor total será calculado automaticamente (quantidade × valor_unitario)</p>
              <p>• Suporta arquivos CSV com separador vírgula (,) ou ponto e vírgula (;)</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}