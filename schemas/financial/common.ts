import { z } from "zod";

// Enums para o módulo financeiro
export const debtModalityEnum = z.enum(["CUSTEIO", "INVESTIMENTOS"]);
export type DebtModalityType = z.infer<typeof debtModalityEnum>;

export const currencyEnum = z.enum(["BRL", "USD", "EUR", "SOJA"]);
export type CurrencyType = z.infer<typeof currencyEnum>;

// Financial institution types (must match database types.sql)
export const financialInstitutionTypeEnum = z.enum(["BANCO", "TRADING", "OUTROS"]);
export type FinancialInstitutionType = z.infer<typeof financialInstitutionTypeEnum>;

// Debt status enum
export const debtStatusEnum = z.enum(["ATIVA", "PENDENTE", "EM_DIA", "ATRASADA", "VENCIDA", "QUITADA", "RENEGOCIADA", "CANCELADA"]);
export type DebtStatusType = z.infer<typeof debtStatusEnum>;

export const liquidityFactorEnum = z.enum([
  "CAIXA", "BANCO", "INVESTIMENTO", "APLICACAO", 
  "CONTA_CORRENTE", "CONTA_POUPANCA", "CDB", "LCI", "LCA"
]);
export type LiquidityFactorType = z.infer<typeof liquidityFactorEnum>;

export const inventoryTypeEnum = z.enum([
  "FERTILIZANTES", "DEFENSIVOS", "ALMOXARIFADO", "SEMENTES",
  "MAQUINAS_E_EQUIPAMENTOS", "COMBUSTIVEIS", "PECAS_E_ACESSORIOS",
  "MEDICAMENTOS_VETERINARIOS", "RACAO_ANIMAL", "OUTROS"
]);
export type InventoryType = z.infer<typeof inventoryTypeEnum>;

// Commodity types (must match database types.sql exactly)
export const commodityTypeEnum = z.enum([
  "SOJA", "ALGODAO", "MILHO", "ARROZ", "SORGO", "CAFE", "CACAU", 
  "SOJA_CANA", "TRIGO", "FEIJAO", "GIRASSOL", "AMENDOIM", 
  "BOI_GORDO", "BEZERRO", "VACA_GORDA", "OUTROS"
]);
export type CommodityType = z.infer<typeof commodityTypeEnum>;

// Categorias de fornecedores (deve corresponder exatamente às categorias na tabela dividas_fornecedores)
export const categoriaFornecedorEnum = z.enum([
  "FERTILIZANTES", "DEFENSIVOS", "SEMENTES", "COMBUSTIVEIS", 
  "MAQUINAS", "SERVICOS", "INSUMOS_GERAIS", "VETERINARIOS", 
  "CONSULTORIA", "TRANSPORTE", "OUTROS"
]);
export type CategoriaFornecedorType = z.infer<typeof categoriaFornecedorEnum>;

// Helpers para validação de JSON
export const annualFlowSchema = z.record(z.string(), z.number());
export type AnnualFlowType = z.infer<typeof annualFlowSchema>;