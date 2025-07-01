"use client";

import { ImportExcelDialog } from "../common/import-excel-dialog";
import { createDividasTerrasBatch } from "@/lib/actions/financial-actions/dividas-terras";

interface DividasTerrasImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (items: any[]) => void;
  properties: any[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function DividasTerrasImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
  properties,
}: DividasTerrasImportDialogProps) {
  // Dados de exemplo para o template
  const templateData = [
    {
      nome: "Fazenda São João",
      credor: "João Silva",
      data_aquisicao: "01/01/2023",
      data_vencimento: "01/01/2033",
      moeda: "BRL",
      valor_total: "2.500.000,00",
      valor_entrada: "500.000,00",
      numero_parcelas: 10,
    },
    {
      nome: "Fazenda Santa Maria",
      credor: "Maria Santos",
      data_aquisicao: "15/06/2022",
      data_vencimento: "15/06/2032",
      moeda: "USD",
      valor_total: "400.000,00",
      valor_entrada: "80.000,00",
      numero_parcelas: 10,
    },
  ];

  const headers = [
    "nome",
    "credor",
    "data_aquisicao",
    "data_vencimento",
    "moeda",
    "valor_total",
    "valor_entrada",
    "numero_parcelas",
  ];

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNumber = index + 2;

    if (!row.nome?.trim()) {
      errors.push({
        row: rowNumber,
        field: "nome",
        message: "Nome da propriedade é obrigatório",
      });
    }

    if (!row.credor?.trim()) {
      errors.push({
        row: rowNumber,
        field: "credor",
        message: "Nome do credor é obrigatório",
      });
    }

    if (!row.data_aquisicao) {
      errors.push({
        row: rowNumber,
        field: "data_aquisicao",
        message: "Data de aquisição é obrigatória",
      });
    }

    if (!row.data_vencimento) {
      errors.push({
        row: rowNumber,
        field: "data_vencimento",
        message: "Data de vencimento é obrigatória",
      });
    }

    if (!row.moeda || !["BRL", "USD"].includes(row.moeda.toUpperCase())) {
      errors.push({
        row: rowNumber,
        field: "moeda",
        message: "Moeda deve ser BRL ou USD",
      });
    }

    const valor = parseFloat(row.valor_total);
    if (!valor || valor <= 0) {
      errors.push({
        row: rowNumber,
        field: "valor_total",
        message: "Valor total deve ser maior que zero",
      });
    }

    return errors;
  };

  const processImport = async (data: any[], organizationId: string) => {
    // Procurar propriedade correspondente pelo nome
    const dividasData = data.map(row => {
      const property = properties.find(p => 
        p.nome.toLowerCase() === row.nome.toLowerCase()
      );
      
      const valorTotal = parseFloat(row.valor_total);
      const valorEntrada = parseFloat(row.valor_entrada) || 0;
      const numeroParcelas = parseInt(row.numero_parcelas) || 1;
      const valorParcela = (valorTotal - valorEntrada) / numeroParcelas;
      
      return {
        organizacao_id: organizationId,
        propriedade_id: property?.id || null,
        credor: row.credor,
        data_aquisicao: row.data_aquisicao,
        data_vencimento: row.data_vencimento,
        moeda: row.moeda.toUpperCase(),
        valor_total: valorTotal,
        fluxo_pagamento_anual: {}, // Pode ser configurado depois
      };
    });

    return await createDividasTerrasBatch(dividasData);
  };

  const instructions = [
    "• Baixe o template e preencha com os dados das dívidas de terras",
    "• Campos obrigatórios: nome, credor, data_aquisicao, data_vencimento, moeda, valor_total",
    "• O nome deve corresponder exatamente a uma propriedade cadastrada",
    "• Datas devem estar no formato DD/MM/AAAA",
    "• Moedas aceitas: BRL, USD",
    "• Valores monetários podem usar formato brasileiro (ex: 2.500.000,00)",
    "• O fluxo de pagamento anual pode ser configurado após a importação",
  ];

  return (
    <ImportExcelDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      organizationId={organizationId}
      onSuccess={onSuccess}
      title="Importar Dívidas de Terras via Excel/CSV"
      description="Importe múltiplas dívidas de aquisição de terras de uma vez"
      templateData={templateData}
      headers={headers}
      validateRow={validateRow}
      processImport={processImport}
      instructions={instructions}
    />
  );
}