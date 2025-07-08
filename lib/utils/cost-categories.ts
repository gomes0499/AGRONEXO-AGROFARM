// Mapeamento de categorias de custos
export const COST_CATEGORIES = {
  CALCARIO: "Calcário",
  FERTILIZANTE: "Fertilizante",
  SEMENTES: "Sementes",
  TRATAMENTO_SEMENTES: "Tratamento de Sementes",
  HERBICIDA: "Herbicida",
  INSETICIDA: "Inseticida",
  FUNGICIDA: "Fungicida",
  BENEFICIAMENTO: "Beneficiamento",
  SERVICOS: "Serviços",
  ADMINISTRATIVO: "Administrativo",
  OUTROS: "Outros"
} as const;

export const COST_CATEGORY_GROUPS = {
  "Insumos": ["CALCARIO", "FERTILIZANTE", "SEMENTES", "TRATAMENTO_SEMENTES"],
  "Defensivos": ["HERBICIDA", "INSETICIDA", "FUNGICIDA"],
  "Operações": ["BENEFICIAMENTO", "SERVICOS"],
  "Gestão": ["ADMINISTRATIVO"],
  "Diversos": ["OUTROS"]
} as const;

export function getCostCategoryName(category: string): string {
  return COST_CATEGORIES[category as keyof typeof COST_CATEGORIES] || category;
}

export function getCostCategoryGroup(category: string): string {
  for (const [group, categories] of Object.entries(COST_CATEGORY_GROUPS)) {
    if ((categories as readonly string[]).includes(category)) {
      return group;
    }
  }
  return "Outros";
}