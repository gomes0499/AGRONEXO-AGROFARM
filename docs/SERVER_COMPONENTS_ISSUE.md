# Problema com Server Components no Dashboard

## Situação Atual

### 1. Server Components Criados mas Não Utilizados
- Existem ~35 server components em `app/dashboard/_components/`
- Todos buscam dados no servidor (padrão correto do Next.js 15)
- **MAS não estão sendo usados**

### 2. Por que não estão sendo usados?

O problema está na arquitetura:

```
app/dashboard/page.tsx (Server Component)
  └── DashboardWithScenarios (Client Component - "use client")
        └── FinancialDashboardSectionClient (Client Component)
              └── Busca dados com useEffect
```

**Problema**: `DashboardWithScenarios` é um Client Component porque precisa de:
- Tabs interativas
- Context providers
- Estado local

**Limitação**: Client Components não podem importar Server Components diretamente.

## Solução Ideal

### Opção 1: Reestruturar para Server-First (Recomendado)

```tsx
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchAllData(); // Buscar TODOS os dados aqui
  
  return (
    <DashboardWithScenarios 
      initialFinancialData={data.financial}
      initialProductionData={data.production}
      // ... passar todos os dados
    />
  );
}
```

### Opção 2: Separar Tabs em Páginas

```
/dashboard/overview
/dashboard/financial
/dashboard/production
```

Cada rota seria um Server Component que busca seus próprios dados.

### Opção 3: Usar Parallel Routes (Next.js 15)

```tsx
// app/dashboard/@financial/page.tsx (Server Component)
export default async function FinancialTab() {
  const data = await fetchFinancialData();
  return <FinancialDashboard data={data} />;
}

// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  financial,
  production,
}: {
  children: React.ReactNode;
  financial: React.ReactNode;
  production: React.ReactNode;
}) {
  return (
    <Tabs>
      <TabsContent value="financial">{financial}</TabsContent>
      <TabsContent value="production">{production}</TabsContent>
    </Tabs>
  );
}
```

## Impacto Atual

1. **Performance**: Dados são buscados no cliente (useEffect) em vez do servidor
2. **Código duplicado**: Server components existem mas não são usados
3. **Confusão**: Dois padrões diferentes coexistindo

## Recomendação

1. **Curto prazo**: Continuar com Client Components (atual)
2. **Médio prazo**: Migrar para Opção 1 (Server-First)
3. **Longo prazo**: Considerar Opção 2 ou 3 para melhor performance

## Por que os Server Components foram criados?

Provavelmente alguém começou a migração mas encontrou o problema de arquitetura e parou no meio, deixando os server components órfãos.