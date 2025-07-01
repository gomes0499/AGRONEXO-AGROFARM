"use client";

import { ImportExcelDialog } from "../common/import-excel-dialog";
import { createFinanceirasBatch } from "@/lib/actions/financial-actions/financeiras";
import { toast } from "sonner";

interface FinanceirasImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (items: any[]) => void;
}

export function FinanceirasImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: FinanceirasImportDialogProps) {
  // Dados de exemplo para o template
  const templateData = [
    {
      nome: "Linha de Crédito Rural - Banco do Brasil",
      categoria: "NOVAS_LINHAS_CREDITO",
    },
    {
      nome: "Refinanciamento Dívida - Santander",
      categoria: "REFINANCIAMENTO_BANCOS",
    },
    {
      nome: "Refinanciamento Cliente ABC",
      categoria: "REFINANCIAMENTO_CLIENTES",
    },
    {
      nome: "Outros Créditos - Cooperativa",
      categoria: "OUTROS_CREDITOS",
    },
  ];

  // Cabeçalhos das colunas
  const headers = ["nome", "categoria"];

  // Validação de cada linha
  const validateRow = (row: any, index: number) => {
    const errors: any[] = [];

    // Validar campos obrigatórios
    if (!row.nome?.trim()) {
      errors.push({ row: index + 1, field: "nome", message: "Nome é obrigatório" });
    }

    if (!row.categoria?.trim()) {
      errors.push({ row: index + 1, field: "categoria", message: "Categoria é obrigatória" });
    }

    // Validar categoria
    const categoriasValidas = [
      "OUTROS_CREDITOS",
      "REFINANCIAMENTO_BANCOS",
      "REFINANCIAMENTO_CLIENTES",
      "NOVAS_LINHAS_CREDITO",
    ];

    if (row.categoria && !categoriasValidas.includes(row.categoria.toUpperCase())) {
      errors.push({
        row: index + 1,
        field: "categoria",
        message: `Categoria inválida. Use: ${categoriasValidas.join(", ")}`
      });
    }

    return errors;
  };

  // Processar importação
  const processImport = async (data: any[], organizationId: string) => {
    try {
      // Preparar dados para inserção
      const itemsToInsert = data.map((row) => ({
        organizacao_id: organizationId,
        nome: row.nome.trim(),
        categoria: row.categoria.toUpperCase(),
        valores_por_ano: {}, // Inicializar vazio
      }));

      // Chamar a action de importação em lote
      const result = await createFinanceirasBatch(itemsToInsert);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        onSuccess(result.data);
        toast.success(
          `${result.data.length} operações financeiras importadas com sucesso!`
        );
      }
    } catch (error) {
      console.error("Erro ao processar importação:", error);
      throw error;
    }
  };

  // Instruções para o usuário
  const instructions = [
    "O arquivo deve conter as colunas: nome, categoria",
    "Categorias válidas: OUTROS_CREDITOS, REFINANCIAMENTO_BANCOS, REFINANCIAMENTO_CLIENTES, NOVAS_LINHAS_CREDITO",
    "Use ponto e vírgula (;) como separador no CSV",
    "Após a importação, você poderá editar os valores por safra/ano de cada operação",
  ];

  return (
    <ImportExcelDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      organizationId={organizationId}
      onSuccess={onSuccess}
      title="Importar Operações Financeiras"
      description="Importe múltiplas operações financeiras de uma vez através de um arquivo CSV."
      templateData={templateData}
      headers={headers}
      validateRow={validateRow}
      processImport={processImport}
      instructions={instructions}
    />
  );
}