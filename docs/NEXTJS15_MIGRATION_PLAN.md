# Plano de Migração Completa para Next.js 15 - SR Consultoria

## 🎯 Objetivo

Migrar toda a aplicação para o padrão Server-First do Next.js 15, removendo código morto e organizando a estrutura de arquivos.

## 📋 Princípios da Migração

### 1. Padrão Server-First

```tsx
// ✅ CORRETO - Server Component busca dados
// app/[module]/page.tsx
export default async function ModulePage() {
  const data = await fetchAllModuleData();

  return <ModuleClient initialData={data} />;
}

// ❌ ERRADO - Client Component busca dados
export default function ModulePage() {
  const [data, setData] = useState();
  useEffect(() => {
    fetchData();
  }, []);
}
```

### 2. Estrutura de Arquivos

```
app/
  dashboard/
    page.tsx                    # Server Component principal
    layout.tsx                  # Layout com providers
components/
  dashboard/
    dashboard-client.tsx        # Client component com interatividade
    [feature]/
      [feature]-view.tsx       # Componente de apresentação
      [feature]-actions.tsx    # Server actions
lib/
  actions/
    dashboard/
      [feature]-actions.ts     # Data fetching functions
```

### 3. Convenção de Nomes

- `page.tsx` - Server Components (sem "use client")
- `*-client.tsx` - Client Components interativos
- `*-view.tsx` - Componentes de apresentação
- `*-actions.ts` - Server actions e data fetching
- Remover sufixos `-refactored`, `-server`, `-wrapper`

## 📁 Análise por Módulo

### 1. DASHBOARD (Visão Geral)

#### Estado Atual

- **Server Components não usados**: 35 arquivos em `_components/`
- **Padrão misto**: Alguns usando refactored, outros não
- **Client fetching**: Dados buscados via useEffect

#### Ações Necessárias

##### A. Remover

```bash
# Server components órfãos
rm -rf app/dashboard/_components/

# Versões antigas (onde existe refactored)
rm components/dashboard/visao-geral/financial-kpi-cards.tsx
rm components/dashboard/visao-geral/financial-bank-distribution-chart.tsx
rm components/dashboard/visao-geral/financial-debt-charts.tsx
rm components/dashboard/visao-geral/financial-debt-evolution-chart.tsx
rm components/dashboard/visao-geral/financial-debt-type-distribution-chart.tsx
rm components/dashboard/visao-geral/financial-debt-type-distribution-all-safras-chart.tsx
rm components/dashboard/visao-geral/financial-total-liabilities-chart.tsx
rm components/dashboard/visao-geral/financial-indicators-chart.tsx

# Refactored não utilizados
rm components/dashboard/visao-geral/overview-kpi-cards-refactored.tsx
rm components/dashboard/organization-switcher-refactored.tsx
rm components/dashboard/weather-ticker-refactored.tsx

# Client wrappers desnecessários
rm components/dashboard/visao-geral/financial-dashboard-section-client.tsx
```

##### B. Renomear

```bash
# Remover sufixo -refactored dos que estão em uso
mv components/dashboard/visao-geral/financial-kpi-cards-refactored.tsx components/dashboard/visao-geral/financial-kpi-cards.tsx
# ... fazer para todos os -refactored em uso
```

##### C. Refatorar

```tsx
// app/dashboard/page.tsx
import { fetchDashboardData } from "@/lib/actions/dashboard/dashboard-actions";

export default async function DashboardPage() {
  const user = await verifyUserPermission();
  const organizationId = await getOrganizationId(user);

  // Buscar TODOS os dados no servidor
  const data = await fetchDashboardData(organizationId);

  return (
    <DashboardLayout>
      <DashboardClient
        initialData={{
          financial: data.financial,
          production: data.production,
          properties: data.properties,
          projections: data.projections,
        }}
        organizationId={organizationId}
      />
    </DashboardLayout>
  );
}
```

### 2. AUTH (Autenticação)

#### Estado Atual

- ✅ Bem estruturado
- ❌ 3 componentes não utilizados já identificados

#### Ações Necessárias

- [x] Remover: `profile-form.tsx`, `full-profile-form.tsx`, `profile-image-upload.tsx`
- [ ] Manter estrutura atual (já segue boas práticas)

### 3. FINANCIAL (Financeiro)

#### Estado Atual

- **15 componentes -refactored**
- **Múltiplos client wrappers**
- **Server components em `_components/`**

#### Ações Necessárias

##### A. Remover

```bash
# Todos os -refactored (após migração)
rm components/financial/*/*-refactored.tsx

# Server components
rm app/dashboard/_components/*financ*.tsx
rm app/dashboard/_components/dividas-*.tsx
rm app/dashboard/_components/outras-*.tsx
rm app/dashboard/_components/receitas-*.tsx
```

##### B. Refatorar

```tsx
// app/dashboard/financial/page.tsx
export default async function FinancialPage() {
  const data = await fetchFinancialData(organizationId);

  return (
    <FinancialLayout>
      <FinancialPageClient initialData={data} />
    </FinancialLayout>
  );
}
```

### 4. PRODUCTION (Produção)

#### Estado Atual

- **Charts não migrados para refactored**
- **Config complexa com múltiplas entidades**
- **Server components em `_components/`**

#### Ações Necessárias

##### A. Remover

```bash
# Server components
rm app/dashboard/_components/*production*.tsx
rm app/dashboard/_components/*area-plantada*.tsx
rm app/dashboard/_components/*produtividade*.tsx
rm app/dashboard/_components/*receita-chart*.tsx

# Refactored não utilizados
rm components/production/stats/*-refactored.tsx
```

##### B. Implementar

- Migrar charts para receber `initialData`
- Criar `production-actions.ts` unificado
- Refatorar page.tsx para buscar dados

### 5. ASSETS (Patrimonial)

#### Estado Atual

- **2 componentes -refactored**
- **Estrutura relativamente limpa**

#### Ações Necessárias

##### A. Remover

```bash
rm components/assets/asset-sales/asset-sale-form-refactored.tsx
rm components/assets/investments/investment-form-refactored.tsx
```

##### B. Refatorar

- Implementar data fetching no server
- Passar dados via props

### 6. PROPERTIES (Propriedades)

#### Estado Atual

- **2 componentes -refactored**
- **Server components em `_components/`**

#### Ações Necessárias

##### A. Remover

```bash
rm components/properties/property-list-refactored.tsx
rm components/properties/lease-list-refactored.tsx
rm app/dashboard/_components/property-list-server.tsx
rm app/dashboard/_components/lease-list-server.tsx
```

### 7. PROJECTIONS (Projeções)

#### Estado Atual

- **6 componentes -refactored**
- **Múltiplos wrappers e duplicações**

#### Ações Necessárias

##### A. Remover

```bash
rm components/projections/*/*-refactored.tsx
rm app/dashboard/_components/*projection*.tsx
rm app/dashboard/_components/fluxo-caixa-server.tsx
rm app/dashboard/_components/dre-*.tsx
rm app/dashboard/_components/balanco-*.tsx
```

### 8. INDICATORS (Indicadores)

#### Estado Atual

- **1 componente -refactored**
- **Estrutura mais simples**

#### Ações Necessárias

##### A. Remover

```bash
rm components/indicators/rating/rating-metrics-tab-refactored.tsx
```

## 🚀 Plano de Execução

### Fase 1: Dashboard (Prioridade Alta)

1. [ ] Criar `lib/actions/dashboard/dashboard-actions.ts`
2. [ ] Refatorar `app/dashboard/page.tsx` para buscar todos os dados
3. [ ] Criar `components/dashboard/dashboard-client.tsx`
4. [ ] Remover todos os client wrappers e server components não usados
5. [ ] Renomear componentes removendo `-refactored`
6. [ ] Testar funcionalidades

### Fase 2: Financial

1. [ ] Unificar data fetching em `financial-actions.ts`
2. [ ] Refatorar página principal
3. [ ] Migrar componentes para receber `initialData`
4. [ ] Limpar arquivos duplicados

### Fase 3: Production

1. [ ] Migrar charts para padrão com `initialData`
2. [ ] Unificar actions
3. [ ] Refatorar página
4. [ ] Remover duplicações

### Fase 4: Outros Módulos

1. [ ] Assets
2. [ ] Properties
3. [ ] Projections
4. [ ] Indicators

## 📊 Métricas de Sucesso

### Antes

- ~200+ componentes com duplicações
- Data fetching no cliente
- Performance sub-ótima
- Código confuso

### Depois

- ~100 componentes (50% redução)
- Data fetching no servidor
- Performance otimizada
- Código limpo e consistente

## 🔧 Ferramentas e Scripts

### Script de Limpeza

```bash
#!/bin/bash
# cleanup-refactored.sh

# Listar todos os arquivos -refactored
find . -name "*-refactored.tsx" -type f

# Listar server components não usados
find app/dashboard/_components -name "*.tsx" -type f

# Contar arquivos por padrão
echo "Refactored: $(find . -name "*-refactored.tsx" | wc -l)"
echo "Server components: $(find app -name "*-server.tsx" | wc -l)"
echo "Client wrappers: $(find . -name "*-client.tsx" | wc -l)"
```

### Checklist de Migração por Componente

- [ ] Identificar se está em uso
- [ ] Criar versão que recebe `initialData`
- [ ] Mover data fetching para server
- [ ] Remover useEffect de data fetching
- [ ] Testar funcionalidade
- [ ] Remover versão antiga
- [ ] Atualizar imports

## 🎯 Resultado Final Esperado

```
app/
  dashboard/
    page.tsx                    # Busca todos os dados
    layout.tsx                  # Providers
  financial/
    page.tsx                    # Busca dados financeiros
  production/
    page.tsx                    # Busca dados de produção

components/
  dashboard/
    dashboard-client.tsx        # Recebe initialData
    financial/
      kpi-cards.tsx            # Sem -refactored, recebe data
      bank-distribution.tsx     # Sem -refactored, recebe data

lib/
  actions/
    dashboard/
      dashboard-actions.ts      # Todas as queries do dashboard
    financial/
      financial-actions.ts      # Todas as queries financeiras
```

## ⚠️ Pontos de Atenção

1. **Não quebrar funcionalidades** - Testar após cada mudança
2. **Manter interatividade** - Client components onde necessário
3. **Performance** - Usar Suspense boundaries apropriados
4. **Cache** - Implementar cache de dados onde fizer sentido
5. **Tipos** - Manter TypeScript strict

## 📅 Timeline Estimado

- **Fase 1 (Dashboard)**: 2-3 dias
- **Fase 2 (Financial)**: 2 dias
- **Fase 3 (Production)**: 2 dias
- **Fase 4 (Outros)**: 3 dias
- **Total**: ~10 dias de trabalho focado

## 🔄 Processo de Migração Modular

Para cada módulo:

1. Análise completa de uso
2. Identificar dados necessários
3. Criar server actions
4. Refatorar page.tsx
5. Migrar componentes
6. Testar tudo
7. Limpar código morto
8. Documentar mudanças
