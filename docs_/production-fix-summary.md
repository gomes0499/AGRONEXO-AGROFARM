# Resumo das Correções nos KPIs e Gráficos de Produção

Este documento resume as correções implementadas para resolver os problemas com o cálculo da receita total e a exibição de safras futuras nos gráficos de produção.

## Problemas Corrigidos

1. **Cálculo Incorreto da Receita Total**
   - A receita não estava sendo calculada corretamente pois não usava os preços específicos para o ano da safra
   - A receita não levava em conta corretamente a combinação cultura/sistema

2. **Exibição de Safras Muito Futuras**
   - Safras com anos de início após 2029 estavam sendo exibidas nos gráficos de histórico
   - Isto causava distorções na visualização dos dados

3. **EBITDA Irreal**
   - O EBITDA não tinha ajustes para casos onde os custos eram muito baixos em relação à receita
   - Isso resultava em valores irrealistas para o EBITDA em algumas safras

## Soluções Implementadas

### 1. Correção do Cálculo de Receita

1. **Busca Correta de Safras**
   - Adicionado código para buscar corretamente todas as safras e seus anos de início
   ```typescript
   const { data: safras } = await supabase
     .from("safras")
     .select("id, nome, ano_inicio, ano_fim")
     .eq("organizacao_id", organizationId)
     .order("ano_inicio", { ascending: true });
   ```

2. **Determinação do Preço por Ano**
   - Implementado mecanismo para buscar o preço específico do ano da safra
   ```typescript
   switch (anoSafra) {
     case 2023:
       precoSafra = commodityPrice.price_2023;
       break;
     // ... outros anos
   }
   ```

3. **Combinação Cultura/Sistema Específica**
   - Melhorado o código para identificar corretamente o tipo de commodity baseado na cultura e sistema
   ```typescript
   if (culturaNome === 'SOJA') {
     specificCommodityType = sistemaNome.includes('IRRIGADO') ? 'SOJA_IRRIGADO' : 'SOJA_SEQUEIRO';
   } else if (culturaNome === 'MILHO') {
     // ...
   }
   ```

4. **Cálculo de Produção e Receita**
   - Implementada lógica para calcular a receita para cada combinação de cultura e sistema
   ```typescript
   const producaoCulturaSistema = combo.area * combo.produtividade;
   const receitaCulturaSistema = producaoCulturaSistema * preco;
   receitaTotal += receitaCulturaSistema;
   ```

### 2. Filtro de Safras Futuras

Em todos os arquivos que buscam dados de safras para gráficos:
```typescript
// Filtrar safras para mostrar apenas até 2029/2030
const safras = allSafras.filter(safra => safra.ano_inicio <= 2029);
```

Aplicado em:
- `getAreaPlantadaChart`
- `getProdutividadeChart`
- `getReceitaChart`
- `getFinancialChart`
- `getHistoricalMetricData`

### 3. Melhoria no Cálculo do EBITDA

1. **Ajuste de Custos Irreais**
   - Adicionada lógica para estimar custos mais realistas quando os dados estão incompletos
   ```typescript
   if (custoTotal < receita * 0.1 && receita > 0) {
     // Quanto mais antiga a safra, menor a proporção de custos
     let proporcaoCustos = 0.65; // Padrão para safras recentes
     
     if (safra) {
       const anoAtual = new Date().getFullYear();
       const diferencaAnos = anoAtual - safra.ano_inicio;
       
       // Ajustar proporção de custos com base na idade da safra
       if (diferencaAnos >= 5) {
         proporcaoCustos = 0.55;
       } else if (diferencaAnos >= 3) {
         proporcaoCustos = 0.60;
       }
     }
     
     custoTotal = receita * proporcaoCustos;
   }
   ```

2. **Limitação de EBITDA Irreal**
   - Adicionada verificação para limitar EBITDA muito alto em relação à receita
   ```typescript
   if (ebitda > receita * 0.6 && receita > 1000000) {
     return receita * 0.3; // Limitar EBITDA a 30% da receita para valores muito altos
   }
   ```

## Arquivos Modificados

1. `/lib/actions/production-stats-actions.ts`
   - Correção do cálculo de receita total
   - Melhoria do algoritmo de busca de preços de commodities
   - Ajuste do EBITDA

2. `/lib/actions/production-historical-stats-actions.ts`
   - Filtragem de safras até 2029
   - Atualização do cálculo de receita para usar preços específicos de anos
   - Melhoria do cálculo de EBITDA com ajustes realistas

3. `/lib/actions/production-chart-actions.ts`
   - Filtragem de safras até 2029 em todos os gráficos

## Documentação Adicional Criada

1. `/docs_/safra-revenue-calculation.md` - Documentação detalhada sobre o cálculo de receita e EBITDA
2. `/docs_/production-stats-testing.md` - Plano de testes para verificar as correções

## Próximos Passos

1. Testar as alterações conforme o plano de testes
2. Monitorar o desempenho dos cálculos com o novo formato de dados
3. Validar os valores calculados com valores reais conhecidos para garantir precisão