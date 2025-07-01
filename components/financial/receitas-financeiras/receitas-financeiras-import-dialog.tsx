"use client";

import { ImportExcelDialog } from "../common/import-excel-dialog";
import { createReceitasFinanceirasBatch } from "@/lib/actions/financial-actions/receitas-financeiras-actions";
import { toast } from "sonner";

interface ReceitasFinanceirasImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (items: any[]) => void;
  safras: Array<{ id: string; nome: string }>;
}

export function ReceitasFinanceirasImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
  safras,
}: ReceitasFinanceirasImportDialogProps) {
  // Dados de exemplo para o template
  const templateData = [
    {
      descricao: "Rendimento Aplicação CDB",
      categoria: "JUROS_APLICACOES",
      moeda: "BRL",
      valor: "5000",
      safra: safras[0]?.nome || "2024/25",
      data: "01/01/2024",
    },
    {
      descricao: "Rendimento Fundo de Investimento",
      categoria: "RENDIMENTOS_FUNDOS",
      moeda: "BRL",
      valor: "10000",
      safra: safras[0]?.nome || "2024/25",
      data: "15/01/2024",
    },
    {
      descricao: "Desconto Antecipação Pagamento",
      categoria: "DESCONTOS_OBTIDOS",
      moeda: "BRL",
      valor: "2500",
      safra: safras[0]?.nome || "2024/25",
      data: "20/01/2024",
    },
    {
      descricao: "Ganho com Variação Cambial",
      categoria: "VARIACAO_CAMBIAL",
      moeda: "USD",
      valor: "1000",
      safra: safras[0]?.nome || "2024/25",
      data: "25/01/2024",
    },
  ];

  // Cabeçalhos das colunas
  const headers = ["descricao", "categoria", "moeda", "valor", "safra", "data"];

  // Validação de cada linha
  const validateRow = (row: any, index: number) => {
    const errors: any[] = [];

    // Validar campos obrigatórios
    if (!row.descricao?.trim()) {
      errors.push({ row: index + 1, field: "descricao", message: "Descrição é obrigatória" });
    }

    if (!row.categoria?.trim()) {
      errors.push({ row: index + 1, field: "categoria", message: "Categoria é obrigatória" });
    }

    // Validar categoria
    const categoriasValidas = [
      "JUROS_APLICACOES",
      "RENDIMENTOS_FUNDOS",
      "DESCONTOS_OBTIDOS",
      "VARIACAO_CAMBIAL",
      "HEDGE",
      "DIVIDENDOS",
      "OUTRAS_RECEITAS",
    ];

    if (row.categoria && !categoriasValidas.includes(row.categoria.toUpperCase())) {
      errors.push({
        row: index + 1,
        field: "categoria",
        message: `Categoria inválida. Use: ${categoriasValidas.join(", ")}`
      });
    }

    // Validar moeda
    if (row.moeda && !["BRL", "USD"].includes(row.moeda.toUpperCase())) {
      errors.push({ row: index + 1, field: "moeda", message: "Moeda deve ser BRL ou USD" });
    }

    // Validar valor
    const valor = parseFloat(
      String(row.valor || "0")
        .replace(/\./g, "")
        .replace(",", ".")
    );
    if (isNaN(valor) || valor < 0) {
      errors.push({ row: index + 1, field: "valor", message: "Valor deve ser um número positivo" });
    }

    // Validar data (formato DD/MM/AAAA)
    if (row.data) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(row.data)) {
        errors.push({ row: index + 1, field: "data", message: "Data deve estar no formato DD/MM/AAAA" });
      }
    }

    return errors;
  };

  // Processar importação
  const processImport = async (data: any[], organizationId: string) => {
    try {
      // Preparar dados para inserção
      const itemsToInsert = data.map((row) => {
        // Converter valor para número
        const valor = parseFloat(
          String(row.valor || "0")
            .replace(/\./g, "")
            .replace(",", ".")
        );

        // Converter data DD/MM/AAAA para ISO
        let dataReceita = new Date().toISOString();
        if (row.data) {
          const [dia, mes, ano] = row.data.split("/");
          if (dia && mes && ano) {
            dataReceita = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).toISOString();
          }
        }

        // Encontrar safra_id pelo nome
        let safraId = undefined;
        if (row.safra) {
          const safra = safras.find(s => s.nome === row.safra);
          if (safra) {
            safraId = safra.id;
          }
        }

        return {
          organizacao_id: organizationId,
          categoria: row.categoria.toUpperCase(),
          descricao: row.descricao.trim(),
          moeda: (row.moeda || "BRL").toUpperCase(),
          valor: valor,
          safra_id: safraId,
          data_receita: dataReceita,
        };
      });

      // Chamar a action de importação em lote
      const result = await createReceitasFinanceirasBatch(itemsToInsert);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        onSuccess(result.data);
        toast.success(
          `${result.data.length} receitas financeiras importadas com sucesso!`
        );
      }
    } catch (error) {
      console.error("Erro ao processar importação:", error);
      throw error;
    }
  };

  // Instruções para o usuário
  const instructions = [
    "O arquivo deve conter as colunas: descricao, categoria, moeda, valor, safra, data",
    "Categorias válidas: JUROS_APLICACOES, RENDIMENTOS_FUNDOS, DESCONTOS_OBTIDOS, VARIACAO_CAMBIAL, HEDGE, DIVIDENDOS, OUTRAS_RECEITAS",
    "Moedas válidas: BRL, USD",
    "Valores devem usar formato brasileiro: 1.500.000,00",
    "Datas devem estar no formato DD/MM/AAAA",
    `Safras disponíveis: ${safras.map(s => s.nome).join(", ")}`,
    "Use ponto e vírgula (;) como separador no CSV",
  ];

  return (
    <ImportExcelDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      organizationId={organizationId}
      onSuccess={onSuccess}
      title="Importar Receitas Financeiras"
      description="Importe múltiplas receitas financeiras de uma vez através de um arquivo CSV."
      templateData={templateData}
      headers={headers}
      validateRow={validateRow}
      processImport={processImport}
      instructions={instructions}
    />
  );
}