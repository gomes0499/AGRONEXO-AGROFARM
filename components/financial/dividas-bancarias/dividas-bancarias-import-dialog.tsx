"use client";

import { ImportExcelDialog } from "../common/import-excel-dialog";
import { createDividasBancariasBatch } from "@/lib/actions/financial-actions/dividas-bancarias";

interface DividasBancariasImportDialogProps {
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

export function DividasBancariasImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: DividasBancariasImportDialogProps) {
  // Dados de exemplo para o template
  const templateData = [
    {
      nome: "Custeio Agrícola 2024",
      modalidade: "CUSTEIO",
      instituicao_bancaria: "BANCO DO BRASIL",
      ano_contratacao: 2024,
      indexador: "CDI",
      taxa_real: "2,5",
      moeda: "BRL",
      valor_total: "1.500.000,00",
    },
    {
      nome: "Financiamento de Maquinário",
      modalidade: "INVESTIMENTOS",
      instituicao_bancaria: "SANTANDER",
      ano_contratacao: 2023,
      indexador: "TJLP",
      taxa_real: "5,5",
      moeda: "BRL",
      valor_total: "800.000,00",
    },
    {
      nome: "Capital de Giro",
      modalidade: "CUSTEIO",
      instituicao_bancaria: "ITAU",
      ano_contratacao: 2024,
      indexador: "SELIC",
      taxa_real: "3,0",
      moeda: "BRL",
      valor_total: "500.000,00",
    },
  ];

  const headers = [
    "nome",
    "modalidade",
    "instituicao_bancaria",
    "ano_contratacao",
    "indexador",
    "taxa_real",
    "moeda",
    "valor_total",
  ];

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNumber = index + 2; // +2 porque começamos da linha 2 (após header)

    // Validações obrigatórias
    if (!row.nome?.trim()) {
      errors.push({
        row: rowNumber,
        field: "nome",
        message: "Nome é obrigatório",
      });
    }

    if (!row.modalidade || !["CUSTEIO", "INVESTIMENTOS"].includes(row.modalidade.toUpperCase())) {
      errors.push({
        row: rowNumber,
        field: "modalidade",
        message: "Modalidade deve ser CUSTEIO ou INVESTIMENTOS",
      });
    }

    if (!row.instituicao_bancaria?.trim()) {
      errors.push({
        row: rowNumber,
        field: "instituicao_bancaria",
        message: "Instituição bancária é obrigatória",
      });
    }

    const ano = parseInt(row.ano_contratacao);
    if (!ano || ano < 2000 || ano > new Date().getFullYear() + 5) {
      errors.push({
        row: rowNumber,
        field: "ano_contratacao",
        message: "Ano de contratação inválido",
      });
    }

    if (!row.moeda || !["BRL", "USD"].includes(row.moeda.toUpperCase())) {
      errors.push({
        row: rowNumber,
        field: "moeda",
        message: "Moeda deve ser BRL ou USD",
      });
    }

    const taxa = parseFloat(row.taxa_real);
    if (isNaN(taxa) || taxa < 0 || taxa > 100) {
      errors.push({
        row: rowNumber,
        field: "taxa_real",
        message: "Taxa real deve ser um número entre 0 e 100",
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
    // Preparar dados para importação em lote
    const dividasData = data.map(row => ({
      organizacao_id: organizationId,
      nome: row.nome,
      modalidade: row.modalidade.toUpperCase(),
      instituicao_bancaria: row.instituicao_bancaria,
      ano_contratacao: parseInt(row.ano_contratacao),
      indexador: row.indexador || "",
      taxa_real: parseFloat(row.taxa_real),
      moeda: row.moeda.toUpperCase(),
      valor_total: parseFloat(row.valor_total),
      fluxo_pagamento_anual: {}, // Inicializar vazio, pode ser editado depois
    }));

    return await createDividasBancariasBatch(dividasData);
  };

  const instructions = [
    "• Baixe o template e preencha com os dados das dívidas bancárias",
    "• Campos obrigatórios: nome, modalidade, instituicao_bancaria, ano_contratacao, taxa_real, moeda, valor_total",
    "• Modalidades aceitas: CUSTEIO, INVESTIMENTOS",
    "• Moedas aceitas: BRL, USD",
    "• Taxa real: informe apenas o número (ex: 2,5 para 2,5%)",
    "• Valores monetários podem usar formato brasileiro (ex: 1.500.000,00) ou decimal (1500000.00)",
    "• O fluxo de pagamento anual pode ser configurado após a importação",
    "• Suporta arquivos CSV com separador vírgula (,) ou ponto e vírgula (;)",
  ];

  return (
    <ImportExcelDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      organizationId={organizationId}
      onSuccess={onSuccess}
      title="Importar Dívidas Bancárias via Excel/CSV"
      description="Importe múltiplas dívidas bancárias de uma vez usando um arquivo Excel ou CSV"
      templateData={templateData}
      headers={headers}
      validateRow={validateRow}
      processImport={processImport}
      instructions={instructions}
    />
  );
}