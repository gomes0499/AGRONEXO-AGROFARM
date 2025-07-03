# Sistema de Rating Flexível com React Flow

## Visão Geral

O sistema de rating foi redesenhado para permitir total flexibilidade na criação de modelos de avaliação personalizados. Utilizando React Flow, os usuários podem criar modelos visuais arrastando métricas e definindo pesos de forma intuitiva.

## Funcionalidades

### 1. Editor Visual de Modelos
- Interface drag-and-drop para criar modelos de rating
- Conexão visual entre métricas e o resultado final
- Ajuste de pesos diretamente nos nós
- Cálculo em tempo real da pontuação

### 2. Métricas Personalizáveis
- **Métricas Quantitativas**: Calculadas automaticamente do sistema
  - Liquidez Corrente
  - Dívida/EBITDA
  - Dívida/Patrimônio
  - LTV (Loan to Value)
  - Margem EBITDA
  
- **Métricas Qualitativas**: Definidas pelo usuário
  - Gestão de Riscos
  - Governança Corporativa
  - Qualidade da Gestão
  - Sustentabilidade
  - Compliance

### 3. Sistema de Thresholds
- Definição de faixas de pontuação para cada métrica
- Níveis personalizáveis (AAA, AA, A, BBB, etc.)
- Valores mínimos e máximos configuráveis
- Pontuação associada a cada faixa

### 4. Cálculo Multi-Cenário
- Suporte para diferentes cenários (Base, Otimista, Pessimista)
- Cálculo baseado em safras específicas
- Métricas ajustadas conforme projeções

## Como Usar

### Criando um Novo Modelo

1. Acesse **Indicadores > Editor Visual de Rating**
2. Clique em **Novo Modelo**
3. Defina o nome e descrição do modelo
4. Adicione métricas:
   - Selecione métricas existentes ou crie novas
   - Arraste para o canvas
   - Conecte ao nó de saída "Rating Final"
5. Configure os pesos de cada métrica (0-100%)
6. Salve o modelo

### Configurando Métricas

1. Para criar uma nova métrica:
   - Clique em **Criar Nova Métrica**
   - Escolha o tipo (Quantitativa/Qualitativa)
   - Defina nome, código e categoria
   
2. Para configurar limites:
   - Clique em **Configurar Limites**
   - Defina as faixas de valores
   - Associe pontuações a cada faixa

### Calculando Rating

1. No modal de cálculo:
   - Selecione o modelo de rating
   - Escolha a safra de referência
   - Selecione o cenário (Base/Projeções)
2. Clique em **Calcular**
3. O sistema irá:
   - Buscar dados financeiros do cenário/safra
   - Calcular métricas quantitativas
   - Aplicar pesos configurados
   - Gerar classificação final (AAA a D)

## Estrutura Técnica

### Componentes Principais

- `RatingModelsManager`: Gerenciador principal de modelos
- `RatingModelEditor`: Editor visual com React Flow
- `MetricNode`: Nó customizado para métricas
- `OutputNode`: Nó de saída com resultado final
- `MetricThresholdsEditor`: Editor de limites/faixas
- `CreateMetricDialog`: Modal para criar métricas

### Fluxo de Dados

```
Dados Financeiros → Cálculo de Métricas → Aplicação de Thresholds → 
Pontuação Individual → Média Ponderada → Rating Final
```

### Integração com Cenários

O sistema está totalmente integrado com o módulo de cenários/projeções:
- Métricas quantitativas usam dados do cenário selecionado
- Receitas e custos são ajustados conforme projeções
- EBITDA e indicadores financeiros refletem o cenário

## Exemplos de Uso

### Modelo Conservador
- 40% Liquidez
- 30% Endividamento
- 20% Rentabilidade
- 10% Governança

### Modelo Growth
- 20% Liquidez
- 20% Endividamento
- 40% Crescimento
- 20% Eficiência Operacional

### Modelo ESG
- 20% Financeiro
- 30% Governança
- 30% Sustentabilidade
- 20% Social

## Melhores Práticas

1. **Balanceamento de Pesos**: Certifique-se que a soma dos pesos faça sentido
2. **Thresholds Realistas**: Configure limites baseados em benchmarks do setor
3. **Métricas Relevantes**: Escolha métricas alinhadas com objetivos de análise
4. **Documentação**: Descreva claramente o propósito de cada modelo
5. **Validação**: Teste modelos com diferentes cenários antes de usar em produção