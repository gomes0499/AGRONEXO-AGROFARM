import { z } from "zod";

// Schema para validação de vendas de sementes
export const seedSaleFormSchema = z.object({
  organizacao_id: z.string().nonempty("Organização é obrigatória"),
  cultura_id: z.string().nonempty("Cultura é obrigatória"),
  ano: z.number({
    required_error: "Ano é obrigatório",
    invalid_type_error: "Ano deve ser um número"
  }).int("Ano deve ser um número inteiro").positive("Ano deve ser positivo"),
  receita_operacional_bruta: z.number({
    required_error: "Receita operacional bruta é obrigatória",
    invalid_type_error: "Receita operacional bruta deve ser um número"
  }).nonnegative("Receita operacional bruta deve ser maior ou igual a zero"),
  impostos_vendas: z.number({
    required_error: "Impostos sobre vendas são obrigatórios",
    invalid_type_error: "Impostos sobre vendas devem ser um número"
  }).nonnegative("Impostos sobre vendas devem ser maior ou igual a zero"),
  comissao_vendas: z.number({
    required_error: "Comissão de vendas é obrigatória",
    invalid_type_error: "Comissão de vendas deve ser um número"
  }).nonnegative("Comissão de vendas deve ser maior ou igual a zero"),
  logistica_entregas: z.number({
    required_error: "Logística e entregas são obrigatórias",
    invalid_type_error: "Logística e entregas devem ser um número"
  }).nonnegative("Logística e entregas devem ser maior ou igual a zero"),
  custo_mercadorias_vendidas: z.number({
    required_error: "Custo das mercadorias vendidas é obrigatório",
    invalid_type_error: "Custo das mercadorias vendidas deve ser um número"
  }).nonnegative("Custo das mercadorias vendidas deve ser maior ou igual a zero"),
  despesas_gerais: z.number({
    required_error: "Despesas gerais são obrigatórias",
    invalid_type_error: "Despesas gerais devem ser um número"
  }).nonnegative("Despesas gerais devem ser maior ou igual a zero"),
  imposto_renda: z.number({
    required_error: "Imposto de renda é obrigatório",
    invalid_type_error: "Imposto de renda deve ser um número"
  }).nonnegative("Imposto de renda deve ser maior ou igual a zero"),
});

// Tipo derivado do schema
export type SeedSaleFormValues = z.infer<typeof seedSaleFormSchema>;

// Interface para o objeto de venda de sementes completo (com dados do banco)
export interface SeedSale extends SeedSaleFormValues {
  id?: string;
  created_at?: string;
  updated_at?: string;
  cultura?: { id: string; nome: string };
}

// Enums para os valores estáticos nos selects
export enum StatusVenda {
  PENDENTE = "pendente",
  CONFIRMADA = "confirmada",
  ENTREGUE = "entregue",
  CANCELADA = "cancelada"
}

export enum TipoPagamento {
  AVISTA = "a_vista",
  APRAZO = "a_prazo",
  PERMUTA = "permuta"
}

export enum UnidadeVenda {
  SACOS = "sacos",
  KG = "kg",
  TON = "ton"
} 