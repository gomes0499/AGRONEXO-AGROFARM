/**
 * Cached Server Actions Examples
 * 
 * Demonstra como aplicar cache inteligente nas server actions
 * refatoradas para maximizar performance.
 */

"use server";

import { getFinancialFormData } from "./financial-forms-data-actions";
import { getAssetFormData } from "./asset-forms-data-actions";
import { getUserOrganizations } from "./user-organizations-actions";
import { 
  createCachedAction, 
  withOrgCache, 
  withConditionalCache,
  CacheKeys 
} from "../cache/server-actions-cache";

// 1. Cache para dados de formulários financeiros
export const getCachedFinancialFormData = createCachedAction(
  getFinancialFormData,
  'financial-form-data',
  'formData'
);

// Exemplo de uso:
// const formData = await getCachedFinancialFormData(organizationId);

// 2. Cache para dados de formulários de ativos
export const getCachedAssetFormData = createCachedAction(
  getAssetFormData,
  'asset-form-data', 
  'formData'
);

// 3. Cache para organizações do usuário (dados que mudam pouco)
export const getCachedUserOrganizations = createCachedAction(
  getUserOrganizations,
  'user-organizations',
  'userData'
);

// 4. Cache com escopo de organização usando helper
export const getCachedSafrasForOrg = withOrgCache(
  async (orgId: string) => {
    // Simulação de busca de safras - substituir pela implementação real
    const data = await getFinancialFormData(orgId);
    return data.safras;
  },
  'safras',
  'safras'
);

// 5. Cache condicional - só faz cache se o form estiver aberto
export const getConditionalFormData = withConditionalCache(
  getFinancialFormData,
  (orgId: string, formOpen?: boolean) => !!formOpen, // Só faz cache se form estiver aberto
  'conditional-form-data',
  'formData'
);

// 6. Cache para dados de charts com filtros
export const getCachedChartData = (
  chartType: string,
  dataFetcher: (orgId: string, filters?: any) => Promise<any>
) => {
  return withOrgCache(
    async (orgId: string, filters?: any) => {
      const filtersHash = filters ? btoa(JSON.stringify(filters)) : '';
      const cacheKey = `${chartType}-${orgId}-${filtersHash}`;
      
      return createCachedAction(
        () => dataFetcher(orgId, filters),
        cacheKey,
        'chartData'
      )();
    },
    chartType,
    'chartData'
  );
};

// 7. Cache warming para dados principais
export async function warmEssentialCaches(orgId: string) {
  console.log(`🔥 Warming caches for organization ${orgId}...`);
  
  try {
    // Warm up em paralelo os dados mais usados
    await Promise.all([
      getCachedFinancialFormData(orgId),
      getCachedAssetFormData(orgId),
      getCachedSafrasForOrg(orgId)
    ]);
    
    console.log(`✅ Cache warming completed for ${orgId}`);
  } catch (error) {
    console.error(`❌ Cache warming failed for ${orgId}:`, error);
  }
}

// 8. Exemplo de invalidação de cache quando dados mudam
export async function invalidateFormCaches(orgId: string) {
  // Este seria implementado com revalidateTag do Next.js
  // revalidateTag(CacheKeys.financialFormData(orgId));
  // revalidateTag(CacheKeys.assetFormData(orgId));
  console.log(`🗑️ Invalidated form caches for ${orgId}`);
}

// 9. Cache para dados de produção KPI
export const getCachedProductionKpiData = withOrgCache(
  async (orgId: string, filters?: any) => {
    // Aqui seria a implementação real de busca dos KPIs
    // Por agora retornamos um exemplo
    return {
      totalArea: 1000,
      totalProduction: 50000,
      averageProductivity: 50,
      lastUpdated: new Date().toISOString()
    };
  },
  'production-kpi-data',
  'chartData'
);

// 10. Cache inteligente que se auto-invalida baseado em timestamp
export const getSmartCachedData = (dataType: string) => {
  return withConditionalCache(
    async (orgId: string, lastModified?: string) => {
      // Lógica para buscar dados com timestamp
      return {
        data: `Smart cached data for ${orgId}`,
        lastModified: new Date().toISOString()
      };
    },
    (orgId: string, lastModified?: string) => {
      // Só usa cache se os dados não foram modificados recentemente
      if (!lastModified) return true;
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return new Date(lastModified) < fiveMinutesAgo;
    },
    `smart-${dataType}`,
    'chartData'
  );
};

// Exportar exemplos de uso para documentação
export const CACHE_USAGE_EXAMPLES = {
  // Uso básico
  basic: `
    // Server Component
    export default async function FormServer({ open, organizationId }) {
      const formData = await getCachedFinancialFormData(organizationId);
      return <FormClient initialData={formData} />;
    }
  `,
  
  // Cache condicional
  conditional: `
    // Só faz cache quando form está aberto
    export default async function ConditionalFormServer({ open, organizationId }) {
      const formData = await getConditionalFormData(organizationId, open);
      return <FormClient initialData={formData} open={open} />;
    }
  `,
  
  // Cache warming
  warming: `
    // No middleware ou layout principal
    export async function Layout({ params }) {
      // Warm cache em background
      warmEssentialCaches(params.orgId).catch(console.error);
      return <LayoutContent />;
    }
  `,
  
  // Cache com filtros
  withFilters: `
    // Chart com filtros cacheados
    export default async function ChartServer({ orgId, filters }) {
      const chartData = await getCachedChartData('financial-debt', 
        (orgId, filters) => getDebtEvolutionData(orgId, filters)
      )(orgId, filters);
      
      return <ChartClient data={chartData} />;
    }
  `
};