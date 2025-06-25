"use client";

import { GenericImportDialog } from "../assets/common/generic-import-dialog";
import { createImprovementsBatch } from "@/lib/actions/property-actions";

interface ImprovementImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  propertyId: string;
  onSuccess: (improvements: any[]) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function ImprovementImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  propertyId,
  onSuccess,
}: ImprovementImportDialogProps) {

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNumber = index + 2; // +2 porque começamos da linha 2 (após header)

    // Validações obrigatórias
    if (!row.descricao?.trim()) {
      errors.push({
        row: rowNumber,
        field: "descricao",
        message: "Descrição é obrigatória",
      });
    }

    // Validações numéricas
    const valor = parseFloat(
      row.valor?.toString()
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );
    if (isNaN(valor) || valor < 0) {
      errors.push({
        row: rowNumber,
        field: "valor",
        message: "Valor deve ser um número maior ou igual a zero",
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
      const processedImprovements = data.map(row => ({
        organizacao_id: organizationId,
        propriedade_id: propertyId,
        descricao: row.descricao?.trim(),
        dimensoes: row.dimensoes?.trim() || null,
        valor: processMonetaryValue(row.valor),
      }));

      // Usar função batch para importar todos de uma vez
      const result = await createImprovementsBatch(processedImprovements);
      
      if ('error' in result) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao importar benfeitorias" };
    }
  };

  const config = {
    title: "Importar Benfeitorias via Excel/CSV",
    description: "Importe múltiplas benfeitorias de uma vez usando um arquivo Excel ou CSV",
    templateFileName: "template_benfeitorias.csv",
    requiredFields: ["descricao", "valor"],
    optionalFields: ["dimensoes"],
    fieldMappings: {
      "descrição": "descricao",
      "descricao": "descricao",
      "nome": "descricao",
      "benfeitoria": "descricao",
      "melhoria": "descricao",
      "dimensões": "dimensoes",
      "dimensoes": "dimensoes",
      "tamanho": "dimensoes",
      "area": "dimensoes",
      "área": "dimensoes",
      "medidas": "dimensoes",
      "valor": "valor",
      "preço": "valor",
      "preco": "valor",
      "custo": "valor",
      "investimento": "valor",
    },
    templateData: [
      {
        descricao: "Galpão de Máquinas",
        dimensoes: "1.200 m² (40m x 30m)",
        valor: "850.000,00",
      },
      {
        descricao: "Silo Graneleiro",
        dimensoes: "Capacidade 5.000 toneladas",
        valor: "1.200.000,00",
      },
      {
        descricao: "Casa Sede",
        dimensoes: "350 m² construídos",
        valor: "680.000,00",
      },
      {
        descricao: "Barracão de Insumos",
        dimensoes: "800 m² (20m x 40m)",
        valor: "450.000,00",
      },
      {
        descricao: "Sistema de Irrigação Pivô Central",
        dimensoes: "100 hectares de cobertura",
        valor: "920.000,00",
      },
      {
        descricao: "Curral com Brete",
        dimensoes: "2.000 m² com 10 divisões",
        valor: "380.000,00",
      },
      {
        descricao: "Poço Artesiano",
        dimensoes: "180m profundidade - 50m³/hora",
        valor: "120.000,00",
      },
      {
        descricao: "Cercas Divisórias",
        dimensoes: "15 km de extensão",
        valor: "180.000,00",
      },
    ],
    instructions: [
      "Baixe o template e preencha com os dados das benfeitorias",
      "Campos obrigatórios: descricao, valor",
      "Campo opcional: dimensoes (medidas, tamanho ou capacidade)",
      "Valores monetários podem usar formato brasileiro (ex: 850.000,00) ou decimal",
      "A descrição deve identificar claramente a benfeitoria",
      "Dimensões podem incluir área, capacidade, medidas ou qualquer informação relevante",
      "Suporta arquivos CSV com separador vírgula (,) ou ponto e vírgula (;)",
      "Todas as benfeitorias serão vinculadas à propriedade selecionada",
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