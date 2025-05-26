# MÓDULO DE PROJEÇÕES - TAREFAS (ORGANIZADO POR TABS)

## 1. ESTRUTURA BÁSICA

### 1.1 Schemas e Tipos (Zod)

- [x] Criar arquivo `/schemas/projections/index.ts` para exportações
- [x] Criar tipos enumerados (ProjecaoStatusEnum, SafraFormatoEnum, ProjecaoTipoEnum)
- [x] Criar schemas para configuração de projeções (ProjecaoConfigFormValues)
- [x] Criar schemas para projeções de culturas (ProjecaoCulturaFormValues)
- [x] Criar schemas para projeções de dívidas (ProjecaoDividaFormValues)
- [x] Criar schemas para projeções de caixa (ProjecaoCaixaFormValues)
- [x] Criar schemas para projeções de fluxo de caixa (ProjecaoFluxoCaixaFormValues)
- [x] Criar schemas para cenários de projeção (ProjecaoCenarioFormValues)
- [x] Criar tipos para Database do Supabase

### 1.2 Ações do Servidor (Server Actions)

- [x] Criar arquivo `/lib/actions/projections-actions/index.ts` para exportações
- [x] Atualizar arquivo `/lib/actions/index.ts` para incluir as ações de projeções
- [x] Implementar CRUD completo para todas as entidades de projeções:
  - [x] getProjecoesConfig, getProjecaoConfigById, createProjecaoConfig, updateProjecaoConfig, deleteProjecaoConfig
  - [x] getProjecoesCulturas, createProjecaoCultura, updateProjecaoCultura, deleteProjecaoCultura
  - [x] getProjecoesDividas, createProjecaoDivida, updateProjecaoDivida, deleteProjecaoDivida
  - [x] getProjecoesFluxoCaixa, createProjecaoFluxoCaixa, updateProjecaoFluxoCaixa, deleteProjecaoFluxoCaixa
  - [x] getProjecoesCaixa, createProjecaoCaixa, updateProjecaoCaixa, deleteProjecaoCaixa
  - [x] getProjecoesCenarios, createProjecaoCenario, updateProjecaoCenario, deleteProjecaoCenario
  - [x] generateConsolidatedReport, getCulturasForProjection, getSistemasForProjection, duplicateProjection

### 1.3 Layout e Navegação

- [x] Atualizar arquivo `/app/dashboard/projections/page.tsx` para a página principal do módulo de projeções
- [x] Criar arquivo `/app/dashboard/projections/layout.tsx` para o layout do módulo de projeções
- [x] Criar arquivo `/app/dashboard/projections/loading.tsx` para o estado de carregamento
- [x] **BUGFIX**: Corrigir erro de UUID na página principal - substituir hardcoded organization ID por context
- [x] **BUGFIX**: Adicionar 'use server' directive nas actions de projeções para resolver erro de revalidatePath
- [x] **BUGFIX**: Converter ProjectionsContent de async server para client component com React hooks
- [x] **BUGFIX**: Corrigir página de criação de projeção - componentes e funções render faltando
- [x] **REFACTOR**: Reestruturar módulo seguindo padrões corretos dos outros módulos:
  - [x] Usar server components nas páginas principais com getSession()
  - [x] Estrutura de tabs como no módulo de assets
  - [x] Componentes de listagem seguindo padrão do módulo financeiro
  - [x] Formulários em modal com Dialog component
  - [x] Usar SiteHeader nas páginas específicas
  - [x] Criar componentes tab wrapper para cada seção
  - [x] Componente NewProjectionForm com wizard estruturado
- [x] **BUGFIX**: Corrigir imports problemáticos nos componentes:
  - [x] Remover imports de componentes inexistentes (modals e delete alerts)
  - [x] Simplificar row-actions usando padrão dropdown correto
  - [x] Corrigir new-button components com props adequadas
  - [x] Usar apenas componentes existentes no projeto
- [x] **LAYOUT**: Adicionar SiteHeader no layout do módulo seguindo padrão dos outros módulos
- [x] **BUGFIX**: Corrigir erro "undefined is not an object" nos componentes de listing:
  - [x] Padronizar interfaces de props (organization, initialProjections/initialScenarios)
  - [x] Corrigir CultureProjectionListing para usar props corretas
  - [x] Corrigir DebtProjectionListing com interface adequada
  - [x] Simplificar componentes Cash, CashFlow e Scenarios com EmptyState
  - [x] Garantir que todos os componentes recebam arrays válidos
- [x] **BUGFIX**: Corrigir erro de validação "Invalid enum value" no formato de safra:
  - [x] Alterar valores de "SAFRA_COMPLETA" para "ANO_SAFRA" nos formulários
  - [x] Atualizar interfaces TypeScript com valores corretos
  - [x] Corrigir exibição nos componentes de listagem
  - [x] Alinhar com schema de validação do backend

## 2. COMPONENTES COMUNS E REUTILIZÁVEIS

### 2.1 Componentes de Formulário

- [x] Criar `/components/projections/common/projection-form-modal.tsx` para o modal padrão de formulários
- [x] Reutilizar `/components/shared/currency-field.tsx` para entrada de valores monetários
- [x] Reutilizar `/components/financial/common/currency-selector.tsx` para seleção de moeda (BRL/USD)
- [x] Criar `/components/projections/common/projection-delete-alert.tsx` para modal de confirmação de exclusão
- [x] Reutilizar `/components/financial/common/date-range-picker.tsx` para seleção de datas
- [x] Criar `/components/projections/common/period-selector.tsx` para seleção de períodos de projeção
- [x] Criar `/components/projections/common/safra-format-selector.tsx` para escolher formato de safra

### 2.2 Componentes de UI

- [x] Reutilizar componentes de cards existentes para exibir dados de projeções
- [x] Reutilizar `/components/shared/empty-state.tsx` para estado vazio de listagens
- [x] Criar `/components/projections/common/status-badge.tsx` para exibir status das projeções
- [x] Criar `/components/projections/common/projection-header.tsx` para cabeçalhos padronizados de seções
- [x] Criar `/components/projections/common/projection-filter-bar.tsx` para filtros de listagens
- [x] Criar `/components/projections/common/year-filter.tsx` para filtrar por ano de projeção
- [x] Criar `/components/projections/common/calculation-display.tsx` para mostrar valores calculados automaticamente

## 3. IMPLEMENTAÇÃO POR TAB

### 3.1 Tab: Configurações de Projeções

- [x] Criar `/components/projections/config/projection-config-listing.tsx` para a listagem de configurações
- [x] Criar `/components/projections/config/projection-config-form.tsx` para o formulário em modal
- [x] Criar `/components/projections/config/new-projection-config-button.tsx` para o botão de criação
- [x] Criar `/components/projections/config/projection-config-row-actions.tsx` para ações em linha da tabela
- [x] Implementar funcionalidade de definir projeção padrão
- [x] Implementar funcionalidade de duplicar projeção

### 3.2 Tab: Projeções de Culturas

- [x] Criar `/components/projections/cultures/culture-projection-listing.tsx` para a listagem de projeções
- [x] Criar `/components/projections/cultures/culture-projection-form.tsx` para o formulário em modal
- [x] Criar `/components/projections/cultures/new-culture-projection-button.tsx` para o botão de criação
- [x] Criar `/components/projections/cultures/culture-projection-row-actions.tsx` para ações em linha da tabela
- [x] Implementar exibição de campos calculados automaticamente (produção total, receita bruta, EBITDA, margem)
- [x] Criar componente para seleção de cultura e sistema
- [x] Implementar validação de períodos únicos por configuração

### 3.3 Tab: Posição de Dívida Projetada

- [x] Criar `/components/projections/debts/debt-projection-listing.tsx` para a listagem de projeções de dívidas
- [x] Criar `/components/projections/debts/debt-projection-form.tsx` para o formulário em modal
- [x] Criar `/components/projections/debts/new-debt-projection-button.tsx` para o botão de criação
- [x] Criar `/components/projections/debts/debt-projection-row-actions.tsx` para ações em linha da tabela
- [x] Implementar categorização de dívidas (BANCOS, TERRAS, FORNECEDORES, etc.)
- [x] Criar componente para subcategorização (ex: Banco do Brasil, Itaú)
- [x] Implementar exibição consolidada por categoria e ano

### 3.4 Tab: Projeções de Caixa e Disponibilidades

- [x] Criar `/components/projections/cash/cash-projection-listing.tsx` para a listagem de projeções de caixa
- [x] Criar `/components/projections/cash/cash-projection-form.tsx` para o formulário em modal
- [x] Criar `/components/projections/cash/new-cash-projection-button.tsx` para o botão de criação
- [x] Criar `/components/projections/cash/cash-projection-row-actions.tsx` para ações em linha da tabela
- [x] Implementar seções categorizadas (Disponibilidades, Direitos Realizáveis, Estoques, Ativos Biológicos)
- [x] Criar componentes para exibir totalizadores automáticos
- [x] Implementar validação de anos únicos por configuração

### 3.5 Tab: Fluxo de Caixa Projetado

- [x] Criar `/components/projections/cash-flow/cash-flow-projection-listing.tsx` para a listagem de fluxo de caixa
- [x] Criar `/components/projections/cash-flow/cash-flow-projection-form.tsx` para o formulário em modal
- [x] Criar `/components/projections/cash-flow/new-cash-flow-projection-button.tsx` para o botão de criação
- [x] Criar `/components/projections/cash-flow/cash-flow-projection-row-actions.tsx` para ações em linha da tabela
- [x] Implementar seções categorizadas (Receitas, Despesas, Investimentos, Custos Financeiros, Captações)
- [x] Criar componentes para exibir cálculos automáticos (fluxo operacional, fluxo livre)
- [x] Implementar visualização de fluxo cumulativo

### 3.6 Tab: Cenários de Projeção

- [x] Criar `/components/projections/scenarios/scenario-listing.tsx` para a listagem de cenários
- [x] Criar `/components/projections/scenarios/scenario-form.tsx` para o formulário em modal
- [x] Criar `/components/projections/scenarios/new-scenario-button.tsx` para o botão de criação
- [x] Criar `/components/projections/scenarios/scenario-row-actions.tsx` para ações em linha da tabela
- [x] Implementar fatores de ajuste (preços, produtividade, custos, câmbio)
- [x] Criar funcionalidade de cenário base único
- [x] Implementar aplicação de cenários nas outras projeções

## 4. PÁGINAS ESPECIALIZADAS

### 4.1 Página de Detalhes da Projeção

- [x] Criar `/app/dashboard/projections/[id]/page.tsx` para detalhes de uma projeção
- [x] Criar `/app/dashboard/projections/[id]/layout.tsx` para layout de detalhes
- [x] Implementar navegação entre abas da projeção específica
- [x] Criar dashboard consolidado com gráficos e métricas

### 4.2 Página de Criação/Edição

- [x] Criar `/app/dashboard/projections/new/page.tsx` para criação de nova projeção
- [x] Criar `/app/dashboard/projections/[id]/edit/page.tsx` para edição
- [x] Implementar wizard de criação de projeção
- [x] Criar funcionalidade de importação de dados de outras projeções