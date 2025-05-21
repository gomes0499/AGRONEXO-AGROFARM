# MÓDULO FINANCEIRO - TAREFAS (ORGANIZADO POR TABS)

## 1. ESTRUTURA BÁSICA

### 1.1 Schemas e Tipos (Zod)

- [x] Criar arquivo `/schemas/financial/index.ts` para exportações
- [x] Criar arquivo `/schemas/financial/bank-debts.ts` para schemas de dívidas bancárias
- [x] Criar arquivo `/schemas/financial/trading-debts.ts` para schemas de dívidas com tradings
- [x] Criar arquivo `/schemas/financial/property-debts.ts` para schemas de dívidas de imóveis
- [x] Criar arquivo `/schemas/financial/suppliers.ts` para schemas de fornecedores
- [x] Criar arquivo `/schemas/financial/liquidity.ts` para schemas de fatores de liquidez
- [x] Criar arquivo `/schemas/financial/inventory.ts` para schemas de estoques
- [x] Criar arquivo `/schemas/financial/receivables.ts` para schemas de contratos recebíveis
- [x] Criar arquivo `/schemas/financial/advances.ts` para schemas de adiantamentos a fornecedores
- [x] Criar arquivo `/schemas/financial/loans.ts` para schemas de empréstimos a terceiros
- [x] Criar tipos enumerados (DebtModalityEnum, CurrencyEnum, LiquidityFactorEnum, InventoryTypeEnum, CommodityTypeEnum)

### 1.2 Ações do Servidor (Server Actions)

- [x] Criar arquivo `/lib/actions/financial-actions/index.ts` para exportações
- [x] Criar arquivo `/lib/actions/financial-actions/bank-debt-actions.ts` para CRUD de dívidas bancárias
- [x] Criar arquivo `/lib/actions/financial-actions/trading-debt-actions.ts` para CRUD de dívidas com tradings
- [x] Criar arquivo `/lib/actions/financial-actions/property-debt-actions.ts` para CRUD de dívidas de imóveis
- [x] Criar arquivo `/lib/actions/financial-actions/supplier-actions.ts` para CRUD de fornecedores
- [x] Criar arquivo `/lib/actions/financial-actions/liquidity-factor-actions.ts` para CRUD de fatores de liquidez
- [x] Criar arquivo `/lib/actions/financial-actions/inventory-actions.ts` para CRUD de estoques e estoques de commodities
- [x] Criar arquivo `/lib/actions/financial-actions/receivable-actions.ts` para CRUD de contratos recebíveis
- [x] Criar arquivo `/lib/actions/financial-actions/advance-actions.ts` para CRUD de adiantamentos a fornecedores
- [x] Criar arquivo `/lib/actions/financial-actions/loan-actions.ts` para CRUD de empréstimos a terceiros

### 1.3 Layout e Navegação

- [x] Criar arquivo `/app/dashboard/financial/page.tsx` para a página principal do módulo financeiro
- [x] Criar arquivo `/app/dashboard/financial/layout.tsx` para o layout do módulo financeiro
- [x] Criar arquivo `/app/dashboard/financial/loading.tsx` para o estado de carregamento
- [x] Atualizar `/components/dashboard/navigation.ts` para incluir as rotas do módulo financeiro
- [x] Criar componente `/components/dashboard/financial-navigation.tsx` para navegação secundária
- [x] Atualizar menu lateral para incluir o novo módulo financeiro

## 2. COMPONENTES COMUNS E REUTILIZÁVEIS

### 2.1 Componentes de Formulário

- [x] Criar `/components/financial/common/financial-form-modal.tsx` para o modal padrão de formulários (usado em todos os formulários)
- [x] Reutilizar `/components/shared/currency-field.tsx` para entrada de valores monetários
- [x] Criar `/components/financial/common/year-value-editor.tsx` para edição de valores por ano (para JSON)
- [x] Criar `/components/financial/common/currency-selector.tsx` para seleção de moeda (BRL/USD)
- [x] Criar `/components/financial/common/financial-delete-alert.tsx` para modal de confirmação de exclusão
- [x] Criar `/components/financial/common/date-range-picker.tsx` para seleção de datas de início/fim
- [x] Criar `/components/financial/common/indexer-input.tsx` para seleção de indexadores (SELIC, CDI, etc.)

### 2.2 Componentes de UI

- [x] Reutilizar componentes de cards existentes para exibir dados financeiros
- [x] Reutilizar `/components/shared/empty-state.tsx` para estado vazio de listagens
- [x] Criar `/components/financial/common/currency-badge.tsx` para exibir valores com indicação de moeda
- [x] Criar `/components/financial/common/financial-header.tsx` para cabeçalhos padronizados de seções
- [x] Criar `/components/financial/common/financial-filter-bar.tsx` para filtros de listagens

## 3. IMPLEMENTAÇÃO POR TAB

### 3.1 Tab: Dívidas Bancárias

- [x] Criar `/components/financial/bank-debts/bank-debt-listing.tsx` para a listagem de dívidas bancárias
- [x] Criar `/components/financial/bank-debts/bank-debt-form.tsx` para o formulário em modal
- [x] Criar `/components/financial/bank-debts/bank-debt-card.tsx` para visualização em card
- [x] Criar `/components/financial/bank-debts/new-bank-debt-button.tsx` para o botão de criação
- [x] Criar `/components/financial/bank-debts/bank-debt-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/financial/bank-debts/page.tsx` para a página de dívidas bancárias

### 3.2 Tab: Dívidas Trading

- [x] Criar `/components/financial/trading-debts/trading-debt-listing.tsx` para a listagem de dívidas com tradings
- [x] Criar `/components/financial/trading-debts/trading-debt-form.tsx` para o formulário em modal
- [ ] Criar `/components/financial/trading-debts/trading-debt-card.tsx` para visualização em card
- [ ] Criar `/components/financial/trading-debts/new-trading-debt-button.tsx` para o botão de criação
- [x] Criar `/components/financial/trading-debts/trading-debt-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/financial/trading-debts/page.tsx` para a página de dívidas trading

### 3.3 Tab: Dívidas de Imóveis

- [x] Criar `/components/financial/property-debts/property-debt-listing.tsx` para a listagem de dívidas de imóveis
- [x] Criar `/components/financial/property-debts/property-debt-form.tsx` para o formulário em modal
- [x] Criar `/components/financial/property-debts/property-debt-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/components/financial/property-debts/property-selector.tsx` para seleção de propriedades
- [x] Criar `/app/dashboard/financial/property-debts/page.tsx` para a página de dívidas de imóveis

### 3.4 Tab: Fornecedores

- [x] Criar `/components/financial/suppliers/supplier-listing.tsx` para a listagem de fornecedores
- [x] Criar `/components/financial/suppliers/supplier-form.tsx` para o formulário em modal
- [x] Criar `/components/financial/suppliers/supplier-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/financial/suppliers/page.tsx` para a página de fornecedores

### 3.5 Tab: Fatores de Liquidez

- [x] Criar `/components/financial/liquidity/liquidity-factor-listing.tsx` para a listagem de fatores de liquidez
- [x] Criar `/components/financial/liquidity/liquidity-factor-form.tsx` para o formulário em modal
- [x] Criar `/components/financial/liquidity/liquidity-factor-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/financial/liquidity/page.tsx` para a página de fatores de liquidez

### 3.6 Tab: Estoques

- [x] Criar `/components/financial/inventory/inventory-listing.tsx` para a listagem de estoques
- [x] Criar `/components/financial/inventory/inventory-form.tsx` para o formulário em modal
- [x] Criar `/components/financial/inventory/inventory-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/financial/inventories/page.tsx` para a página de estoques

### 3.7 Tab: Estoques de Commodities

- [x] Criar `/components/financial/commodity-inventory/commodity-inventory-listing.tsx` para a listagem
- [x] Criar `/components/financial/commodity-inventory/commodity-inventory-form.tsx` para o formulário em modal
- [x] Criar `/components/financial/commodity-inventory/commodity-inventory-row-actions.tsx` para ações em linha
- [x] Criar `/app/dashboard/financial/commodity-stocks/page.tsx` para a página de estoques de commodities

### 3.8 Tab: Contratos Recebíveis

- [x] Criar `/components/financial/receivables/receivable-listing.tsx` para a listagem de contratos recebíveis
- [x] Criar `/components/financial/receivables/receivable-form.tsx` para o formulário em modal
- [x] Criar `/components/financial/receivables/receivable-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/financial/receivables/page.tsx` para a página de contratos recebíveis

### 3.9 Tab: Adiantamentos a Fornecedores

- [X] Criar `/components/financial/advances/advance-listing.tsx` para a listagem de adiantamentos
- [X] Criar `/components/financial/advances/advance-form.tsx` para o formulário em modal
- [X] Criar `/components/financial/advances/advance-row-actions.tsx` para ações em linha da tabela
- [X] Criar `/app/dashboard/financial/supplier-advances/page.tsx` para a página de adiantamentos

### 3.10 Tab: Empréstimos a Terceiros

- [X] Criar `/components/financial/loans/loan-listing.tsx` para a listagem de empréstimos
- [X] Criar `/components/financial/loans/loan-form.tsx` para o formulário em modal
- [X] Criar `/components/financial/loans/loan-row-actions.tsx` para ações em linha da tabela
- [X] Criar `/app/dashboard/financial/third-party-loans/page.tsx` para a página de empréstimos

## 4. PÁGINA PRINCIPAL DO MÓDULO FINANCEIRO

### 4.1 Componentes da Página Principal

- [X] Criar `/components/financial/dashboard/financial-debt-distribution-chart.tsx` para gráfico de distribuição de dívidas
- [X] Criar `/components/financial/dashboard/financial-payment-flow-chart.tsx` para gráfico de fluxo de pagamentos
- [X] Reutilizar componentes de cards para resumo de dados financeiros

### 4.2 Implementação da Página Principal

- [X] Implementar `/app/dashboard/financial/page.tsx` com os gráficos
- [X] Adicionar cards de resumo na página principal
- [X] Integrar visualizações gráficas dos dados financeiros

## 5. IMPLEMENTAÇÃO DETALHADA

### 5.1 Schemas e Validação Zod

- [x] Implementar schemas para todas as entidades com validações apropriadas:
  - [x] Modalidade de dívidas (CUSTEIO, INVESTIMENTOS)
  - [x] Valores monetários (mínimo 0)
  - [x] Formatos de data corretos
  - [x] Validação de JSON para fluxo de pagamento anual
  - [x] Tipagem correta para todos os campos

### 5.2 Server Actions

- [x] Implementar funções CRUD para todas as entidades
- [x] Adicionar validação de permissões para todas as actions
- [x] Implementar tratamento de erros consistente
- [x] Garantir revalidação de cache após mutações
- [ ] Implementar cálculos automáticos:
  - [ ] Totais de valores anuais
  - [ ] Conversão entre moedas

### 5.3 UI e Interface

- [x] Implementar todos os formulários com React Hook Form + Zod
- [x] Criar listagens com paginação, ordenação e filtragem
- [x] Implementar cards para exibição de dados
- [x] Implementar componentes para edição de dados estruturados (JSON)
- [x] Garantir feedback adequado para sucesso/erro em todas as operações
- [x] Implementar modal de confirmação para operações destrutivas

## 6. INTEGRAÇÃO COM OUTROS MÓDULOS

### 6.1 Integração com Módulo de Propriedades

- [ ] Conectar dívidas de imóveis com propriedades existentes
- [ ] Compartilhar seletores de propriedades entre módulos

### 6.2 Integração com Módulo de Indicadores

- [ ] Fornecer dados para cálculo de indicadores financeiros
- [ ] Compartilhar componentes de exibição de valores

### 6.3 Integração com Módulo de Projeções

- [ ] Fornecer dados de dívidas para projeções financeiras

## 7. IMPLANTAÇÃO GRADUAL (PRIORIZAÇÃO)

### 7.1 Fase 1: Estrutura e Navegação Básica

- [x] Criar schemas e tipos
- [x] Implementar navegação e estrutura básica
- [x] Criar componentes comuns reutilizáveis

### 7.2 Fase 2: Dívidas

- [x] Implementar gerenciamento de dívidas bancárias
- [x] Implementar gerenciamento de dívidas com tradings
- [x] Implementar gerenciamento de dívidas de imóveis (API implementada, falta interface)

### 7.3 Fase 3: Liquidez e Fornecedores

- [x] Implementar gerenciamento de fatores de liquidez
- [x] Implementar gerenciamento de fornecedores

### 7.4 Fase 4: Estoques

- [x] Implementar gerenciamento de estoques
- [x] Implementar gerenciamento de estoques de commodities

### 7.5 Fase 5: Contratos, Adiantamentos e Empréstimos

- [X] Implementar gerenciamento de contratos recebíveis
- [X] Implementar gerenciamento de adiantamentos a fornecedores
- [X] Implementar gerenciamento de empréstimos a terceiros
