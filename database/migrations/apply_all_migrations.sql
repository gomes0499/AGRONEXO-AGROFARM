-- =====================================================
-- APLICAR TODAS AS MIGRAÇÕES PENDENTES
-- =====================================================
-- Este script aplica todas as migrações em ordem
-- =====================================================

\echo 'Iniciando aplicação de todas as migrações...'

-- 1. Adicionar branding e estrutura societária
\echo '1. Aplicando: Branding e estrutura societária...'
\i database/migrations/0001_add_organization_branding_and_partners.sql

-- 2. Remover módulo comercial
\echo '2. Aplicando: Remoção do módulo comercial...'
\i database/migrations/0002_remove_commercial_module.sql

-- 3. Adicionar campos de parceria e ônus em propriedades
\echo '3. Aplicando: Campos de parceria e ônus em propriedades...'
\i database/migrations/0003_add_property_partnership_and_onus_fields.sql

-- 4. Adicionar campos bovinos em rebanhos
\echo '4. Aplicando: Campos bovinos em rebanhos...'
\i database/migrations/0004_add_bovine_fields_to_rebanhos.sql

-- 5. Fix constraints de dívidas bancárias
\echo '5. Aplicando: Fix constraints dívidas bancárias...'
\i database/migrations/fix_dividas_bancarias_constraints.sql

-- 6. Atualizar categorias financeiras (consolidado)
\echo '6. Aplicando: Atualizações do módulo financeiro (consolidado)...'
\i database/migrations/apply_financial_updates.sql

\echo 'Todas as migrações foram aplicadas com sucesso!'