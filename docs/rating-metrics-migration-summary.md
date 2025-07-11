# Rating Metrics Migration Summary

## Date: 2025-01-11

### Overview
Created and applied a comprehensive migration to clean up the `rating_metrics` table to match the `rating-indicators-source.md` document.

### Key Findings

1. **Document Error Identified**: The rating-indicators-source.md document contains a mathematical error where the weights add up to 101% instead of 100%. Specifically:
   - The document states FATORES_EXTERNOS should be 4%
   - But all weights together would sum to 101%
   - The database correctly maintains 3% for FATORES_EXTERNOS to ensure a 100% total

2. **No Metrics to Delete**: All 32 metrics in the database match the document - no extra metrics were found.

3. **No Weight Changes Needed**: All weights were already correct, maintaining the 100% total.

### Changes Applied

The migration focused solely on updating metric names to match the document exactly:

1. **Added question marks** to metrics phrased as questions:
   - É produtor consolidado?
   - Possui formação específica?
   - Agricultura é atividade principal?
   - Existe plano formal de sucessão?
   - Sucessores participam da gestão?
   - Há documentação legal?
   - Utiliza software de gestão?
   - Mantém registros detalhados?
   - Elabora orçamentos anuais?
   - Utiliza plantio direto?
   - Utiliza energia renovável?
   - Autuações ambientais (5 anos)?
   - Atua em culturas core (soja, milho, algodão)?

2. **Updated names to match document terminology**:
   - "Área Própria vs Arrendada" → "% Área própria e arrendada"
   - "LTV (Loan to Value)" → "Endividamento Bancário Líquido/Patrimônio (LTV)"
   - "Dívida / EBITDA" → "Dívida Estrutural/EBITDA"
   - And others...

### Final State

- **Total Metrics**: 32 (matches document)
- **Total Weight**: 100.00% ✓
- **All source_type values**: Correctly set as CALCULATED or MANUAL
- **All names**: Now match the document exactly

### Category Weight Distribution

| Category | Weight | Metric Count |
|----------|--------|--------------|
| AREA | 4% | 1 |
| DIVERSIFICACAO | 8% | 5 |
| ENDIVIDAMENTO | 15% | 2 |
| FATORES_EXTERNOS | 3% | 1 |
| GESTAO_GOVERNANCA | 16% | 9 |
| HISTORICO_CREDITO | 15% | 3 |
| INFRAESTRUTURA | 8% | 3 |
| LIQUIDEZ | 7% | 1 |
| PRODUTIVIDADE | 12% | 3 |
| RENTABILIDADE | 7% | 1 |
| SUSTENTABILIDADE | 5% | 3 |
| **TOTAL** | **100%** | **32** |

### Migration File
`/Users/guilhermeoliveiragomes/Projects/SR-CONSULTORIA/supabase/migrations/20250111_clean_rating_metrics.sql`

The migration includes validation checks to ensure all weights sum correctly both by category and in total.