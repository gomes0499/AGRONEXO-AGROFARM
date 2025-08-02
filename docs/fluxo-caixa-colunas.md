# Documentação das Colunas do Fluxo de Caixa

Este documento explica como cada coluna do relatório de Fluxo de Caixa é calculada no sistema SR Consultoria.

## 1. RECEITAS AGRÍCOLAS

### 1.1 Culturas Individuais
- **Fonte**: Tabela `culture_projections`
- **Cálculo**: Para cada cultura e ano:
  ```
  Receita = Área Plantada × Produtividade × Preço
  ```
- **Observações**: 
  - Inclui culturas de 1ª e 2ª safra
  - Pode incluir culturas irrigadas e de sequeiro
  - Inclui sementes quando aplicável

### 1.2 Total Receitas Agrícolas
- **Cálculo**: Soma de todas as receitas de culturas por ano
  ```
  Total Receitas = Σ(Receitas de todas as culturas)
  ```

## 2. DESPESAS AGRÍCOLAS

### 2.1 Culturas Individuais
- **Fonte**: Tabela `culture_projections`
- **Cálculo**: Para cada cultura:
  ```
  Despesa = Custo Total da Cultura
  ```
- **Detalhamento**: Custos são categorizados por:
  - Insumos
  - Mão de obra
  - Operações mecanizadas
  - Outros custos diretos

### 2.2 Total Despesas Agrícolas
- **Cálculo**: Soma de todas as despesas de culturas por ano
  ```
  Total Despesas = Σ(Despesas de todas as culturas)
  ```

## 3. OUTRAS DESPESAS

### 3.1 Arrendamento
- **Fonte**: Tabela `arrendamentos`
- **Cálculo**: Soma dos valores de arrendamento por propriedade/ano
- **Detalhamento**: Por propriedade arrendada

### 3.2 Pró-labore
- **Fonte**: Tabela `outras_despesas` (categoria = 'PRO_LABORE')
- **Cálculo**: Valores definidos por ano

### 3.3 Divisão de Lucros
- **Fonte**: Tabela `outras_despesas` (categoria = 'DIVISAO_LUCROS')
- **Cálculo**: Valores definidos por ano

### 3.4 Despesas Financeiras
- **Fonte**: Tabela `outras_despesas` (categoria = 'FINANCEIRAS')
- **Subcategorias**:
  - Juros
  - Taxas e Tarifas
  - IOF e Impostos Financeiros
  - Comissões
  - Multas e Mora

### 3.5 Despesas Tributárias
- **Fonte**: Tabela `outras_despesas` (categoria = 'TRIBUTARIAS')
- **Cálculo**: Impostos e taxas não relacionados a financiamento

### 3.6 Outras Despesas
- **Fonte**: Tabela `outras_despesas` (outras categorias)
- **Subcategorias**:
  - Despesas Administrativas
  - Despesas Operacionais
  - Manutenção
  - Consultorias e Assessorias
  - Seguros
  - Combustíveis
  - Viagens e Hospedagem

### 3.7 Total Outras Despesas
- **Cálculo**: 
  ```
  Total = Arrendamento + Pró-labore + Divisão Lucros + 
          Financeiras + Tributárias + Outras
  ```

## 4. INDICADORES OPERACIONAIS

### 4.1 EBITDA
- **Significado**: Earnings Before Interest, Taxes, Depreciation and Amortization
- **Cálculo**:
  ```
  EBITDA = Receitas Totais - Despesas Agrícolas - Arrendamento - 
           Pró-labore - Divisão Lucros - Outras Despesas
  ```
- **Observação**: Exclui despesas financeiras e tributárias

### 4.2 Fluxo de Atividade
- **Cálculo**:
  ```
  Fluxo Atividade = Receitas Totais - Despesas Agrícolas - 
                    Total Outras Despesas
  ```

### 4.3 Fluxo Operacional
- **Cálculo**: Igual ao Fluxo de Atividade (antes de investimentos)

## 5. INVESTIMENTOS

### 5.1 Terras
- **Fonte**: Tabela `investimentos` (categoria = 'TERRA' ou 'PLANO_AQUISICAO_TERRAS')
- **Cálculo**: Soma dos valores de aquisição de terras por ano

### 5.2 Maquinários
- **Fonte**: Tabela `investimentos` (categoria = 'EQUIPAMENTO', 'TRATOR_COLHEITADEIRA_PULVERIZADOR', 'MAQUINARIO')
- **Detalhamento**:
  - Tratores
  - Colheitadeiras
  - Pulverizadores
  - Outros equipamentos

### 5.3 Outros Investimentos
- **Fonte**: Tabela `investimentos` (outras categorias)
- **Inclui**:
  - Benfeitorias
  - Tecnologia
  - Veículos
  - Infraestrutura

### 5.4 Total Investimentos
- **Cálculo**: 
  ```
  Total = Terras + Maquinários + Outros
  ```

## 6. FINANCEIRAS

### 6.1 Serviço da Dívida
- **Cálculo**: Total de pagamentos de dívidas (principal + juros)
- **Considera**: Política de caixa mínimo se ativa

### 6.2 Pagamentos a Bancos
- **Fonte**: Calculado com base no fluxo de pagamento das dívidas
- **Inclui**: Amortização do principal das dívidas bancárias

### 6.3 Novas Linhas de Crédito
- **Cálculo**: Valores de novos empréstimos tomados no ano
- **Observação**: Calculado quando fluxo de caixa é negativo

### 6.4 Dívidas por Categoria
- **Dívidas Bancárias**: Saldo devedor de empréstimos bancários
- **Dívidas de Terras**: Saldo devedor de aquisições de terras financiadas
- **Dívidas de Fornecedores**: Saldo devedor com fornecedores

### 6.5 Dívida Total Consolidada
- **Cálculo**: 
  ```
  Total = Dívidas Bancárias + Dívidas Terras + Dívidas Fornecedores
  ```
- **Considera**: Conversão de moedas (USD para BRL) quando aplicável

### 6.6 Saldo Devedor
- **Cálculo**: Valor total devido ao final de cada ano
- **Observação**: Considera pagamentos realizados no ano

### 6.7 Total Financeiras
- **Cálculo**:
  ```
  Total = Novas Linhas de Crédito - Serviço da Dívida
  ```

## 7. FLUXO LÍQUIDO E ACUMULADO

### 7.1 Fluxo Líquido
- **Cálculo**:
  ```
  Fluxo Líquido = Fluxo Atividade - Total Investimentos + Total Financeiras
  ```

### 7.2 Fluxo Acumulado
- **Cálculo**: Soma acumulada dos fluxos líquidos ano a ano
  ```
  Fluxo Acumulado[ano] = Fluxo Acumulado[ano-1] + Fluxo Líquido[ano]
  ```

### 7.3 Fluxo Líquido sem Pagamento de Dívida
- **Cálculo**: Cenário hipotético sem considerar serviço da dívida
  ```
  Fluxo s/ Pgto = Fluxo Atividade - Investimentos + Novas Linhas
  ```

### 7.4 Fluxo Acumulado sem Pagamento de Dívida
- **Cálculo**: Acumulado do fluxo sem pagamento de dívida

## 8. POLÍTICA DE CAIXA

### 8.1 Configuração
- **Valor Mínimo**: Caixa mínimo definido pela organização
- **Moeda**: BRL ou USD
- **Prioridade**: "debt" (pagar dívidas) ou "cash" (manter caixa)

### 8.2 Alertas
- **Abaixo do Mínimo**: Indica quando o fluxo acumulado está abaixo do mínimo
- **Valor Faltante**: Quanto falta para atingir o caixa mínimo

### 8.3 Impacto no Cálculo
Quando a política está ativa:
- O sistema ajusta automaticamente os pagamentos de dívidas
- Prioriza manter o caixa mínimo ou pagar dívidas conforme configurado
- Pode postergar pagamentos se necessário para manter liquidez

## Observações Importantes

1. **Anos Especiais**: Os anos 2021/22 e 2022/23 são tratados como históricos e não entram nos cálculos de projeção

2. **Projeções vs Cenários**: 
   - Dados de culturas podem variar por cenário de projeção
   - Outras despesas, investimentos e dívidas são sempre da base (não variam por cenário)

3. **Conversão de Moedas**: 
   - Dívidas em USD são convertidas para BRL usando a taxa de câmbio do sistema
   - Taxa padrão: R$ 5,50 (pode variar conforme configuração)

4. **Detalhamento**: 
   - O sistema mantém detalhamento por subcategorias para maior rastreabilidade
   - Permite análise drill-down em cada categoria principal