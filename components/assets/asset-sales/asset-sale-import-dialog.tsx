"use client";

import { GenericImportDialog } from "../common/generic-import-dialog";
import { createAssetSalesBatch } from "@/lib/actions/patrimonio-actions";

interface AssetSaleImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (assetSales: any[]) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const VALID_CATEGORIES = [
  "PROPRIEDADE_RURAL",
  "EQUIPAMENTO",
  "TRATOR_COLHEITADEIRA_PULVERIZADOR", 
  "AERONAVE",
  "VEICULO",
  "BENFEITORIA",
  "INVESTIMENTO_SOLO",
  "OUTROS"
];

export function AssetSaleImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: AssetSaleImportDialogProps) {

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

    // Validação de data de venda (opcional)
    if (row.data_venda && row.data_venda.trim()) {
      const dataVenda = new Date(row.data_venda);
      if (isNaN(dataVenda.getTime())) {
        errors.push({
          row: rowNumber,
          field: "data_venda",
          message: "Data de venda deve estar no formato YYYY-MM-DD",
        });
      }
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
      const processedAssetSales = data.map(row => ({
        organizacao_id: organizationId,
        categoria: row.categoria?.trim(),
        ano: row.ano ? parseInt(row.ano) : new Date().getFullYear(),
        quantidade: row.quantidade ? parseInt(row.quantidade) : 1,
        valor_unitario: processMonetaryValue(row.valor_unitario),
        data_venda: row.data_venda?.trim() ? new Date(row.data_venda).toISOString() : null,
        descricao: row.descricao?.trim() || null,
        observacoes: row.observacoes?.trim() || null,
      }));

      // Usar função batch para importar todos de uma vez
      const result = await createAssetSalesBatch(processedAssetSales);
      
      if ('error' in result) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao importar vendas de ativos" };
    }
  };

  const config = {
    title: "Importar Vendas de Ativos via Excel/CSV",
    description: "Importe múltiplas vendas de ativos de uma vez usando um arquivo Excel ou CSV",
    templateFileName: "template_vendas_ativos.csv",
    requiredFields: ["categoria", "ano", "quantidade", "valor_unitario"],
    optionalFields: ["data_venda", "descricao", "observacoes"],
    fieldMappings: {
      "categoria": "categoria",
      "ano": "ano",
      "quantidade": "quantidade",
      "qtd": "quantidade",
      "valor_unitário": "valor_unitario",
      "valor_unitario": "valor_unitario",
      "valor": "valor_unitario",
      "preço": "valor_unitario",
      "preco": "valor_unitario",
      "data": "data_venda",
      "data_venda": "data_venda",
      "descrição": "descricao",
      "descricao": "descricao",
      "observações": "observacoes",
      "observacoes": "observacoes",
    },
    templateData: [
      {
        categoria: "PROPRIEDADE_RURAL",
        ano: "2024",
        quantidade: "1",
        valor_unitario: "12.000.000,00",
        data_venda: "2024-02-10",
        descricao: "Fazenda São José - 500 hectares",
        observacoes: "Venda para expansão em outra região",
      },
      {
        categoria: "EQUIPAMENTO",
        ano: "2024",
        quantidade: "1",
        valor_unitario: "25.000,00",
        data_venda: "2024-03-15",
        descricao: "Trator antigo modelo 2015",
        observacoes: "Vendido para produtor vizinho",
      },
      {
        categoria: "VEICULO",
        ano: "2024",
        quantidade: "2",
        valor_unitario: "35.000,00",
        data_venda: "2024-05-20",
        descricao: "Caminhão F-4000 e pickup",
        observacoes: "Venda à vista",
      },
      {
        categoria: "TRATOR_COLHEITADEIRA_PULVERIZADOR",
        ano: "2025", // Planejado
        quantidade: "1",
        valor_unitario: "450.000,00",
        data_venda: "", // Sem data = planejado
        descricao: "Colheitadeira Case 2020",
        observacoes: "Venda planejada para renovação de frota",
      },
      {
        categoria: "BENFEITORIA",
        ano: "2024",
        quantidade: "1",
        valor_unitario: "80.000,00",
        data_venda: "2024-08-10",
        descricao: "Galpão de armazenamento 500m²",
        observacoes: "Demolição planejada da área",
      },
    ],
    instructions: [
      "Baixe o template e preencha com os dados das vendas de ativos",
      "Campos obrigatórios: categoria, ano, quantidade, valor_unitario",
      "Categorias aceitas: PROPRIEDADE_RURAL, EQUIPAMENTO, TRATOR_COLHEITADEIRA_PULVERIZADOR, AERONAVE, VEICULO, BENFEITORIA, INVESTIMENTO_SOLO, OUTROS",
      "Ano deve estar entre 2000 e " + (new Date().getFullYear() + 50),
      "Quantidade deve ser um número inteiro maior que 0",
      "Valores monetários podem usar formato brasileiro (ex: 25.000,00) ou decimal",
      "Data de venda no formato YYYY-MM-DD (ex: 2024-03-15) - deixe vazio para vendas planejadas",
      "Campos descricao e observacoes são opcionais mas recomendados",
      "O valor total será calculado automaticamente (quantidade × valor_unitario)",
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