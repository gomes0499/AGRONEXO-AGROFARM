"use client";

import { GenericImportDialog } from "../common/generic-import-dialog";
import { createLandPlansBatch } from "@/lib/actions/patrimonio-actions";

interface LandAcquisitionImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (landPlans: any[]) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const VALID_TYPES = [
  "COMPRA",
  "ARRENDAMENTO_LONGO_PRAZO",
  "PARCERIA",
  "OUTROS"
];

export function LandAcquisitionImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: LandAcquisitionImportDialogProps) {

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNumber = index + 2; // +2 porque começamos da linha 2 (após header)

    // Validações obrigatórias
    if (!row.nome_fazenda?.trim()) {
      errors.push({
        row: rowNumber,
        field: "nome_fazenda",
        message: "Nome da fazenda é obrigatório",
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
        message: `Tipo deve ser uma das: ${VALID_TYPES.join(", ")}`,
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

    const hectares = parseFloat(row.hectares);
    if (!hectares || hectares <= 0) {
      errors.push({
        row: rowNumber,
        field: "hectares",
        message: "Hectares deve ser um número maior que zero",
      });
    }

    const sacas = parseFloat(row.sacas);
    if (!sacas || sacas <= 0) {
      errors.push({
        row: rowNumber,
        field: "sacas",
        message: "Sacas deve ser um número maior que zero",
      });
    }

    const valorTotal = parseFloat(
      row.valor_total?.toString()
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );
    if (!valorTotal || valorTotal <= 0) {
      errors.push({
        row: rowNumber,
        field: "valor_total",
        message: "Valor total deve ser maior que zero",
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
      const processedLandPlans = data.map(row => {
        const hectares = parseFloat(row.hectares) || 0;
        const sacas = parseFloat(row.sacas) || 0;
        const totalSacas = hectares * sacas;

        return {
          organizacao_id: organizationId,
          nome_fazenda: row.nome_fazenda?.trim(),
          tipo: row.tipo?.trim() || "COMPRA",
          ano: row.ano ? parseInt(row.ano) : new Date().getFullYear(),
          hectares: hectares,
          sacas: sacas,
          total_sacas: totalSacas,
          valor_total: processMonetaryValue(row.valor_total),
          safra_id: row.safra_id?.trim() || null,
        };
      });

      // Usar função batch para importar todos de uma vez
      const result = await createLandPlansBatch(processedLandPlans);
      
      if ('error' in result) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao importar aquisições de terras" };
    }
  };

  const config = {
    title: "Importar Aquisições de Terras via Excel/CSV",
    description: "Importe múltiplos planos de aquisição de terras de uma vez usando um arquivo Excel ou CSV",
    templateFileName: "template_aquisicao_terras.csv",
    requiredFields: ["nome_fazenda", "tipo", "ano", "hectares", "sacas", "valor_total"],
    optionalFields: ["safra_id"],
    fieldMappings: {
      "nome": "nome_fazenda",
      "nome_fazenda": "nome_fazenda",
      "fazenda": "nome_fazenda",
      "propriedade": "nome_fazenda",
      "tipo": "tipo",
      "ano": "ano",
      "hectares": "hectares",
      "ha": "hectares",
      "área": "hectares",
      "area": "hectares",
      "sacas": "sacas",
      "saca": "sacas",
      "valor_total": "valor_total",
      "valor": "valor_total",
      "preço": "valor_total",
      "preco": "valor_total",
      "safra": "safra_id",
      "safra_id": "safra_id",
    },
    templateData: [
      {
        nome_fazenda: "Fazenda Boa Vista",
        tipo: "COMPRA",
        ano: "2025",
        hectares: "500,00",
        sacas: "120,00",
        valor_total: "6.000.000,00",
        safra_id: "",
      },
      {
        nome_fazenda: "Área Expansão Norte",
        tipo: "COMPRA",
        ano: "2026",
        hectares: "300,50",
        sacas: "100,00",
        valor_total: "3.005.000,00",
        safra_id: "",
      },
      {
        nome_fazenda: "Arrendamento Serra Alta",
        tipo: "ARRENDAMENTO_LONGO_PRAZO",
        ano: "2025",
        hectares: "800,00",
        sacas: "150,00",
        valor_total: "12.000.000,00",
        safra_id: "",
      },
      {
        nome_fazenda: "Parceria Cooperativa ABC",
        tipo: "PARCERIA",
        ano: "2025",
        hectares: "1200,00",
        sacas: "80,00",
        valor_total: "9.600.000,00",
        safra_id: "",
      },
    ],
    instructions: [
      "Baixe o template e preencha com os dados das aquisições de terras",
      "Campos obrigatórios: nome_fazenda, tipo, ano, hectares, sacas, valor_total",
      "Tipos aceitos: COMPRA, ARRENDAMENTO_LONGO_PRAZO, PARCERIA, OUTROS",
      "Ano deve estar entre 2000 e " + (new Date().getFullYear() + 50),
      "Hectares e sacas devem ser números maiores que zero",
      "Valores monetários podem usar formato brasileiro (ex: 6.000.000,00) ou decimal",
      "Sacas se refere ao preço por hectare (sacas/ha)",
      "O total de sacas será calculado automaticamente (hectares × sacas)",
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