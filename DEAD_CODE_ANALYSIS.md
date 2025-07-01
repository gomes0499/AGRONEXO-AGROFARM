# Dead Code and Unused Files Analysis

## Overview
This analysis identifies dead code, unused files, and duplicate components in the SR Consultoria Next.js application.

## Categories of Dead Code Found

### 1. Refactored Components (48 files)
These are duplicate components with "-refactored" suffix that appear to be unused versions:

#### Dashboard Components
- `components/dashboard/organization-switcher-refactored.tsx`
- `components/dashboard/weather-dashboard-refactored.tsx`
- `components/dashboard/weather-ticker-refactored.tsx`
- `components/dashboard/market-ticker-client.tsx` (possibly unused)
- `components/dashboard/market-ticker-wrapper.tsx` (possibly unused)
- `components/dashboard/market-ticker-sse.tsx` (possibly unused)

#### Financial Dashboard Charts
- `components/dashboard/visao-geral/financial-*-refactored.tsx` (12 files)
- `components/dashboard/visao-geral/overview-kpi-cards-refactored.tsx`
- `components/dashboard/visao-geral/balanco-section-refactored.tsx`
- `components/dashboard/visao-geral/dre-section-refactored.tsx`

#### Financial Components
- `components/financial/*/`*-refactored.tsx` (15 files)
- All form and listing refactored versions

#### Production Components
- `components/production/stats/*-refactored.tsx` (6 files)
- `components/production/projections/projection-selector-refactored.tsx`

#### Other Components
- `components/assets/asset-sales/asset-sale-form-refactored.tsx`
- `components/assets/investments/investment-form-refactored.tsx`
- `components/indicators/rating/rating-metrics-tab-refactored.tsx`
- `components/properties/property-list-refactored.tsx`
- `components/properties/lease-list-refactored.tsx`
- `components/projections/*/*-refactored.tsx` (6 files)

### 2. Server Components in _components Directory (52 files)
The `app/dashboard/_components/` directory contains server component duplicates that may be unused:
- All files ending with `-server.tsx` in this directory appear to be duplicates of components that exist elsewhere

### 3. Unused API Routes
- `app/api/chat-test/` (empty directory)
- `app/api/chat-groq-test/` (empty directory)
- `app/api/organization-stats/` (empty directory)

### 4. Backup and Old Files
- `components/production/stats/area-plantada-chart-old.tsx`
- `components/projections/balanco/balanco-patrimonial-table.tsx.bak`
- `supabase/migrations/20250627_create_projection_scenarios.sql.bak`

### 5. Potentially Unused Mobile Components
These mobile-specific components may be unused if the app doesn't have mobile-specific implementations:
- `components/ui/mobile-*.tsx` (7 files)
- `components/financial/dividas-bancarias/dividas-bancarias-listing-mobile.tsx`
- `components/production/planting-areas/planting-area-list-mobile.tsx`
- `components/dashboard/visao-geral/mobile-dashboard-view.tsx`

### 6. Potentially Unused Standalone Components
- `components/properties/document-upload.tsx` (only referenced in one file)
- `components/properties/property-form-simple.tsx` (only referenced in one file)
- `components/organization/organization/form/organization-form-modal.tsx`

### 7. Duplicate Client/Server Components
Many components have both client and server versions that might be duplicates:
- Files with `-client.tsx` suffix that have corresponding components without the suffix
- Files with `-server.tsx` suffix in the _components directory

### 8. Unused Wrapper Components
Some wrapper components might be redundant:
- `components/dashboard/market-ticker-wrapper.tsx`
- `components/projections/cash-flow/fluxo-caixa-client-wrapper.tsx`

### 9. Old Documentation Directory
- `docs_/` directory appears to be an old documentation folder that might be obsolete

## Recommendations

### Immediate Actions
1. **Remove all "-refactored" files** - These appear to be old versions that are no longer used
2. **Remove backup files** (`.bak`, `-old`)
3. **Delete empty API route directories** (`chat-test`, `chat-groq-test`, `organization-stats`)
4. **Clean up the `_components` directory** - Move necessary server components to their proper locations

### Investigation Required
1. **Mobile components** - Verify if mobile-specific components are actually used
2. **Client/Server duplicates** - Determine which version is actively used
3. **Wrapper components** - Check if they provide necessary functionality
4. **Document upload components** - Verify usage before removal

### Code Organization
1. Consider implementing a consistent naming convention for client/server components
2. Remove the `_components` directory pattern and organize components by feature
3. Implement a proper component deprecation process

## Estimated Impact
- **Files to remove**: ~120+ files
- **Code reduction**: ~30-40% of component files
- **Benefits**: 
  - Cleaner codebase
  - Easier navigation
  - Reduced confusion
  - Smaller bundle size
  - Better maintainability

## Next Steps
1. Create a backup branch before cleanup
2. Remove files in phases, testing after each phase
3. Update imports for any components that are moved
4. Run build and tests after cleanup
5. Document the new component structure