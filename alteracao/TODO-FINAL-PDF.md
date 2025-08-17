# TODO Sistema SR Consultoria - Baseado no PDF do Stakeholder

## 🖥️ PLATAFORMA

### 🟢 MUITO FÁCIL (1-2 horas)

#### Remoções Simples
- [ ] Retirar informação marcada com X vermelho no resumo de produção
- [ ] Remover "operações financeiras" do financeiro
- [ ] Remover "saldo devedor" e "fluxo financiamento líquido"
- [ ] Remover "fluxo acumulado sem pagamento de dívida" e "excesso de caixa"
- [ ] Remover linha "débito de fornecedores" do fluxo de caixa
- [ ] Remover "dívida total consolidada" do fluxo de caixa

#### Nomenclaturas
- [ ] Mudar "Visão Geral Financeiro" → "Indicadores"

### 🟡 FÁCIL (2-4 horas)

#### Formatações e Ajustes Visuais
- [ ] Adicionar unidade no título dos gráficos (R$ milhões)
- [ ] Padronizar "M" para milhões nas colunas
- [ ] Remover "k" dos anos-safra (usar milhares de HA)
- [ ] Diminuir tamanho dos marcadores (bolinhas) nos gráficos
- [ ] Evitar sobreposição de informações
- [ ] Padronizar siglas de moedas no cabeçalho
- [ ] Remover siglas das planilhas
- [ ] Mostrar ano em vez de safra (2024/25 = 2025)

#### Funcionalidades Simples
- [ ] Adicionar soma dos valores no final das planilhas
- [ ] Totalizar valores onde possível
- [ ] Verificar funcionalidade "QTD Contratos"

### 🟠 MÉDIO (4-8 horas)

#### Reorganização de Interface
- [ ] Tirar ranking de imóveis da visão geral propriedades
- [ ] Substituir ranking por 2 gráficos pizza:
  - [ ] Imóveis próprios (% área agro, % pecuária, % outros)
  - [ ] Imóveis arrendados (mesma divisão)
- [ ] Adicionar gráfico pizza: área própria vs arrendada (HA)
- [ ] Separar com linha tracejada: realizado vs projetado
- [ ] Mover "Preços" de "Produção" para novo tópico "Premissas" na lateral

#### Novos Campos
- [ ] Adicionar campo "possui armazém de produção" ao cadastrar fazendas
- [ ] Trazer informação de dívida % em Dólar, Real, SC de Soja

#### Financeiro
- [ ] Compilar dívidas de terras por imóvel (estratificar ao clicar)
- [ ] Trazer informações compiladas de cada banco (corrigir duplicação)
- [ ] Aplicar mesma dinâmica para gráfico "Evolução da Receita por Cultura"

### 🔴 DIFÍCIL (8-16 horas)

#### Novo Módulo Completo
- [ ] Criar tópico "Armazenagem" com:
  - [ ] Capacidade em sacas (grãos)
  - [ ] Capacidade em fardos (algodão - 1 fardo = 227kg)
  - [ ] Vincular fazenda com armazém/silo
  - [ ] Tipo de item: 1-Grãos, 2-Algodão
  - [ ] Campo "possui beneficiamento" (sim/não)

#### Indicadores e Métricas
- [ ] Incluir novos indicadores: Índice de liquidez, LTV, LTV líquido
- [ ] Criar tópico "Posição de Dívida Bancária" com informações detalhadas

#### Fluxo de Caixa
- [ ] Mover dívidas de terras de "financeiras" para "investimento"
- [ ] Discriminar investimentos + aquisição - venda de bens
- [ ] Criar política de caixa mínimo (valor fixo, % receita ou % custos)
- [ ] Manter operações financeiras no fluxo com cálculo automático

#### Contratos
- [ ] Adicionar no lançamento de dívidas bancárias:
  - [ ] Número do contrato
  - [ ] Quantidade de parcelas
  - [ ] Periodicidade (mensal, bi, tri, qua, sem, anual, irregular)
  - [ ] Se irregular: campos para datas de pagamento

### 🟣 MUITO DIFÍCIL (16+ horas)

#### Correções de Bugs Complexos
- [ ] Corrigir conceito "posição de dívida" para valores atuais e amortizações
- [ ] Corrigir acesso multi-usuário (3 máquinas, 1 não consegue acessar)
- [ ] Corrigir premissa de moeda não refletindo para outras safras
- [ ] Corrigir erro: aparece "feijão" em vez de "soja R$119,50"

#### Correções de Fluxo de Caixa
- [ ] Corrigir pagamento de bancos e terras (não está sendo demonstrado)
- [ ] Corrigir juros (serviço de dívida) - está puxando só 26/27 em diante
- [ ] Ajustar serviço de dívida: dívida bancária ano anterior / taxa média juros

---

## 📄 RELATÓRIO

### 🟢 MUITO FÁCIL (1-2 horas)

#### Remoções
- [ ] Excluir dados do cabeçalho (página 2)
- [ ] Retirar informações marcadas no PDF
- [ ] Tirar lucro líquido do gráfico e tabela

#### Nomenclaturas
- [ ] Mudar "Evolução Financeira" → "Evolução do Resultado"
- [ ] Trocar "lucro médio" → "margem EBITDA" (valor e %)
- [ ] Trocar "prazo médio" → "prazo médio de dívidas bancárias"
- [ ] Mudar "posição de dívida por safra" → "ranking de dívida bancária por safra"

### 🟡 FÁCIL (2-4 horas)

#### Títulos e Apresentação
- [ ] Apresentar ranking com título "Valor patrimonial de imóveis rurais próprios"
- [ ] Trazer cabeçalho completo para o relatório
- [ ] Ajustar nomenclatura na tabela (margem EBITDA %)

### 🟠 MÉDIO (4-8 horas)

#### Novos Elementos
- [ ] Trazer os 2 gráficos pizza (próprios e arrendados)
- [ ] Trazer gráfico pizza área própria vs arrendada
- [ ] Adicionar gráfico de dívidas bancárias em cascata (ano a ano)
- [ ] Adicionar gráfico pizza de % dívidas
- [ ] Alterar gráfico para modelo de barras (por banco)

#### Cálculos e Médias
- [ ] Ajustar cálculo: Margem EBITDA = EBITDA / Receita
- [ ] Trazer média do detalhamento por cultura (sacas/hectare) no final
- [ ] Adicionar média da receita realizada
- [ ] Adicionar média da receita projetada

### 🔴 DIFÍCIL (8-16 horas)

#### Detalhamento de Dados
- [ ] NÃO somar safra e safrinha (custos diferentes)
- [ ] Em todos os gráficos mostrar: Cultura, Sistema (sequeiro/irrigado), Safra
- [ ] Separar informações por safra e sistema
- [ ] Apresentar informações apenas quando anos-safra tiverem valores

#### Indicadores
- [ ] Incluir novos indicadores econômicos
- [ ] Levar todos indicadores da plataforma para o relatório

---

## 📊 Resumo por Local e Dificuldade

### PLATAFORMA
| Nível | Quantidade | Tempo Estimado |
|-------|------------|----------------|
| 🟢 Muito Fácil | 7 tarefas | 1-2 horas |
| 🟡 Fácil | 11 tarefas | 2-4 horas |
| 🟠 Médio | 10 tarefas | 4-8 horas |
| 🔴 Difícil | 13 tarefas | 8-16 horas |
| 🟣 Muito Difícil | 7 tarefas | 16+ horas |
| **Subtotal** | **48 tarefas** | **~60-80 horas** |

### RELATÓRIO
| Nível | Quantidade | Tempo Estimado |
|-------|------------|----------------|
| 🟢 Muito Fácil | 7 tarefas | 1-2 horas |
| 🟡 Fácil | 3 tarefas | 2-4 horas |
| 🟠 Médio | 10 tarefas | 4-8 horas |
| 🔴 Difícil | 8 tarefas | 8-16 horas |
| **Subtotal** | **28 tarefas** | **~30-40 horas** |

### TOTAL GERAL
**76 tarefas** | **~90-120 horas de desenvolvimento**

## 🚀 Sugestão de Implementação

### Fase 1: Quick Wins (1 semana)
- Todas as tarefas 🟢 Muito Fácil de ambos
- Tarefas 🟡 Fácil da plataforma

### Fase 2: Melhorias Visuais (1 semana)
- Tarefas 🟡 Fácil do relatório
- Tarefas 🟠 Médio de interface e gráficos

### Fase 3: Novos Módulos (2 semanas)
- Módulo Armazenagem
- Novos indicadores
- Reorganização do fluxo de caixa

### Fase 4: Correções Complexas (2 semanas)
- Todos os bugs 🟣 Muito Difícil
- Ajustes no relatório
- Testes finais