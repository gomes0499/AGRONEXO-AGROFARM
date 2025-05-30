# Teste de Funcionamento das Estatísticas de Produção

Este documento descreve os testes necessários para verificar que as mudanças no schema de produção (uso do formato JSONB) funcionam corretamente nas estatísticas e gráficos do dashboard.

## 1. Dashboard Principal - Visão Geral

### KPIs de Produção
- [ ] Verificar se a área plantada total é exibida corretamente
- [ ] Verificar se a produtividade média é calculada corretamente
- [ ] Verificar se a receita é calculada corretamente 
- [ ] Verificar se o EBITDA e margem são calculados corretamente
- [ ] Verificar se a comparação YoY (ano a ano) está funcionando corretamente

### Gráficos de Evolução Histórica
- [ ] Abrir o modal de área plantada e verificar se o gráfico histórico mostra dados corretos
- [ ] Abrir o modal de produtividade e verificar se o gráfico histórico mostra dados corretos
- [ ] Abrir o modal de receita e verificar se o gráfico histórico mostra dados corretos
- [ ] Abrir o modal de EBITDA e verificar se o gráfico histórico mostra dados corretos

## 2. Dashboard de Produção

### KPIs e Gráficos
- [ ] Verificar seletor de safra (se está mostrando todas as safras disponíveis)
- [ ] Para cada safra selecionada, verificar se os KPIs exibem dados corretos
- [ ] Verificar gráfico de área plantada por cultura
- [ ] Verificar gráfico de produtividade por cultura
- [ ] Verificar gráfico de receita por cultura
- [ ] Verificar gráfico de evolução financeira (receita, custo, EBITDA)

### Modais de Evolução Histórica
- [ ] Clicar no KPI de área plantada e verificar se o modal exibe dados históricos corretos
- [ ] Clicar no KPI de produtividade e verificar se o modal exibe dados históricos corretos
- [ ] Clicar no KPI de receita e verificar se o modal exibe dados históricos corretos
- [ ] Clicar no KPI de EBITDA e verificar se o modal exibe dados históricos corretos

## 3. Testes de Filtros

### Filtros Globais
- [ ] Aplicar filtro de propriedade e verificar se os KPIs e gráficos atualizam corretamente
- [ ] Aplicar filtro de cultura e verificar se os KPIs e gráficos atualizam corretamente
- [ ] Aplicar filtro de sistema (sequeiro/irrigado) e verificar se os KPIs e gráficos atualizam corretamente
- [ ] Aplicar filtro de ciclo e verificar se os KPIs e gráficos atualizam corretamente
- [ ] Combinar múltiplos filtros e verificar se os dados são consistentes

## 4. Testes de Cenários Especiais

- [ ] Verificar comportamento quando não há dados para uma safra específica
- [ ] Verificar comportamento quando há dados de safras não sequenciais
- [ ] Verificar comportamento quando há dados de produtividade mas não de área plantada
- [ ] Verificar comportamento quando há dados de área plantada mas não de produtividade
- [ ] Verificar comportamento quando há dados de área e produtividade mas não de preços para cálculo de receita

## 5. Testes de Desempenho

- [ ] Verificar tempo de carregamento dos KPIs no dashboard principal
- [ ] Verificar tempo de carregamento dos gráficos no dashboard de produção
- [ ] Verificar tempo de abertura dos modais de evolução histórica
- [ ] Testar com grande volume de dados (múltiplas safras, culturas e propriedades)

## Notas de Implementação

As seguintes funções foram atualizadas para usar o novo formato JSONB:

1. No arquivo `lib/actions/production-chart-actions.ts`:
   - `getAreaPlantadaChart`
   - `getProdutividadeChart`
   - `getReceitaChart`
   - `getFinancialChart`

2. No arquivo `lib/actions/production-stats-actions.ts`:
   - `getProductionStats`
   - Corrigido o cálculo da receita para levar em conta a combinação correta de cultura e sistema
   - Melhorada a estimativa de EBITDA para casos com custos muito baixos

3. No arquivo `lib/actions/production-historical-stats-actions.ts`:
   - `calculateAreaPlantada`
   - `calculateProdutividadeMedia`
   - `calculateReceita`
   - `calculateEbitda`
   - Removido safras futuras (2030/31 e além)
   - Melhorado cálculo de receita e EBITDA

Todas as funções foram adaptadas para buscar dados usando:
- `not("areas_por_safra", "eq", "{}")` em vez de filtrar por `safra_id`
- Extrair valores de campos JSONB usando a chave do ID da safra
- Agrupar e agregar dados por combinação de cultura e sistema, preservando as características específicas
- Adicionar fallbacks para casos onde os dados estão incompletos

## Resultados Esperados

Após a implementação das alterações, esperamos que:

1. Todos os KPIs e gráficos exibam dados consistentes
2. Os filtros funcionem corretamente
3. A experiência de usuário seja mantida sem degradação
4. O desempenho seja mantido ou melhorado com o novo formato de dados