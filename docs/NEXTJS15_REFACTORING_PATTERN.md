# Padrão de Refatoração Next.js 15 - SR Consultoria

## Visão Geral

O projeto está em processo de migração para o padrão Next.js 15 com React Server Components (RSC). O objetivo é otimizar performance movendo a busca de dados para o servidor.

## Padrão Atual de Arquitetura

### 1. **Server Component (Page Level)**
- Localização: `app/dashboard/page.tsx`
- Responsabilidade: Autenticação, verificação de permissões, estrutura da página
- Busca dados iniciais e passa para componentes client

### 2. **Client Wrapper Component**
- Exemplo: `DashboardWithScenarios.tsx`, `FinancialDashboardSectionClient.tsx`
- Responsabilidade: 
  - Gerenciamento de estado local
  - Carregamento de dados com `useEffect`
  - Renderização condicional baseada em loading states
  - Passa dados para componentes apresentacionais

### 3. **Presentational Components (Refactored)**
- Exemplo: `financial-kpi-cards-refactored.tsx`
- Responsabilidade:
  - Recebe `initialData` como prop
  - Componente "use client" puro
  - Pode fazer atualizações locais via transitions
  - Foco em apresentação e interatividade

## Estado Atual da Migração

### ✅ Componentes Migrados (usando padrão refactored):
- **Financial Charts**: Todos os charts financeiros do dashboard
  - `financial-kpi-cards-refactored.tsx`
  - `financial-bank-distribution-chart-refactored.tsx`
  - `financial-debt-type-distribution-chart-refactored.tsx`
  - E outros...

### ❌ Componentes NÃO Migrados (ainda usando padrão antigo):
- **Overview Components**:
  - `overview-kpi-cards.tsx` (não usa refactored)
  - `organization-switcher.tsx` (não usa refactored)
  - `weather-ticker.tsx` (não usa refactored)
  
- **Production Components**:
  - Todos os charts de produção ainda usam versão original
  - `production-kpi-cards-wrapper.tsx` (não usa refactored)

## Padrão de Migração Recomendado

### Antes (Componente Client tradicional):
```tsx
// components/dashboard/example-component.tsx
"use client";

export function ExampleComponent({ organizationId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(organizationId).then(setData);
  }, [organizationId]);

  if (loading) return <Skeleton />;
  
  return <div>{/* render data */}</div>;
}
```

### Depois (Padrão Refactored):

#### 1. Client Wrapper (se necessário):
```tsx
// components/dashboard/example-section-client.tsx
"use client";

export function ExampleSectionClient({ organizationId }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    getExampleData(organizationId).then(setData);
  }, [organizationId]);

  return data && <ExampleComponentRefactored initialData={data} />;
}
```

#### 2. Componente Refactored:
```tsx
// components/dashboard/example-component-refactored.tsx
"use client";

interface ExampleComponentRefactoredProps {
  organizationId: string;
  initialData: ExampleData;
}

export function ExampleComponentRefactored({ 
  organizationId, 
  initialData 
}: ExampleComponentRefactoredProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // Componente focado em apresentação
  // Atualizações locais se necessário
  
  return <div>{/* render */}</div>;
}
```

## Problemas Identificados

1. **Padrão Misto**: Alguns componentes usam refactored, outros não
2. **Duplicação**: Muitos componentes têm versões original e refactored
3. **Server Components não utilizados**: Diretório `_components` com arquivos não referenciados
4. **Falta de consistência**: Não há padrão claro sobre quando usar cada abordagem

## Próximos Passos

1. **Completar migração dos componentes restantes**:
   - `overview-kpi-cards.tsx` → `overview-kpi-cards-refactored.tsx`
   - Production charts → versões refactored
   - Organization switcher → versão refactored

2. **Remover duplicações** após migração completa

3. **Estabelecer convenção clara**:
   - Quando usar client wrappers
   - Quando passar dados do server
   - Como nomear componentes

4. **Documentar o padrão** para futuros desenvolvimentos