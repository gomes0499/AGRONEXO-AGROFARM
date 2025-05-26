# MÓDULO PATRIMONIAL - TAREFAS (ORGANIZADO POR TABS)

## 1. ESTRUTURA BÁSICA

### 1.1 Schemas e Tipos (Zod)

- [x] Criar arquivo `/schemas/patrimonio/index.ts` para exportações
- [x] Criar arquivo `/schemas/patrimonio/common.ts` para types e enums comuns
- [x] Criar arquivo `/schemas/patrimonio/equipment.ts` para schemas de máquinas e equipamentos
- [x] Criar arquivo `/schemas/patrimonio/investments.ts` para schemas de investimentos
- [x] Criar arquivo `/schemas/patrimonio/asset-sales.ts` para schemas de vendas de ativos
- [x] Criar arquivo `/schemas/patrimonio/land-acquisitions.ts` para schemas de aquisições de terras
- [x] Criar tipos enumerados (AssetCategoryEnum)

### 1.2 Ações do Servidor (Server Actions)

- [x] Criar arquivo `/lib/actions/patrimonio-actions/index.ts` para exportações
- [x] Atualizar arquivo `/lib/actions/index.ts` para incluir as ações patrimoniais
- [x] Implementar CRUD completo para todas as entidades patrimoniais:
  - [x] getEquipments, getEquipment, createEquipment, updateEquipment, deleteEquipment
  - [x] getInvestments, getInvestment, createInvestment, updateInvestment, deleteInvestment
  - [x] getAssetSales, getAssetSale, createAssetSale, updateAssetSale, deleteAssetSale
  - [x] getLandAcquisitionPlans, getLandAcquisitionPlan, createLandAcquisitionPlan, updateLandAcquisitionPlan, deleteLandAcquisitionPlan
  - [x] getInvestmentPlans, getInvestmentPlan, createInvestmentPlan, updateInvestmentPlan, deleteInvestmentPlan
  - [x] getAssetSalePlans, getAssetSalePlan, createAssetSalePlan, updateAssetSalePlan, deleteAssetSalePlan

### 1.3 Layout e Navegação

- [X] Criar arquivo `/app/dashboard/assets/page.tsx` para a página principal do módulo patrimonial
- [X] Criar arquivo `/app/dashboard/assets/layout.tsx` para o layout do módulo patrimonial
- [X] Criar arquivo `/app/dashboard/assets/loading.tsx` para o estado de carregamento

## 2. COMPONENTES COMUNS E REUTILIZÁVEIS

### 2.1 Componentes de Formulário

- [x] Criar `/components/assets/common/asset-form-modal.tsx` para o modal padrão de formulários
- [x] Reutilizar `/components/shared/currency-field.tsx` para entrada de valores monetários
- [x] Reutilizar `/components/financial/common/currency-selector.tsx` para seleção de moeda (BRL/USD)
- [x] Criar `/components/assets/common/asset-delete-alert.tsx` para modal de confirmação de exclusão
- [x] Reutilizar `/components/financial/common/date-range-picker.tsx` para seleção de datas
- [x] Criar `/components/assets/common/category-selector.tsx` para seleção de categorias de ativos

### 2.2 Componentes de UI

- [x] Reutilizar componentes de cards existentes para exibir dados patrimoniais
- [x] Reutilizar `/components/shared/empty-state.tsx` para estado vazio de listagens
- [x] Criar `/components/assets/common/category-badge.tsx` para exibir categorias com badge
- [x] Criar `/components/assets/common/asset-header.tsx` para cabeçalhos padronizados de seções
- [x] Criar `/components/assets/common/asset-filter-bar.tsx` para filtros de listagens
- [x] Criar `/components/assets/common/year-filter.tsx` para filtrar por ano de aquisição/venda

## 3. IMPLEMENTAÇÃO POR TAB

### 3.1 Tab: Máquinas e Equipamentos

- [x] Criar `/components/assets/equipment/equipment-listing.tsx` para a listagem de máquinas e equipamentos
- [x] Criar `/components/assets/equipment/equipment-form.tsx` para o formulário em modal
- [x] Criar `/components/assets/equipment/new-equipment-button.tsx` para o botão de criação
- [x] Criar `/components/assets/equipment/equipment-row-actions.tsx` para ações em linha da tabela
- [x] Remover página separada (será uma aba da página principal)

### 3.2 Tab: Investimentos Realizados

- [x] Criar `/components/assets/investments/investment-listing.tsx` para a listagem de investimentos
- [x] Criar `/components/assets/investments/investment-form.tsx` para o formulário em modal
- [x] Criar `/components/assets/investments/new-investment-button.tsx` para o botão de criação
- [x] Criar `/components/assets/investments/investment-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/assets/investments/page.tsx` para a página de investimentos

### 3.3 Tab: Vendas de Ativos

- [x] Criar `/components/assets/asset-sales/asset-sale-listing.tsx` para a listagem de vendas de ativos
- [x] Criar `/components/assets/asset-sales/asset-sale-form.tsx` para o formulário em modal
- [x] Criar `/components/assets/asset-sales/new-asset-sale-button.tsx` para o botão de criação
- [x] Criar `/components/assets/asset-sales/asset-sale-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/assets/asset-sales/page.tsx` para a página de vendas de ativos

### 3.4 Tab: Planos de Aquisição de Terras

- [x] Criar `/components/assets/land-plans/land-plan-listing.tsx` para a listagem de planos de aquisição
- [x] Criar `/components/assets/land-plans/land-plan-form.tsx` para o formulário em modal
- [x] Criar `/components/assets/land-plans/new-land-plan-button.tsx` para o botão de criação
- [x] Criar `/components/assets/land-plans/land-plan-row-actions.tsx` para ações em linha da tabela
- [x] Criar `/app/dashboard/assets/land-plans/page.tsx` para a página de planos de aquisição

### 3.5 Tab: Planos de Investimentos

- [x] Criar `/components/assets/investment-plans/investment-plan-listing.tsx` para a listagem de planos
- [x] Criar `/components/assets/investment-plans/investment-plan-form.tsx` para o formulário em modal
- [x] Criar `/components/assets/investment-plans/new-investment-plan-button.tsx` para o botão de criação
- [x] Criar `/components/assets/investment-plans/investment-plan-row-actions.tsx` para ações em linha
- [x] Criar `/app/dashboard/assets/investment-plans/page.tsx` para a página de planos de investimento

### 3.6 Tab: Planos de Vendas de Ativos

- [x] Criar `/components/assets/asset-sale-plans/asset-sale-plan-listing.tsx` para a listagem de planos
- [x] Criar `/components/assets/asset-sale-plans/asset-sale-plan-form.tsx` para o formulário em modal
- [x] Criar `/components/assets/asset-sale-plans/new-asset-sale-plan-button.tsx` para o botão de criação
- [x] Criar `/components/assets/asset-sale-plans/asset-sale-plan-row-actions.tsx` para ações em linha
- [x] Criar `/app/dashboard/assets/asset-sale-plans/page.tsx` para a página de planos de vendas

## 4. PÁGINA PRINCIPAL DO MÓDULO PATRIMONIAL

### 4.2 Implementação da Página Principal

- [ ] Implementar `/app/dashboard/assets/page.tsx` com as tabs
