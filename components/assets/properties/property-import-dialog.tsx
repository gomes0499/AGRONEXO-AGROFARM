"use client";

import { GenericImportDialog } from "../common/generic-import-dialog";
import { createPropertiesBatch } from "@/lib/actions/property-actions";

interface PropertyImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: (properties: any[]) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function PropertyImportDialog({
  isOpen,
  onOpenChange,
  organizationId,
  onSuccess,
}: PropertyImportDialogProps) {

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNumber = index + 2; // +2 porque começamos da linha 2 (após header)

    // Validações obrigatórias
    if (!row.nome?.trim()) {
      errors.push({
        row: rowNumber,
        field: "nome",
        message: "Nome da propriedade é obrigatório",
      });
    }

    if (!row.tipo?.trim()) {
      errors.push({
        row: rowNumber,
        field: "tipo",
        message: "Tipo da propriedade é obrigatório",
      });
    } else if (!["PROPRIO", "ARRENDADO", "PARCERIA_AGRICOLA"].includes(row.tipo)) {
      errors.push({
        row: rowNumber,
        field: "tipo",
        message: "Tipo deve ser: PROPRIO, ARRENDADO ou PARCERIA_AGRICOLA",
      });
    }

    // Validações condicionais baseadas no tipo
    if (row.tipo === "PROPRIO") {
      const ano = parseInt(row.ano_aquisicao);
      if (!ano || ano < 1900 || ano > new Date().getFullYear() + 5) {
        errors.push({
          row: rowNumber,
          field: "ano_aquisicao",
          message: "Ano de aquisição é obrigatório para propriedades próprias",
        });
      }
    }

    if (row.tipo === "ARRENDADO" || row.tipo === "PARCERIA_AGRICOLA") {
      if (!row.data_inicio?.trim()) {
        errors.push({
          row: rowNumber,
          field: "data_inicio",
          message: "Data de início é obrigatória para propriedades arrendadas/parceria",
        });
      }

      if (!row.data_termino?.trim()) {
        errors.push({
          row: rowNumber,
          field: "data_termino",
          message: "Data de término é obrigatória para propriedades arrendadas/parceria",
        });
      }

      if (!row.tipo_anuencia?.trim()) {
        errors.push({
          row: rowNumber,
          field: "tipo_anuencia",
          message: "Tipo de anuência é obrigatório para propriedades arrendadas/parceria",
        });
      }
    }

    // Validações de valores numéricos
    if (row.area_total && isNaN(parseFloat(row.area_total))) {
      errors.push({
        row: rowNumber,
        field: "area_total",
        message: "Área total deve ser um número válido",
      });
    }

    if (row.area_cultivada && isNaN(parseFloat(row.area_cultivada))) {
      errors.push({
        row: rowNumber,
        field: "area_cultivada",
        message: "Área cultivada deve ser um número válido",
      });
    }

    if (row.valor_atual && isNaN(parseFloat(row.valor_atual.toString().replace(/[R$\s.]/g, '').replace(',', '.')))) {
      errors.push({
        row: rowNumber,
        field: "valor_atual",
        message: "Valor atual deve ser um número válido",
      });
    }

    // Validação lógica: área cultivada <= área total
    if (row.area_total && row.area_cultivada) {
      const areaTotal = parseFloat(row.area_total);
      const areaCultivada = parseFloat(row.area_cultivada);
      if (areaCultivada > areaTotal) {
        errors.push({
          row: rowNumber,
          field: "area_cultivada",
          message: "Área cultivada não pode ser maior que área total",
        });
      }
    }

    return errors;
  };

  const processMonetaryValue = (value: string): number | null => {
    if (!value || value.trim() === "") return null;
    
    const numericValue = parseFloat(
      value.toString()
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '') // Remover pontos (separadores de milhares)
        .replace(',', '.') // Trocar vírgula por ponto decimal
    );
    
    return isNaN(numericValue) ? null : numericValue;
  };

  const importFunction = async (data: any[]) => {
    try {
      // Processar todos os dados
      const processedProperties = data.map(row => ({
        organizacao_id: organizationId,
        nome: row.nome?.trim(),
        tipo: row.tipo?.trim(),
        status: row.status?.trim() || "ATIVA",
        cidade: row.cidade?.trim() || null,
        estado: row.estado?.trim() || null,
        cartorio_registro: row.cartorio_registro?.trim() || null,
        numero_matricula: row.numero_matricula?.trim() || null,
        numero_car: row.numero_car?.trim() || null,
        area_total: row.area_total ? parseFloat(row.area_total) : null,
        area_cultivada: row.area_cultivada ? parseFloat(row.area_cultivada) : null,
        area_pecuaria: row.area_pecuaria ? parseFloat(row.area_pecuaria) : null,
        valor_atual: processMonetaryValue(row.valor_atual),
        valor_terra_nua: processMonetaryValue(row.valor_terra_nua),
        valor_benfeitoria: processMonetaryValue(row.valor_benfeitoria),
        avaliacao_banco: processMonetaryValue(row.avaliacao_banco),
        avaliacao_terceiro: processMonetaryValue(row.avaliacao_terceiro),
        proprietario: row.proprietario?.trim() || null,
        ano_aquisicao: row.ano_aquisicao ? parseInt(row.ano_aquisicao) : null,
        onus: row.onus?.trim() || null,
        tipo_onus: row.tipo_onus?.trim() || null,
        banco_onus: row.banco_onus?.trim() || null,
        valor_onus: processMonetaryValue(row.valor_onus),
        data_inicio: row.data_inicio ? new Date(row.data_inicio).toISOString() : null,
        data_termino: row.data_termino ? new Date(row.data_termino).toISOString() : null,
        tipo_anuencia: row.tipo_anuencia?.trim() || null,
      }));

      // Usar função batch para importar todas de uma vez
      const result = await createPropertiesBatch(processedProperties);
      
      if ('error' in result) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao importar propriedades" };
    }
  };

  const config = {
    title: "Importar Propriedades via Excel/CSV",
    description: "Importe múltiplas propriedades de uma vez usando um arquivo Excel ou CSV",
    templateFileName: "template_propriedades.csv",
    requiredFields: ["nome", "tipo"],
    optionalFields: [
      "status", "cidade", "estado", "cartorio_registro", "numero_matricula", "numero_car",
      "area_total", "area_cultivada", "area_pecuaria", "valor_atual", "valor_terra_nua", 
      "valor_benfeitoria", "avaliacao_banco", "avaliacao_terceiro", "proprietario", 
      "ano_aquisicao", "onus", "tipo_onus", "banco_onus", "valor_onus", 
      "data_inicio", "data_termino", "tipo_anuencia"
    ],
    fieldMappings: {
      "nome": "nome",
      "tipo": "tipo",
      "status": "status",
      "cidade": "cidade",
      "estado": "estado",
      "cartório": "cartorio_registro",
      "cartorio": "cartorio_registro",
      "matrícula": "numero_matricula",
      "matricula": "numero_matricula",
      "car": "numero_car",
      "área_total": "area_total",
      "area_total": "area_total",
      "área_cultivada": "area_cultivada",
      "area_cultivada": "area_cultivada",
      "área_pecuária": "area_pecuaria",
      "area_pecuaria": "area_pecuaria",
      "valor": "valor_atual",
      "valor_atual": "valor_atual",
      "terra_nua": "valor_terra_nua",
      "benfeitoria": "valor_benfeitoria",
      "avaliação_banco": "avaliacao_banco",
      "avaliacao_banco": "avaliacao_banco",
      "avaliação_terceiro": "avaliacao_terceiro",
      "avaliacao_terceiro": "avaliacao_terceiro",
      "proprietário": "proprietario",
      "proprietario": "proprietario",
      "ano": "ano_aquisicao",
      "ano_aquisição": "ano_aquisicao",
      "ano_aquisicao": "ano_aquisicao",
      "ônus": "onus",
      "onus": "onus",
      "tipo_ônus": "tipo_onus",
      "tipo_onus": "tipo_onus",
      "banco": "banco_onus",
      "banco_ônus": "banco_onus",
      "banco_onus": "banco_onus",
      "valor_ônus": "valor_onus",
      "valor_onus": "valor_onus",
      "início": "data_inicio",
      "inicio": "data_inicio",
      "data_início": "data_inicio",
      "data_inicio": "data_inicio",
      "término": "data_termino",
      "termino": "data_termino",
      "data_término": "data_termino",
      "data_termino": "data_termino",
      "anuência": "tipo_anuencia",
      "anuencia": "tipo_anuencia",
      "tipo_anuência": "tipo_anuencia",
      "tipo_anuencia": "tipo_anuencia",
    },
    templateData: [
      {
        nome: "Fazenda Santa Clara",
        tipo: "PROPRIO",
        status: "ATIVA",
        cidade: "Sorriso",
        estado: "MT",
        cartorio_registro: "1º Cartório de Sorriso",
        numero_matricula: "12345",
        numero_car: "MT-5508204-ABCD1234",
        area_total: "1200,50",
        area_cultivada: "1000,00",
        area_pecuaria: "200,50",
        valor_atual: "12.000.000,00",
        valor_terra_nua: "10.000.000,00",
        valor_benfeitoria: "2.000.000,00",
        avaliacao_banco: "11.500.000,00",
        avaliacao_terceiro: "",
        proprietario: "João Silva Santos",
        ano_aquisicao: "2015",
        onus: "",
        tipo_onus: "",
        banco_onus: "",
        valor_onus: "",
        data_inicio: "",
        data_termino: "",
        tipo_anuencia: "",
      },
      {
        nome: "Arrendamento Boa Vista",
        tipo: "ARRENDADO",
        status: "ATIVA",
        cidade: "Lucas do Rio Verde",
        estado: "MT",
        cartorio_registro: "",
        numero_matricula: "",
        numero_car: "",
        area_total: "800,00",
        area_cultivada: "800,00",
        area_pecuaria: "",
        valor_atual: "",
        valor_terra_nua: "",
        valor_benfeitoria: "",
        avaliacao_banco: "",
        avaliacao_terceiro: "",
        proprietario: "Maria dos Santos",
        ano_aquisicao: "",
        onus: "",
        tipo_onus: "",
        banco_onus: "",
        valor_onus: "",
        data_inicio: "2024-03-01",
        data_termino: "2029-02-28",
        tipo_anuencia: "FORMAL",
      },
      {
        nome: "Parceria Tecnológica Norte",
        tipo: "PARCERIA_AGRICOLA",
        status: "ATIVA",
        cidade: "Nova Mutum",
        estado: "MT",
        cartorio_registro: "",
        numero_matricula: "",
        numero_car: "",
        area_total: "500,75",
        area_cultivada: "500,75",
        area_pecuaria: "",
        valor_atual: "",
        valor_terra_nua: "",
        valor_benfeitoria: "",
        avaliacao_banco: "",
        avaliacao_terceiro: "",
        proprietario: "Cooperativa ABC",
        ano_aquisicao: "",
        onus: "",
        tipo_onus: "",
        banco_onus: "",
        valor_onus: "",
        data_inicio: "2024-01-15",
        data_termino: "2026-12-31",
        tipo_anuencia: "CONTRATUAL",
      },
    ],
    instructions: [
      "Baixe o template e preencha com os dados das propriedades",
      "Campos obrigatórios: nome, tipo",
      "Tipos aceitos: PROPRIO, ARRENDADO, PARCERIA_AGRICOLA",
      "Status aceitos: ATIVA, INATIVA, EM_NEGOCIACAO, VENDIDA (padrão: ATIVA)",
      "Para propriedades PROPRIO: ano_aquisicao é obrigatório",
      "Para propriedades ARRENDADO/PARCERIA_AGRICOLA: data_inicio, data_termino e tipo_anuencia são obrigatórios",
      "Datas no formato YYYY-MM-DD (ex: 2024-03-15)",
      "Valores monetários podem usar formato brasileiro (ex: 1.200.000,00) ou decimal",
      "Áreas em hectares com vírgula decimal (ex: 1200,50)",
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