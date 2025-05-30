# Documentação: Cálculo de Receita e EBITDA com Novo Formato JSONB

Este documento descreve como são calculadas as métricas de receita e EBITDA no dashboard de produção, utilizando o novo formato JSONB para armazenamento de dados por safra.

## Visão Geral

As métricas financeiras de produção (receita e EBITDA) são calculadas com base em:
1. Áreas plantadas por cultura/sistema
2. Produtividade por cultura/sistema
3. Preços de commodities específicos por ano
4. Custos por cultura/sistema/safra

Cada um destes dados está agora armazenado em formato JSONB, onde a safra_id é a chave e o valor é o dado específico para aquela safra.

## Processo de Cálculo da Receita

### 1. Busca de Dados
- Áreas de plantio (`areas_por_safra[safra_id]`)
- Produtividades (`produtividades_por_safra[safra_id]`)
- Preços de commodities por ano (`price_YYYY`)
- Safra atual (para determinar o ano)

### 2. Agrupamento por Cultura/Sistema
Para cada combinação de cultura e sistema:
- Agrupa-se a área total plantada
- Associa-se a produtividade correspondente
- Determina-se o tipo de commodity e preço específico

### 3. Determinação do Preço
Para cada combinação:
1. Identifica o tipo específico de commodity (ex: SOJA_IRRIGADO, MILHO_SEQUEIRO)
2. Busca o preço específico para o ano da safra:
   ```typescript
   // Exemplo de lookup de preço por ano
   switch (anoSafra) {
     case 2023:
       precoSafra = commodityPrice.price_2023;
       break;
     case 2024:
       precoSafra = commodityPrice.price_2024;
       break;
     // ... outros anos
     default:
       precoSafra = commodityPrice.current_price;
   }
   ```
3. Se o preço específico não for encontrado, usa-se o preço atual (`current_price`)
4. Se nenhum preço for encontrado, usa-se um valor padrão (120 R$/saca)

### 4. Cálculo da Receita
Para cada combinação:
- Produção = Área * Produtividade
- Receita = Produção * Preço
- Receita Total = Soma de todas as receitas

### 5. Tratamento de Fallback
Se não for possível calcular a receita por combinações detalhadas:
- Usa a área plantada total e produtividade média
- Aplica o preço de SOJA_SEQUEIRO para o ano específico da safra

## Cálculo do EBITDA

### 1. Cálculo do Custo Total
Para cada combinação de cultura/sistema:
- Busca os custos específicos no JSONB `custos_por_safra[safra_id]`
- Multiplica o custo por hectare pela área plantada
- Soma todos os custos para obter o custo total

### 2. Ajuste de Custos Irreais
Se o custo for irrealisticamente baixo em relação à receita:
- Estima-se um custo baseado em uma proporção típica da receita (65%)
- Ajusta-se essa proporção com base na idade da safra (safras mais antigas têm proporção menor)

### 3. Cálculo Final do EBITDA
- EBITDA = Receita - Custo Total
- Para evitar valores irrealmente altos, o EBITDA é limitado a 30% da receita para valores muito altos

## Comparação Ano a Ano (YoY)

Para calcular o crescimento em relação à safra anterior:
1. Busca-se a safra do ano anterior
2. Calcula-se a mesma métrica para essa safra anterior
3. O crescimento é calculado como: `((valorAtual - valorAnterior) / valorAnterior) * 100`

## Filtro de Safras Futuras

Safras com ano_inicio superior a 2029 são filtradas para não aparecerem nos gráficos e estatísticas de crescimento.

## Considerações Importantes

1. **Preços Específicos por Ano**: Os preços agora são específicos para cada ano da safra, não apenas o preço atual.
2. **Tratamento de Dados Ausentes**: Valores nulos ou vazios em qualquer parte do cálculo são tratados adequadamente.
3. **Combinações Cultura/Sistema**: O cálculo considera as combinações específicas (ex: SOJA IRRIGADO vs SOJA SEQUEIRO).
4. **Ajustes Realistas**: O EBITDA é ajustado para evitar valores irrealmente altos ou baixos.