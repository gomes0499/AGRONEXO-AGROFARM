# Prompts Sequenciais para Migração Next.js 15 - SR Consultoria

## 📋 Como Usar Este Documento

Copie e cole cada prompt sequencialmente para refatorar cada módulo da aplicação. Aguarde a conclusão de cada prompt antes de prosseguir para o próximo.

---

## 🚀 FASE 1: DASHBOARD (Visão Geral)

### Prompt 1.1 - Análise Completa do Dashboard
```
Analise o módulo Dashboard para identificar:
1. Todos os arquivos em uso e não utilizados
2. Componentes com sufixo -refactored, -server, -wrapper, -client
3. Fluxo de dados atual (onde estão os useEffect com fetch)
4. Server components em app/dashboard/_components/
5. Liste exatamente quais arquivos devem ser removidos

Foque em components/dashboard/ e app/dashboard/
```

### Prompt 1.2 - Criar Actions Unificadas
```
Crie o arquivo lib/actions/dashboard/dashboard-actions.ts que unifique TODAS as chamadas de dados do dashboard:
1. Financial KPIs
2. Production stats
3. Properties overview
4. Cash flow summary
5. DRE summary
6. Balance sheet summary

O arquivo deve exportar uma função fetchDashboardData(organizationId, projectionId) que retorne todos os dados necessários para o dashboard.
```

### Prompt 1.3 - Refatorar Dashboard Page
```
Refatore app/dashboard/page.tsx para:
1. Buscar todos os dados usando fetchDashboardData no servidor
2. Passar os dados para um novo componente DashboardClient
3. Remover qualquer lógica de client-side data fetching
4. Manter a estrutura de verificação de autenticação e organização
```

### Prompt 1.4 - Criar Dashboard Client
```
Crie components/dashboard/dashboard-client.tsx que:
1. Receba initialData com todos os dados do dashboard
2. Mantenha as tabs interativas
3. Passe os dados corretos para cada componente filho
4. Substitua DashboardWithScenarios
```

### Prompt 1.5 - Limpar Componentes Financial
```
Para os componentes financial do dashboard:
1. Remova o sufixo -refactored dos arquivos em uso
2. Delete as versões antigas (sem -refactored) que foram substituídas
3. Delete financial-dashboard-section-client.tsx
4. Atualize todos os imports afetados
```

### Prompt 1.6 - Limpar Server Components
```
Execute a limpeza:
1. Delete completamente o diretório app/dashboard/_components/
2. Remova componentes não utilizados identificados na análise
3. Liste os arquivos removidos para confirmação
```

### Prompt 1.7 - Testar Dashboard
```
Verifique se o dashboard está funcionando:
1. Compile o projeto (pnpm run build)
2. Liste quaisquer erros de import
3. Corrija problemas de tipos TypeScript
4. Confirme que os dados estão sendo carregados corretamente
```

---

## 🏦 FASE 2: FINANCIAL (Financeiro)

### Prompt 2.1 - Análise do Módulo Financial
```
Analise o módulo Financial (app/dashboard/financial e components/financial):
1. Liste todos os componentes -refactored
2. Identifique client wrappers desnecessários
3. Encontre server components duplicados
4. Mapeie o fluxo de dados atual
5. Liste arquivos para remoção
```

### Prompt 2.2 - Criar Financial Actions
```
Crie lib/actions/financial/unified-financial-actions.ts que unifique:
1. Dividas bancárias
2. Dividas fornecedores
3. Dividas terras
4. Financeiras
5. Receitas financeiras
6. Outras despesas
7. Caixa e disponibilidades

Exporte fetchFinancialPageData(organizationId, filters?)
```

### Prompt 2.3 - Refatorar Financial Page
```
Refatore app/dashboard/financial/page.tsx para:
1. Buscar dados com fetchFinancialPageData
2. Criar FinancialPageClient que receba initialData
3. Remover FinancialPageContent se existir
4. Passar dados via props, não via context/useEffect
```

### Prompt 2.4 - Migrar Componentes Financial
```
Para cada componente financial com -refactored:
1. Remova o sufixo -refactored
2. Delete a versão antiga
3. Garanta que recebem initialData
4. Remova useEffect de data fetching
5. Atualize imports
```

### Prompt 2.5 - Limpar Financial
```
Execute limpeza final do módulo financial:
1. Delete server components não usados
2. Remova client wrappers desnecessários
3. Organize a estrutura de pastas
4. Compile e corrija erros
```

---

## 🌾 FASE 3: PRODUCTION (Produção)

### Prompt 3.1 - Análise do Módulo Production
```
Analise o módulo Production (app/dashboard/production e components/production):
1. Identifique charts que ainda não recebem initialData
2. Liste componentes -refactored não utilizados
3. Encontre server components em _components
4. Mapeie configurações complexas (cultures, systems, cycles)
5. Liste arquivos para remoção
```

### Prompt 3.2 - Unificar Production Actions
```
Refatore lib/actions/production-actions.ts para:
1. Criar fetchProductionPageData que busque TUDO
2. Incluir stats, charts, configurações
3. Otimizar queries para reduzir chamadas ao banco
4. Manter compatibilidade com filtros existentes
```

### Prompt 3.3 - Refatorar Production Page
```
Refatore app/dashboard/production/page.tsx:
1. Use fetchProductionPageData no servidor
2. Crie ProductionPageClient
3. Passe dados de configuração e stats
4. Mantenha funcionalidade de filtros
```

### Prompt 3.4 - Migrar Production Charts
```
Migre os charts de produção para receber initialData:
1. area-plantada-chart.tsx
2. produtividade-chart.tsx
3. receita-chart.tsx
4. financial-chart.tsx
5. production-kpi-cards.tsx

Remova useEffect e estados de loading internos.
```

### Prompt 3.5 - Limpar Production
```
Limpeza final do módulo production:
1. Delete componentes -refactored não usados
2. Remova production-wrapper se existir
3. Delete server components órfãos
4. Teste funcionalidades de filtro
```

---

## 🏠 FASE 4: ASSETS (Patrimonial)

### Prompt 4.1 - Análise e Refatoração Assets
```
Para o módulo Assets (menor e mais simples):
1. Analise components/assets e app/dashboard/assets
2. Identifique os 2 componentes -refactored
3. Crie fetchAssetsPageData em asset-actions.ts
4. Refatore a página para buscar dados no servidor
5. Remova sufixos -refactored e delete versões antigas
6. Teste a funcionalidade
```

---

## 🏘️ FASE 5: PROPERTIES (Propriedades)

### Prompt 5.1 - Análise e Refatoração Properties
```
Para o módulo Properties:
1. Analise components/properties
2. Identifique property-list-refactored e lease-list-refactored
3. Verifique server components em _components
4. Crie fetchPropertiesPageData unificado
5. Refatore página e componentes
6. Delete arquivos desnecessários
```

---

## 📊 FASE 6: PROJECTIONS (Projeções)

### Prompt 6.1 - Análise Projections
```
Analise o módulo Projections (mais complexo):
1. Liste todos os 6 componentes -refactored
2. Identifique wrappers e duplicações
3. Mapeie fluxo de dados de fluxo-caixa, DRE, balanço
4. Liste server components relacionados
```

### Prompt 6.2 - Refatorar Projections
```
Refatore o módulo Projections:
1. Unifique data fetching em projection-actions.ts
2. Crie estrutura para cada sub-módulo (cash-flow, dre, balance)
3. Refatore páginas para server-side data fetching
4. Migre componentes para receber initialData
5. Delete arquivos -refactored após migração
```

---

## 🎯 FASE 7: INDICATORS (Indicadores)

### Prompt 7.1 - Refatorar Indicators
```
Para o módulo Indicators (mais simples):
1. Identifique rating-metrics-tab-refactored.tsx
2. Crie fetchIndicatorsData se necessário
3. Refatore página principal
4. Remova sufixo -refactored
5. Teste funcionalidades de rating
```

---

## 🧹 FASE 8: LIMPEZA FINAL

### Prompt 8.1 - Auditoria Final
```
Execute uma auditoria final completa:
1. Liste todos os arquivos que ainda têm sufixo -refactored
2. Procure por arquivos -server, -wrapper órfãos
3. Verifique se ainda existem useEffect com data fetching
4. Liste componentes não utilizados
5. Sugira melhorias de organização
```

### Prompt 8.2 - Limpeza e Organização
```
Execute a limpeza final:
1. Delete todos os arquivos identificados como não utilizados
2. Organize estrutura de pastas se necessário
3. Atualize imports quebrados
4. Execute npm run build e corrija erros
5. Crie um relatório final de mudanças
```

---

## 📝 NOTAS IMPORTANTES

1. **Sempre teste após cada fase** - Execute `npm run build` para verificar erros
2. **Faça commits frequentes** - Commite após cada módulo completo
3. **Mantenha funcionalidades** - Não quebre features existentes
4. **TypeScript strict** - Corrija todos os erros de tipo
5. **Documente mudanças** - Atualize documentação se necessário

## 🎯 RESULTADO ESPERADO

Após executar todos os prompts:
- ✅ 100% dos dados buscados no servidor
- ✅ Zero componentes com sufixo -refactored
- ✅ Zero server components não utilizados
- ✅ Estrutura limpa e organizada
- ✅ Performance otimizada
- ✅ Código seguindo padrões Next.js 15