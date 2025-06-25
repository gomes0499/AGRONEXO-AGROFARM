"use client";

import { GenericImportDialog } from "../common/generic-import-dialog";
import { createInvestmentsBatch } from "@/lib/actions/patrimonio-actions";

interface InvestmentImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (investments: any[]) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const VALID_CATEGORIES = [
  "EQUIPAMENTO",
  "TRATOR_COLHEITADEIRA_PULVERIZADOR", 
  "AERONAVE",
  "VEICULO",
  "BENFEITORIA",
  "INVESTIMENTO_SOLO"
];

const VALID_TYPES = ["REALIZADO", "PLANEJADO"];

export function InvestmentImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: InvestmentImportDialogProps) {

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNumber = index + 2; // +2 porque começamos da linha 2 (após header)

    // Validações obrigatórias
    if (!row.categoria?.trim()) {
      errors.push({
        row: rowNumber,
        field: "categoria",
        message: "Categoria é obrigatória",
      });
    } else if (!VALID_CATEGORIES.includes(row.categoria.trim())) {
      errors.push({
        row: rowNumber,
        field: "categoria",
        message: `Categoria deve ser uma das: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    if (!row.tipo?.trim()) {
      errors.push({
        row: rowNumber,
        field: "tipo",
        message: "Tipo é obrigatório",
      });
    } else if (!VALID_TYPES.includes(row.tipo.trim())) {
      errors.push({
        row: rowNumber,
        field: "tipo",
        message: "Tipo deve ser: REALIZADO ou PLANEJADO",
      });
    }

    // Validações numéricas
    const ano = parseInt(row.ano);
    if (!ano || ano < 2000 || ano > new Date().getFullYear() + 50) {
      errors.push({
        row: rowNumber,
        field: "ano",
        message: "Ano deve estar entre 2000 e " + (new Date().getFullYear() + 50),
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

    const valorUnitario = parseFloat(
      row.valor_unitario?.toString()
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );
    if (!valorUnitario || valorUnitario <= 0) {
      errors.push({
        row: rowNumber,
        field: "valor_unitario",
        message: "Valor unitário deve ser maior que zero",
      });
    }

    return errors;
  };

  const processMonetaryValue = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    
    const numericValue = parseFloat(
      value.toString()
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '') // Remover pontos (separadores de milhares)
        .replace(',', '.') // Trocar vírgula por ponto decimal
    );
    
    return isNaN(numericValue) ? 0 : numericValue;
  };

  const importFunction = async (data: any[]) => {
    try {
      // Processar todos os dados
      const processedInvestments = data.map(row => ({
        organizacao_id: organizationId,
        categoria: row.categoria?.trim(),
        tipo: row.tipo?.trim() || "REALIZADO",
        ano: row.ano ? parseInt(row.ano) : new Date().getFullYear(),
        quantidade: row.quantidade ? parseInt(row.quantidade) : 1,
        valor_unitario: processMonetaryValue(row.valor_unitario),
      }));

      // Usar função batch para importar todos de uma vez
      const result = await createInvestmentsBatch(processedInvestments);
      
      if ('error' in result) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao importar investimentos" };
    }
  };

  const config = {
    title: "Importar Investimentos via Excel/CSV",
    description: "Importe múltiplos investimentos de uma vez usando um arquivo Excel ou CSV",
    templateFileName: "template_investimentos.csv",
    requiredFields: ["categoria", "tipo", "ano", "quantidade", "valor_unitario"],
    optionalFields: ["safra_id"],
    fieldMappings: {
      "categoria": "categoria",
      "tipo": "tipo", 
      "ano": "ano",
      "quantidade": "quantidade",
      "qtd": "quantidade",
      "valor_unitário": "valor_unitario",
      "valor_unitario": "valor_unitario",
      "valor": "valor_unitario",
      "preço": "valor_unitario",
      "preco": "valor_unitario",
      "safra": "safra_id",
      "safra_id": "safra_id",
    },
    templateData: [
      {
        categoria: "EQUIPAMENTO",
        tipo: "REALIZADO",
        ano: "2024",
        quantidade: "2",
        valor_unitario: "45.000,00",
        safra_id: "",
      },
      {
        categoria: "TRATOR_COLHEITADEIRA_PULVERIZADOR",
        tipo: "REALIZADO", 
        ano: "2023",
        quantidade: "1",
        valor_unitario: "850.000,00",
        safra_id: "",
      },
      {
        categoria: "BENFEITORIA",
        tipo: "PLANEJADO",
        ano: "2025",
        quantidade: "1",
        valor_unitario: "120.000,00",
        safra_id: "",
      },
      {
        categoria: "VEICULO",
        tipo: "REALIZADO",
        ano: "2024",
        quantidade: "3",
        valor_unitario: "75.000,00",
        safra_id: "",
      },
      {
        categoria: "INVESTIMENTO_SOLO",
        tipo: "PLANEJADO",
        ano: "2025",
        quantidade: "500", // hectares
        valor_unitario: "2.500,00", // por hectare
        safra_id: "",
      },
    ],
    instructions: [
      "Baixe o template e preencha com os dados dos investimentos",
      "Campos obrigatórios: categoria, tipo, ano, quantidade, valor_unitario",
      "Categorias aceitas: EQUIPAMENTO, TRATOR_COLHEITADEIRA_PULVERIZADOR, AERONAVE, VEICULO, BENFEITORIA, INVESTIMENTO_SOLO",
      "Tipos aceitos: REALIZADO, PLANEJADO",
      "Ano deve estar entre 2000 e " + (new Date().getFullYear() + 50),
      "Quantidade deve ser um número inteiro maior que 0",
      "Valores monetários podem usar formato brasileiro (ex: 45.000,00) ou decimal",
      "O valor total será calculado automaticamente (quantidade × valor_unitario)",
      "Campo safra_id é opcional - deixe vazio se não souber o ID da safra",
      "Suporta arquivos CSV com separador vírgula (,) ou ponto e vírgula (;)",
    ],
    validateRow,
    importFunction,
  };

  return (
    <GenericImportDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      organizationId={organizationId}
      onSuccess={onSuccess}
      config={config}
    />
  );
}