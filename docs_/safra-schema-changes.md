# Guia de Integração com o Novo Formato JSONB de Safras

Este documento descreve a nova abordagem para armazenamento de dados relacionados a safras no sistema SR Consultoria.

## Visão Geral

Migramos do modelo anterior (onde cada registro possuía um `safra_id` específico) para um formato JSONB, onde um único registro contém dados para múltiplas safras em campos estruturados como objetos JSON.

## Estrutura do Novo Formato

### Áreas de Plantio (areas_plantio)
```json
{
  "areas_por_safra": {
    "safra_id_1": 250.5,
    "safra_id_2": 300.0,
    "safra_id_3": 0  // Zero ou ausente significa sem plantio nesta safra
  }
}
```

### Produtividades (produtividades)
```json
{
  "produtividades_por_safra": {
    "safra_id_1": 60.5,
    "safra_id_2": {
      "produtividade": 65.2,
      "unidade": "sc/ha"
    }
  }
}
```

### Custos de Produção (custos_producao)
```json
{
  "custos_por_safra": {
    "safra_id_1": 5500.0,
    "safra_id_2": 6000.0
  }
}
```

## Como Consultar Dados no Novo Formato

### Consulta Básica

Em vez de filtrar por `safra_id`, agora devemos:

1. Buscar todos os registros relevantes com JSONB não vazio:
   ```sql
   SELECT * FROM areas_plantio 
   WHERE organizacao_id = :organizacao_id 
   AND areas_por_safra IS NOT NULL 
   AND areas_por_safra != '{}'
   ```

2. No código, extrair os valores para a safra específica:
   ```typescript
   const areaSafra = registro.areas_por_safra[safraId] || 0;
   ```

### Padrão para Filtrar Registros com Dados para uma Safra Específica

```typescript
const query = supabase
  .from("tabela")
  .select("*")
  .eq("organizacao_id", organizationId)
  .not("campo_por_safra", "is", null)
  .not("campo_por_safra", "eq", "{}");
  // Opcionalmente adicionar .filter() para outras condições
```

### Padrão para Extrair Valores de Safras Específicas

```typescript
// Para áreas_plantio
const areaValue = area.areas_por_safra?.[safraId] || 0;

// Para produtividades (que podem ser números ou objetos)
const prodSafra = produtividade.produtividades_por_safra?.[safraId];
const produtividadeValue = typeof prodSafra === 'number' 
  ? prodSafra 
  : (prodSafra as { produtividade: number; unidade: string })?.produtividade || 0;

// Para custos de produção
const custoValue = custo.custos_por_safra?.[safraId] || 0;
```

## Cálculos Agregados

Para calcular estatísticas por safra:

1. Busque todos os registros relevantes (sem filtrar por safra)
2. Para cada safra de interesse, extraia os valores correspondentes do objeto JSONB
3. Realize os cálculos necessários com esses valores

Exemplo para área total plantada:
```typescript
let areaTotal = 0;
registros.forEach(registro => {
  const areaSafra = registro.areas_por_safra?.[safraId] || 0;
  areaTotal += areaSafra;
});
```

## Funções Adaptadas para o Novo Formato

As seguintes funções foram adaptadas para trabalhar com o novo formato:

1. `lib/actions/production-chart-actions.ts`
   - `getAreaPlantadaChart`
   - `getProdutividadeChart`
   - `getReceitaChart`
   - `getFinancialChart`

2. `lib/actions/production-stats-actions.ts`
   - `getProductionStats`

3. `lib/actions/production-historical-stats-actions.ts`
   - `calculateAreaPlantada`
   - `calculateProdutividadeMedia`
   - `calculateReceita`
   - `calculateEbitda`

## Vantagens da Nova Abordagem

1. **Redução da redundância de dados**: Menos registros duplicados para diferentes safras
2. **Consultas mais eficientes**: Permite buscar dados de múltiplas safras em uma única consulta
3. **Mais flexibilidade**: Facilita a comparação entre safras e o cálculo de crescimentos ano a ano
4. **Estrutura extensível**: Permite adicionar metadados adicionais para cada safra no futuro

## Considerações de Desempenho

- Operações JSONB são eficientes em PostgreSQL para leitura
- É importante criar índices apropriados se necessário para consultas frequentes
- Monitorar o desempenho de consultas complexas com grandes volumes de dados

## Referência de Aplicação

Ver arquivos para exemplos completos de implementação:
- `/lib/actions/production-chart-actions.ts`
- `/lib/actions/production-stats-actions.ts`
- `/lib/actions/production-historical-stats-actions.ts`

## Testes

Consulte o arquivo `/docs_/production-stats-testing.md` para o plano de testes detalhado para verificar a implementação.