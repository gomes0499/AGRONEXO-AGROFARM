# Guia de Implementação - Moeda por Safra e Visualização em Dólar

## Visão Geral

Este guia explica como implementar a funcionalidade de seleção de moeda por safra e visualização em dólar no módulo financeiro.

## Componentes Criados

### 1. **CurrencyConfigModal** (`/components/financial/currency-config/currency-config-modal.tsx`)
- Modal para configurar a moeda principal e taxa de câmbio por safra
- Permite definir BRL ou USD como moeda principal para cada safra
- Define taxa de câmbio para conversões

### 2. **CurrencyViewToggle** (`/components/financial/currency-config/currency-view-toggle.tsx`)
- Toggle para alternar entre visualização em BRL, USD ou ambas
- Interface simples com botões R$, US$ e R$/US$

### 3. **CurrencyValueDisplay** (`/components/financial/common/currency-value-display.tsx`)
- Componente para exibir valores com conversão automática
- Mostra tooltip com valor original e taxa de câmbio
- Suporta modos: BRL, USD ou BOTH

### 4. **Funções Utilitárias** (`/lib/utils/currency-converter.ts`)
- `convertCurrency()`: Converte valores entre moedas
- `formatCurrencyWithConversion()`: Formata com conversão
- `getExchangeRateForSafra()`: Obtém taxa para safra específica

## Como Implementar

### 1. Em uma Listagem Financeira

```tsx
"use client";

import { useState } from "react";
import { CurrencyViewToggle } from "@/components/financial/currency-config/currency-view-toggle";
import { CurrencyValueDisplay } from "@/components/financial/common/currency-value-display";

export function FinancialListing({ items, safras }) {
  const [displayMode, setDisplayMode] = useState<"BRL" | "USD" | "BOTH">("BRL");
  const [currencyConfigs, setCurrencyConfigs] = useState([
    { safraId: "safra-1", moedaPrincipal: "BRL", taxaCambio: 5.00 },
    { safraId: "safra-2", moedaPrincipal: "USD", taxaCambio: 5.20 },
  ]);

  return (
    <div>
      {/* Controles de visualização */}
      <div className="flex justify-between mb-4">
        <h2>Listagem Financeira</h2>
        <CurrencyViewToggle
          currentView={displayMode}
          onViewChange={setDisplayMode}
        />
      </div>

      {/* Tabela com valores */}
      <Table>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.nome}</TableCell>
              <TableCell>
                <CurrencyValueDisplay
                  value={item.valor}
                  originalCurrency={item.moeda}
                  displayMode={displayMode}
                  exchangeRate={5.00} // Ou buscar da config da safra
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 2. No SafraValueEditor

```tsx
// Adicionar prop para exibir em múltiplas moedas
<SafraValueEditor
  values={values}
  onChange={onChange}
  safras={safras}
  currency={currency}
  displayMode={displayMode} // "BRL" | "USD" | "BOTH"
  exchangeRates={exchangeRates} // Mapa de taxas por safra
/>
```

### 3. Em Formulários

```tsx
// No formulário, permitir seleção de moeda por safra
<FormField
  name="moeda"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Moeda da Safra {safra.nome}</FormLabel>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BRL">R$ (Real)</SelectItem>
          <SelectItem value="USD">US$ (Dólar)</SelectItem>
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

## Armazenamento de Dados

### Opção 1: Local Storage (Implementado)
```typescript
// Salvar configurações no browser
localStorage.setItem("currencyConfigs", JSON.stringify(configs));
localStorage.setItem("displayCurrency", "USD");
```

### Opção 2: Banco de Dados (Recomendado)
```sql
-- Criar tabela para configurações de moeda
CREATE TABLE configuracoes_moeda_safra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id),
  safra_id UUID NOT NULL REFERENCES safras(id),
  moeda_principal moeda_tipo NOT NULL DEFAULT 'BRL',
  taxa_cambio DECIMAL(10,4) DEFAULT 5.0000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organizacao_id, safra_id)
);
```

## Exemplo de Uso Completo

```tsx
// Em um componente de dashboard
export function FinancialDashboard() {
  const [displayMode, setDisplayMode] = useState("BRL");
  const [configs, setConfigs] = useState([]);

  return (
    <div className="space-y-4">
      {/* Barra de controles */}
      <div className="flex justify-between items-center">
        <h1>Dashboard Financeiro</h1>
        <div className="flex gap-4">
          <CurrencyViewToggle
            currentView={displayMode}
            onViewChange={setDisplayMode}
          />
          <CurrencyConfigModal
            safras={safras}
            configs={configs}
            onSave={setConfigs}
          />
        </div>
      </div>

      {/* Cards com valores */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>Total Receitas</CardHeader>
          <CardContent>
            <CurrencyValueDisplay
              value={1000000}
              originalCurrency="BRL"
              displayMode={displayMode}
              exchangeRate={5.00}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## Considerações

1. **Performance**: Use memoização para cálculos de conversão em listas grandes
2. **Precisão**: Sempre armazene valores na moeda original
3. **UX**: Mostre tooltips com valores originais quando convertendo
4. **Consistência**: Use a mesma taxa de câmbio por safra em todo o sistema

## Próximos Passos

1. Integrar com o banco de dados para persistir configurações
2. Adicionar histórico de taxas de câmbio
3. Implementar atualização automática de taxas via API
4. Adicionar mais moedas (EUR, etc.) se necessário