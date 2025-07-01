"use client";

import { ImportExcelDialog } from "../common/import-excel-dialog";
import { createOutrasDespesasBatch } from "@/lib/actions/financial-actions/outras-despesas";
import { toast } from "sonner";

interface OutrasDespesasImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (items: any[]) => void;
}

export function OutrasDespesasImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: OutrasDespesasImportDialogProps) {
  // Dados de exemplo para o template
  const templateData = [
    {
      nome: "IPTU da Propriedade",
      categoria: "TRIBUTARIAS",
    },
    {
      nome: "Retirada dos Sócios",
      categoria: "PRO_LABORE",
    },
    {
      nome: "Gastos com Escritório",
      categoria: "DESPESAS_ADMINISTRATIVAS",
    },
    {
      nome: "Manutenção de Equipamentos",
      categoria: "MANUTENCAO",
    },
    {
      nome: "Seguro da Frota",
      categoria: "SEGUROS",
    },
    {
      nome: "Consultoria Agrícola",
      categoria: "CONSULTORIAS",
    },
    {
      nome: "Conta de Energia Elétrica",
      categoria: "ENERGIA_COMBUSTIVEL",
    },
    {
      nome: "Salários e Encargos",
      categoria: "PESSOAL",
    },
  ];

  // Cabeçalhos das colunas
  const headers = ["nome", "categoria"];

  // Validação de cada linha
  const validateRow = (row: any, index: number) => {
    const errors: any[] = [];

    // Validar campos obrigatórios
    if (!row.nome?.trim()) {
      errors.push({ row: index + 1, field: "nome", message: "Nome/Descrição é obrigatório" });
    }

    if (!row.categoria?.trim()) {
      errors.push({ row: index + 1, field: "categoria", message: "Categoria é obrigatória" });
    }

    // Validar categoria
    const categoriasValidas = [
      "TRIBUTARIAS",
      "PRO_LABORE",
      "OUTRAS_OPERACIONAIS",
      "DESPESAS_ADMINISTRATIVAS",
      "DESPESAS_COMERCIAIS",
      "DESPESAS_FINANCEIRAS",
      "MANUTENCAO",
      "SEGUROS",
      "CONSULTORIAS",
      "DEPRECIACAO",
      "AMORTIZACAO",
      "ARRENDAMENTOS",
      "PESSOAL",
      "ENERGIA_COMBUSTIVEL",
      "COMUNICACAO",
      "VIAGENS",
      "MATERIAL_ESCRITORIO",
      "OUTROS",
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
        descricao: row.nome.trim(), // Mapear nome para descricao
        categoria: row.categoria.toUpperCase(),
        valores_por_ano: {}, // Inicializar vazio
      }));

      // Chamar a action de importação em lote
      const result = await createOutrasDespesasBatch(itemsToInsert);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        onSuccess(result.data);
        toast.success(
          `${result.data.length} despesas importadas com sucesso!`
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
    "Categorias válidas: TRIBUTARIAS, PRO_LABORE, OUTRAS_OPERACIONAIS, DESPESAS_ADMINISTRATIVAS, DESPESAS_COMERCIAIS, DESPESAS_FINANCEIRAS, MANUTENCAO, SEGUROS, CONSULTORIAS, DEPRECIACAO, AMORTIZACAO, ARRENDAMENTOS, PESSOAL, ENERGIA_COMBUSTIVEL, COMUNICACAO, VIAGENS, MATERIAL_ESCRITORIO, OUTROS",
    "Use ponto e vírgula (;) como separador no CSV",
    "Cada categoria (exceto OUTROS) pode ser usada apenas uma vez por organização",
    "Após a importação, você poderá editar os valores por safra/ano de cada despesa",
  ];

  return (
    <ImportExcelDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      organizationId={organizationId}
      onSuccess={onSuccess}
      title="Importar Outras Despesas"
      description="Importe múltiplas despesas operacionais e administrativas de uma vez através de um arquivo CSV."
      templateData={templateData}
      headers={headers}
      validateRow={validateRow}
      processImport={processImport}
      instructions={instructions}
    />
  );
}