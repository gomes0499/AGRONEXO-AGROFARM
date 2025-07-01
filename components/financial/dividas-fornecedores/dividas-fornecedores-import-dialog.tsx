"use client";

import { ImportExcelDialog } from "../common/import-excel-dialog";
import { createDividasFornecedoresBatch } from "@/lib/actions/financial-actions/dividas-fornecedores";

interface DividasFornecedoresImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (items: any[]) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function DividasFornecedoresImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: DividasFornecedoresImportDialogProps) {
  // Dados de exemplo para o template
  const templateData = [
    {
      nome: "Fertilizantes ABC",
      moeda: "BRL",
      "2024": "150.000,00",
      "2025": "180.000,00",
      "2026": "200.000,00",
    },
    {
      nome: "Sementes XYZ",
      moeda: "USD",
      "2024": "50.000,00",
      "2025": "60.000,00",
      "2026": "65.000,00",
    },
    {
      nome: "Defensivos LTDA",
      moeda: "BRL",
      "2024": "300.000,00",
      "2025": "350.000,00",
      "2026": "400.000,00",
    },
  ];

  const headers = [
    "nome",
    "moeda",
    "2024",
    "2025",
    "2026",
  ];

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNumber = index + 2;

    if (!row.nome?.trim()) {
      errors.push({
        row: rowNumber,
        field: "nome",
        message: "Nome do fornecedor é obrigatório",
      });
    }

    if (!row.moeda || !["BRL", "USD"].includes(row.moeda.toUpperCase())) {
      errors.push({
        row: rowNumber,
        field: "moeda",
        message: "Moeda deve ser BRL ou USD",
      });
    }

    // Validar pelo menos um valor anual
    const years = Object.keys(row).filter(key => /^\d{4}$/.test(key));
    const hasValues = years.some(year => {
      const value = parseFloat(row[year]);
      return value && value > 0;
    });

    if (!hasValues) {
      errors.push({
        row: rowNumber,
        field: "valores",
        message: "Pelo menos um valor anual deve ser informado",
      });
    }

    return errors;
  };

  const processImport = async (data: any[], organizationId: string) => {
    // Preparar dados para importação em lote
    const fornecedoresData = data.map(row => {
      // Extrair valores por ano
      const valoresPorAno: Record<string, number> = {};
      Object.keys(row).forEach(key => {
        if (/^\d{4}$/.test(key)) {
          const value = parseFloat(row[key]);
          if (value && value > 0) {
            valoresPorAno[key] = value;
          }
        }
      });

      return {
        organizacao_id: organizationId,
        nome: row.nome,
        moeda: row.moeda.toUpperCase(),
        valores_por_ano: valoresPorAno,
      };
    });

    return await createDividasFornecedoresBatch(fornecedoresData);
  };

  const instructions = [
    "• Baixe o template e preencha com os dados dos fornecedores",
    "• Campos obrigatórios: nome, moeda",
    "• Adicione colunas com anos (ex: 2024, 2025, 2026) e seus respectivos valores",
    "• Moedas aceitas: BRL, USD",
    "• Valores monetários podem usar formato brasileiro (ex: 150.000,00) ou decimal (150000.00)",
    "• Deixe vazio ou 0 para anos sem dívida",
    "• Você pode adicionar mais anos conforme necessário",
  ];

  return (
    <ImportExcelDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      organizationId={organizationId}
      onSuccess={onSuccess}
      title="Importar Dívidas de Fornecedores via Excel/CSV"
      description="Importe múltiplas dívidas de fornecedores de uma vez"
      templateData={templateData}
      headers={headers}
      validateRow={validateRow}
      processImport={processImport}
      instructions={instructions}
    />
  );
}