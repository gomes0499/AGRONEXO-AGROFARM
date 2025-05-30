// ==========================================
// PRODUCTION HELPER FUNCTIONS
// ==========================================

// Normaliza dados de produtividade para garantir formato consistente
export function normalizeProductivityData(
  produtividades_por_safra: Record<string, number | { produtividade: number; unidade: string }>
): Record<string, { produtividade: number; unidade: string }> {
  const normalized: Record<string, { produtividade: number; unidade: string }> = {};
  
  for (const [safraId, value] of Object.entries(produtividades_por_safra)) {
    if (typeof value === 'number') {
      // Formato legado: apenas número, assume sc/ha como unidade padrão
      normalized[safraId] = {
        produtividade: value,
        unidade: 'sc/ha'
      };
    } else {
      // Formato novo: objeto com produtividade e unidade
      normalized[safraId] = value;
    }
  }
  
  return normalized;
}