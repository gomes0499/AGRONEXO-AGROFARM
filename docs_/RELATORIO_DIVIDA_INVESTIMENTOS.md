# Relatório: Problema na Criação de Dívida com Modalidade INVESTIMENTOS

## Data: 2025-06-25

## Arquivos Principais Relacionados a Dívidas

### 1. Schemas e Validação
- `/schemas/financial/bank-debts.ts` - Schema principal das dívidas bancárias
- `/schemas/financial/common.ts` - Enums e tipos comuns (inclui modalidades)
- `/database/financial/types.sql` - Definição dos tipos no banco de dados

### 2. Componentes de Formulário
- `/components/financial/bank-debts/bank-debt-form.tsx` - Formulário de criação/edição
- `/components/financial/bank-debts/bank-debt-form-inner.tsx` - Componente interno do formulário

### 3. Actions/API
- `/lib/actions/financial-actions/index.ts` - Actions principais (createBankDebt, updateBankDebt)
- `/lib/actions/financial-actions/dividas-bancarias.ts` - Actions específicas para dívidas bancárias

### 4. Banco de Dados
- `/database/financial/tables.sql` - Definição das tabelas
- `/database/financial/types.sql` - Definição dos tipos e enums

## Problemas Identificados

### 1. Inconsistência no Nome do Campo
**Problema**: A tabela `dividas_bancarias` define o campo como `valores_por_ano`, mas a constraint verifica `fluxo_pagamento_anual`.

```sql
-- Na definição da tabela (linha 18):
valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}

-- Na constraint (linha 25):
CONSTRAINT chk_dividas_bancarias_fluxo_not_empty CHECK (jsonb_typeof(fluxo_pagamento_anual) = 'object' AND fluxo_pagamento_anual != '{}')
```

**Impacto**: Esta inconsistência pode causar erros ao tentar inserir dados na tabela.

### 2. Campos Faltantes na Tabela
**Problema**: O schema TypeScript espera campos que não existem na tabela do banco:
- `safra_id` - Requerido pelo schema mas não existe na tabela
- `status` - Usado no código mas não existe na tabela
- `observacoes` - Usado no código mas não existe na tabela

### 3. Nomenclatura Inconsistente entre Código e Banco
**Problema**: O código TypeScript usa `fluxo_pagamento_anual` enquanto a tabela usa `valores_por_ano`.

## Estrutura de Validação de Modalidade

### 1. Definição do Enum (TypeScript)
```typescript
// Em /schemas/financial/common.ts
export const debtModalityEnum = z.enum(["CUSTEIO", "INVESTIMENTOS"], {
  errorMap: (issue, ctx) => ({ message: "Selecione uma modalidade válida" })
});
```

### 2. Definição do Enum (PostgreSQL)
```sql
-- Em /database/financial/types.sql
CREATE TYPE divida_modalidade AS ENUM (
    'CUSTEIO',
    'INVESTIMENTOS'
);
```

### 3. Uso no Formulário
```typescript
// Em bank-debt-form.tsx (linha 373-377)
<SelectItem value="CUSTEIO">Custeio</SelectItem>
<SelectItem value="INVESTIMENTOS">Investimentos</SelectItem>
```

A validação de modalidade está corretamente configurada tanto no TypeScript quanto no PostgreSQL.

## Possível Causa do Erro

O erro ao criar dívida com modalidade INVESTIMENTOS provavelmente ocorre devido a:

1. **Constraint incorreta**: A constraint `chk_dividas_bancarias_fluxo_not_empty` tenta validar um campo que não existe (`fluxo_pagamento_anual`).

2. **Campos obrigatórios faltantes**: O código tenta inserir campos que não existem na tabela (safra_id, status, observacoes).

3. **Incompatibilidade de nomenclatura**: O código envia `fluxo_pagamento_anual` mas a tabela espera `valores_por_ano`.

## Soluções Propostas

### 1. Aplicar a Migração Criada
Execute o arquivo de migração criado em `/database/migrations/fix_dividas_bancarias_constraints.sql` que:
- Corrige a constraint incorreta
- Adiciona os campos faltantes (safra_id, status, observacoes)
- Renomeia `valores_por_ano` para `fluxo_pagamento_anual` para manter consistência com o código
- Adiciona índices para melhor performance

### 2. Executar a Migração
```bash
# Via Supabase CLI
supabase db push

# Ou diretamente no banco
psql -f database/migrations/fix_dividas_bancarias_constraints.sql
```

### 3. Testar a Correção
Use o script de teste criado em `/scripts/test_debt_creation.ts` após aplicar a migração.

## Recomendações Adicionais

1. **Padronização**: Definir e documentar um padrão para nomenclatura de campos JSONB multi-safra (usar sempre `fluxo_pagamento_anual` ou `valores_por_ano`).

2. **Validação**: Adicionar testes automatizados para validar que todas as modalidades funcionam corretamente.

3. **Documentação**: Documentar a estrutura esperada do JSONB para fluxos de pagamento.

4. **Sincronização**: Garantir que schemas TypeScript e tabelas PostgreSQL estejam sempre sincronizados.