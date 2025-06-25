# Instruções para Aplicar as Migrações do Módulo Financeiro

## 🚨 Importante

As funcionalidades do módulo financeiro foram implementadas, mas precisam das migrações aplicadas no banco de dados para funcionar completamente.

## Erros Atuais

1. **Tabela `receitas_financeiras` não existe**
   - A aba "Outras Receitas" não funcionará até criar a tabela

2. **Campos de taxa de câmbio não existem**
   - A visualização em dólar funcionará com taxa padrão (5.00) até adicionar os campos

## Como Aplicar as Migrações

### Opção 1: Script Consolidado (Recomendado)

Execute o script que criamos com todas as atualizações:

```bash
# Via Supabase CLI
supabase db push < database/migrations/apply_financial_updates.sql

# Ou diretamente no PostgreSQL
psql $DATABASE_URL < database/migrations/apply_financial_updates.sql
```

### Opção 2: Migrações Individuais

Se preferir aplicar uma por vez:

```bash
# 1. Atualizar categorias financeiras
psql $DATABASE_URL < database/migrations/0005_update_financial_categories.sql

# 2. Adicionar taxa de câmbio
psql $DATABASE_URL < database/migrations/0006_add_exchange_rate_to_financial_tables.sql
```

## O que será criado/atualizado

1. **Tabela `receitas_financeiras`**
   - Para gerenciar outras receitas financeiras
   - Com categorias: juros, rendimentos, dividendos, etc.

2. **Novas categorias em `outras_despesas`**
   - DEPRECIACAO, AMORTIZACAO, ARRENDAMENTOS, PESSOAL, etc.
   - Necessárias para calcular DRE e Balanço corretamente

3. **ESTOQUE_SEMENTES em `caixa_disponibilidades`**
   - Adiciona opção de sementes conforme solicitado

4. **Campos de taxa de câmbio**
   - `taxa_cambio_usd` e `moeda_principal` em `safras`
   - `safra_id` e `taxa_cambio_contratacao` nas tabelas financeiras
   - Permite conversão baseada na safra

## Verificar se foi aplicado

```sql
-- Verificar se tabela receitas_financeiras existe
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'receitas_financeiras'
);

-- Verificar se ESTOQUE_SEMENTES existe
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'caixa_disponibilidades_categoria'::regtype 
AND enumlabel = 'ESTOQUE_SEMENTES';

-- Verificar campos de taxa de câmbio
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'safras' 
AND column_name IN ('taxa_cambio_usd', 'moeda_principal');
```

## Após aplicar as migrações

1. A aba "Outras Receitas" funcionará normalmente
2. Poderá configurar taxa de câmbio por safra
3. A conversão de moeda usará taxas específicas
4. Novas categorias estarão disponíveis

## Suporte

Se encontrar algum problema ao aplicar as migrações:

1. Verifique os logs de erro
2. Certifique-se de ter permissões de admin
3. Execute uma migração por vez para identificar problemas
4. O sistema continuará funcionando com funcionalidade limitada até aplicar