# Instruções para Aplicar Migrações

## Migração Pendente: 0005_update_financial_categories.sql

Esta migração atualiza o módulo financeiro com:

1. **Novas categorias de despesas** para cálculo correto da DRE:
   - DEPRECIACAO - Depreciação
   - AMORTIZACAO - Amortização
   - ARRENDAMENTOS - Arrendamentos
   - PESSOAL - Pessoal e Encargos
   - ENERGIA_COMBUSTIVEL - Energia e Combustível
   - COMUNICACAO - Comunicação
   - VIAGENS - Viagens
   - MATERIAL_ESCRITORIO - Material de Escritório

2. **Nova categoria em Caixa e Disponibilidades**:
   - ESTOQUE_SEMENTES - Estoques de sementes

3. **Nova tabela de Receitas Financeiras** com categorias:
   - JUROS_APLICACOES - Juros de Aplicações
   - RENDIMENTOS_FUNDOS - Rendimentos de Fundos
   - DESCONTOS_OBTIDOS - Descontos Obtidos
   - VARIACAO_CAMBIAL - Variação Cambial Positiva
   - HEDGE - Resultados com Hedge
   - DIVIDENDOS - Dividendos Recebidos
   - OUTRAS_RECEITAS - Outras Receitas Financeiras

## Como aplicar a migração

### Via Supabase Dashboard:

1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Copie o conteúdo do arquivo `0005_update_financial_categories.sql`
4. Execute o script

### Via CLI:

```bash
# Se estiver usando Supabase CLI
supabase db push

# Ou execute diretamente
psql -h [HOST] -U [USER] -d [DATABASE] -f database/migrations/0005_update_financial_categories.sql
```

## Importante

- A migração preserva todos os dados existentes
- Os enums são atualizados sem perda de dados
- As políticas RLS são aplicadas automaticamente

## Após aplicar a migração

1. A aba "Outras Receitas" estará disponível no módulo Financeiro
2. As novas categorias de despesas estarão disponíveis
3. A opção de sementes aparecerá em Caixa e Disponibilidades
4. O cálculo da DRE será mais preciso com as novas categorias