/**
 * Server Actions Cache Optimization
 * 
 * Implementa cache inteligente para server actions que são chamadas frequentemente
 * mas retornam dados que mudam pouco, como listas de safras, culturas, etc.
 */

import { unstable_cache } from 'next/cache';

// Cache configuration for different data types
const CACHE_CONFIG = {
  // Master data - changes rarely
  safras: {
    duration: 60 * 15, // 15 minutes
    tags: ['safras']
  },
  culturas: {
    duration: 60 * 30, // 30 minutes
    tags: ['culturas']
  },
  sistemas: {
    duration: 60 * 30, // 30 minutes  
    tags: ['sistemas']
  },
  
  // Form data - changes moderately
  formData: {
    duration: 60 * 5, // 5 minutes
    tags: ['form-data']
  },
  
  // Chart data - changes frequently
  chartData: {
    duration: 60 * 2, // 2 minutes
    tags: ['chart-data']
  },
  
  // User data - changes rarely but user-specific
  userData: {
    duration: 60 * 10, // 10 minutes
    tags: ['user-data']
  }
};

/**
 * Creates a cached version of a server action
 */
export function createCachedAction<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  cacheKey: string,
  config: keyof typeof CACHE_CONFIG
) {
  const { duration, tags } = CACHE_CONFIG[config];
  
  return unstable_cache(
    action,
    [cacheKey],
    {
      revalidate: duration,
      tags: [cacheKey, ...tags]
    }
  );
}

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // Master data
  safras: (orgId: string) => `safras-${orgId}`,
  culturas: (orgId: string) => `culturas-${orgId}`,
  sistemas: (orgId: string) => `sistemas-${orgId}`,
  
  // Form data
  financialFormData: (orgId: string) => `financial-form-data-${orgId}`,
  assetFormData: (orgId: string) => `asset-form-data-${orgId}`,
  projectionFormData: (orgId: string) => `projection-form-data-${orgId}`,
  
  // Chart data
  productionKpiData: (orgId: string, filters?: string) => 
    `production-kpi-${orgId}${filters ? `-${filters}` : ''}`,
  financialChartData: (orgId: string, type: string, filters?: string) => 
    `financial-chart-${type}-${orgId}${filters ? `-${filters}` : ''}`,
  
  // User data
  userOrganizations: (userId: string) => `user-orgs-${userId}`,
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  // Invalidate all safras cache for an organization
  invalidateSafras: (orgId: string) => {
    return [CacheKeys.safras(orgId)];
  },
  
  // Invalidate form data when master data changes
  invalidateFormData: (orgId: string) => {
    return [
      CacheKeys.financialFormData(orgId),
      CacheKeys.assetFormData(orgId),
      CacheKeys.projectionFormData(orgId)
    ];
  },
  
  // Invalidate chart data when underlying data changes
  invalidateChartData: (orgId: string) => {
    return [
      CacheKeys.productionKpiData(orgId),
      CacheKeys.financialChartData(orgId, 'debt-evolution'),
      CacheKeys.financialChartData(orgId, 'indicators'),
      CacheKeys.financialChartData(orgId, 'bank-distribution')
    ];
  },
  
  // Invalidate user data when user changes organizations
  invalidateUserData: (userId: string) => {
    return [CacheKeys.userOrganizations(userId)];
  }
};

/**
 * Smart cache wrapper that automatically handles organization-scoped caching
 */
export function withOrgCache<T extends any[], R>(
  action: (orgId: string, ...args: T) => Promise<R>,
  keyPrefix: string,
  config: keyof typeof CACHE_CONFIG
) {
  return (orgId: string, ...args: T): Promise<R> => {
    const cacheKey = `${keyPrefix}-${orgId}${args.length ? `-${args.join('-')}` : ''}`;
    const cachedAction = createCachedAction(
      (...allArgs: [string, ...T]) => action(...allArgs),
      cacheKey,
      config
    );
    
    return cachedAction(orgId, ...args);
  };
}

/**
 * Conditional cache wrapper - only caches if condition is met
 */
export function withConditionalCache<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  shouldCache: (...args: T) => boolean,
  cacheKey: string,
  config: keyof typeof CACHE_CONFIG
) {
  const cachedAction = createCachedAction(action, cacheKey, config);
  
  return (...args: T): Promise<R> => {
    if (shouldCache(...args)) {
      return cachedAction(...args);
    }
    return action(...args);
  };
}

/**
 * Cache warming utilities for preloading commonly accessed data
 */
export const CacheWarming = {
  // Warm up master data cache
  async warmMasterData(orgId: string, actions: {
    getSafras: (orgId: string) => Promise<any>,
    getCulturas: (orgId: string) => Promise<any>,
    getSistemas: (orgId: string) => Promise<any>
  }) {
    const cachedGetSafras = createCachedAction(
      actions.getSafras,
      CacheKeys.safras(orgId),
      'safras'
    );
    
    const cachedGetCulturas = createCachedAction(
      actions.getCulturas,
      CacheKeys.culturas(orgId),
      'culturas'
    );
    
    const cachedGetSistemas = createCachedAction(
      actions.getSistemas,
      CacheKeys.sistemas(orgId),
      'sistemas'
    );
    
    // Warm cache in parallel
    await Promise.all([
      cachedGetSafras(orgId),
      cachedGetCulturas(orgId),
      cachedGetSistemas(orgId)
    ]);
  },
  
  // Warm up form data cache
  async warmFormData(orgId: string, actions: {
    getFinancialFormData: (orgId: string) => Promise<any>,
    getAssetFormData: (orgId: string) => Promise<any>
  }) {
    const cachedGetFinancialFormData = createCachedAction(
      actions.getFinancialFormData,
      CacheKeys.financialFormData(orgId),
      'formData'
    );
    
    const cachedGetAssetFormData = createCachedAction(
      actions.getAssetFormData,
      CacheKeys.assetFormData(orgId),
      'formData'
    );
    
    await Promise.all([
      cachedGetFinancialFormData(orgId),
      cachedGetAssetFormData(orgId)
    ]);
  }
};

/**
 * Cache monitoring and debugging
 */
export const CacheMonitoring = {
  // Get cache hit/miss statistics (would need implementation with actual cache provider)
  getStats: () => {
    // This would integrate with your cache provider to get actual stats
    return {
      hits: 0,
      misses: 0,
      hitRate: 0
    };
  },
  
  // Log cache operations for debugging
  logCacheOperation: (operation: 'hit' | 'miss' | 'set', key: string) => {
    if (process.env.NODE_ENV === 'development') {
    }
  }
};