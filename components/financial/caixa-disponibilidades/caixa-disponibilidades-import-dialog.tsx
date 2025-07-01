"use client";

import { ImportExcelDialog } from "../common/import-excel-dialog";
import { createCaixaDisponibilidadesBatch } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { toast } from "sonner";

interface CaixaDisponibilidadesImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (items: any[]) => void;
}

export function CaixaDisponibilidadesImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: CaixaDisponibilidadesImportDialogProps) {
  // Dados de exemplo para o template
  const templateData = [
    {
      nome: "Conta Corrente Banco do Brasil",
      categoria: "CAIXA_BANCOS",
    },
    {
      nome: "Clientes a Receber",
      categoria: "CLIENTES",
    },
    {
      nome: "Adiantamento Fornecedor X",
      categoria: "ADIANTAMENTOS",
    },
    {
      nome: "Estoque de Defensivos",
      categoria: "ESTOQUE_DEFENSIVOS",
    },
    {
      nome: "Estoque de Fertilizantes",
      categoria: "ESTOQUE_FERTILIZANTES",
    },
    {
      nome: "Estoque de Commodities - Soja",
      categoria: "ESTOQUE_COMMODITIES",
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
      "CAIXA_BANCOS",
      "CLIENTES",
      "ADIANTAMENTOS",
      "EMPRESTIMOS",
      "ESTOQUE_DEFENSIVOS",
      "ESTOQUE_FERTILIZANTES",
      "ESTOQUE_ALMOXARIFADO",
      "ESTOQUE_COMMODITIES",
      "ESTOQUE_SEMENTES",
      "SEMOVENTES",
      "ATIVO_BIOLOGICO",
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
      const result = await createCaixaDisponibilidadesBatch(itemsToInsert);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        onSuccess(result.data);
        toast.success(
          `${result.data.length} itens importados com sucesso!`
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
    "Categorias válidas: CAIXA_BANCOS, CLIENTES, ADIANTAMENTOS, EMPRESTIMOS, ESTOQUE_DEFENSIVOS, ESTOQUE_FERTILIZANTES, ESTOQUE_ALMOXARIFADO, ESTOQUE_COMMODITIES, ESTOQUE_SEMENTES, SEMOVENTES, ATIVO_BIOLOGICO",
    "Use ponto e vírgula (;) como separador no CSV",
    "Após a importação, você poderá editar os valores por safra/ano de cada item",
  ];

  return (
    <ImportExcelDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      organizationId={organizationId}
      onSuccess={onSuccess}
      title="Importar Caixa e Disponibilidades"
      description="Importe múltiplos itens de caixa e disponibilidades de uma vez através de um arquivo CSV."
      templateData={templateData}
      headers={headers}
      validateRow={validateRow}
      processImport={processImport}
      instructions={instructions}
    />
  );
}