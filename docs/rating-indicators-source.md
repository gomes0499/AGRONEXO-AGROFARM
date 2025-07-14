# Indicadores do Sistema de Rating - Origem dos Dados

## 1. Análise Quantitativa (60%)

### 1.1 Indicadores Financeiros (29%)

| Indicador | Peso | Origem | Cálculo/Descrição |
|-----------|------|---------|-------------------|
| **Liquidez Corrente** | 7% | **CALCULADO** | Ativo Circulante / Passivo Circulante |
| **Endividamento Bancário Líquido/Patrimônio (LTV)** | 8% | **CALCULADO** | (Dívida Total - Caixa) / Patrimônio Líquido |
| **Margem EBITDA** | 7% | **CALCULADO** | EBITDA / Receita Total × 100 |
| **Dívida Estrutural/EBITDA** | 7% | **CALCULADO** | Dívida Total / EBITDA |

### 1.2 Histórico de Crédito (15%)

| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Pontualidade nos pagamentos** | 6% | **MANUAL** | Usuário avalia histórico de pagamentos (1-5) |
| **Restrições de crédito/SERASA** | 5% | **MANUAL** | Usuário consulta SERASA e insere nota (1-5) |
| **Apontamentos de atraso no SISBACEN** | 4% | **MANUAL** | Usuário consulta SISBACEN e insere nota (1-5) |

### 1.3 Produtividade/Culturas (12%)

| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Atua em culturas core (soja, milho, algodão)?** | 4% | **CALCULADO** | Pode ser calculado se tivermos dados de área por cultura, senão manual |
| **Produtividade Histórica vs. Média Regional** | 4% | **MANUAL** | Usuário compara com dados regionais e avalia (1-5) |
| **Tendência de produtividade (5 anos)** | 4% | **CALCULADO** | Pode ser calculado se tivermos histórico, senão manual |

### 1.4 Área Própria e Arrendada (4%)

| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **% Área própria e arrendada** | 4% | **CALCULADO** | Área Própria / Área Total × 100 |

## 2. Análise Qualitativa (40%)

### 2.1 Gestão e Governança (12%)

#### Experiência do produtor (6%)
| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **É produtor consolidado?** | 4% | **MANUAL** | Anos de experiência (1-5) |
| **Possui formação específica?** | 1% | **MANUAL** | Formação do produtor e equipe (1-5) |
| **Agricultura é atividade principal?** | 1% | **MANUAL** | % da receita vinda da agricultura (1-5) |

#### Planejamento de sucessão (4%)
| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Existe plano formal de sucessão?** | 2% | **MANUAL** | Nível de formalização (1-5) |
| **Sucessores participam da gestão?** | 1% | **MANUAL** | Nível de participação (1-5) |
| **Há documentação legal?** | 1% | **MANUAL** | % das áreas documentadas (1-5) |

#### Controles gerenciais (6%)
| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Utiliza software de gestão?** | 2% | **MANUAL** | Nível de informatização (1-5) |
| **Mantém registros detalhados?** | 2% | **MANUAL** | Qualidade dos registros (1-5) |
| **Elabora orçamentos anuais?** | 2% | **MANUAL** | Qualidade do planejamento (1-5) |

### 2.2 Sustentabilidade (5%)

#### Práticas ambientais (2%)
| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Utiliza plantio direto?** | 1% | **MANUAL** | % das áreas com plantio direto (1-5) |
| **Utiliza energia renovável?** | 1% | **MANUAL** | % de eficiência energética (1-5) |

#### Compliance ambiental (3%)
| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Autuações ambientais (5 anos)?** | 3% | **MANUAL** | Histórico de autuações (1-5) |

### 2.3 Irrigação/Equipamentos/Estrutura (8%)

| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Sistemas de irrigação** | 5% | **MANUAL** | % das áreas irrigadas (1-5) |
| **Equipamentos suficientes** | 2% | **MANUAL** | Capacidade de plantio/colheita (1-5) |
| **Armazenagem própria** | 1% | **MANUAL** | % da produção armazenada (1-5) |

### 2.4 Diversificação (8%)

| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Rotação de culturas** | 4% | **MANUAL** | % das áreas com rotação (1-5) |
| **Política de comercialização** | 1% | **MANUAL** | Número de compradores (1-5) |
| **Utiliza derivativos** | 1% | **MANUAL** | % da safra com hedge (1-5) |
| **Beneficiamento/agregação valor** | 1.5% | **MANUAL** | % da produção beneficiada (1-5) |
| **Atividades integradas** | 0.5% | **MANUAL** | % das áreas integradas (1-5) |

### 2.5 Fatores Externos (4%)

| Indicador | Peso | Origem | Descrição |
|-----------|------|---------|-----------|
| **Riscos climáticos regionais** | 4% | **MANUAL** | % das áreas em risco (1-5) |

## Resumo por Tipo de Origem

### Indicadores Calculados Automaticamente
1. Liquidez Corrente
2. LTV (Endividamento/Patrimônio)
3. Margem EBITDA
4. Dívida/EBITDA
5. % Área própria vs arrendada

### Indicadores Potencialmente Calculados (se houver dados)
1. Atua em culturas core
2. Tendência de produtividade

### Indicadores Manuais (27 indicadores)
- Todos os de Histórico de Crédito (3)
- Todos os de Gestão e Governança (9)
- Todos os de Sustentabilidade (3)
- Todos os de Irrigação/Equipamentos (3)
- Todos os de Diversificação (5)
- Fatores Externos (1)
- Produtividade vs Média Regional (1)

## Observações Importantes

1. **Indicadores CALCULADOS**: O sistema já possui os dados e calcula automaticamente
2. **Indicadores MANUAIS**: Requerem avaliação e input do usuário (nota de 1 a 5)
3. **Indicadores MISTOS**: Podem ser calculados se houver dados disponíveis, senão são manuais

## Escala de Avaliação Manual (1-5)
- **5**: Excelente
- **4**: Bom
- **3**: Regular
- **2**: Fraco
- **1**: Crítico

Cada indicador manual deve ter uma descrição clara dos critérios para cada nota, conforme especificado no documento original.

- Adicionar ativo biológico/lavouras em formação em liquidez corrente
- Revisar periodicamente a escala de EBITDA
- Informar conceito de dívida estrutural

Desenvolver tabela de % de ativo biológico por cultura (P&S)

(Produtividade Histórica (Média Últimos 5 Anos) vs. Média Regional). Descartar a pior e a melhor produtividade