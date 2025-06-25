# Exemplo de Integração - Visualização em Dólar nas Abas Financeiras

## Como integrar nas listagens existentes

### 1. Atualizar a Action para incluir dados da safra

```typescript
// Em /lib/actions/financial-actions/dividas-bancarias.ts

export async function getDividasBancariasPorOrganizacao(organizacaoId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('dividas_bancarias')
    .select(`
      *,
      safra:safras!safra_id (
        id,
        nome,
        taxa_cambio_usd,
        moeda_principal
      )
    `)
    .eq('organizacao_id', organizacaoId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### 2. Atualizar o Schema para incluir campos de câmbio

```typescript
// Em /schemas/financial/dividas_bancarias.ts

export const dividasBancariasSchema = z.object({
  // ... campos existentes ...
  safra_id: z.string().uuid().optional(),
  taxa_cambio_contratacao: z.number().optional(),
  safra: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    taxa_cambio_usd: z.number(),
    moeda_principal: z.enum(['BRL', 'USD'])
  }).optional()
});
```

### 3. Adicionar Toggle de Moeda na Listagem

```typescript
// Em /components/financial/dividas-bancarias/dividas-bancarias-listing.tsx

"use client";

import { useState } from "react";
import { CurrencyViewToggle } from "@/components/financial/currency-config/currency-view-toggle";
import { CurrencyValueDisplay } from "@/components/financial/common/currency-value-display";

export function DividasBancariasListing({ initialDividasBancarias }) {
  const [displayMode, setDisplayMode] = useState<"BRL" | "USD" | "BOTH">("BRL");
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dívidas Bancárias</CardTitle>
          <CurrencyViewToggle
            currentView={displayMode}
            onViewChange={setDisplayMode}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableBody>
            {dividasBancarias.map((divida) => {
              const taxaCambio = divida.taxa_cambio_contratacao || 
                               divida.safra?.taxa_cambio_usd || 
                               5.00;
              
              return (
                <TableRow key={divida.id}>
                  <TableCell>{divida.instituicao_bancaria}</TableCell>
                  <TableCell>
                    <CurrencyValueDisplay
                      value={divida.valor_total}
                      originalCurrency={divida.moeda}
                      displayMode={displayMode}
                      exchangeRate={taxaCambio}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### 4. No SafraValueEditor - Mostrar valores convertidos

```typescript
// Atualizar o SafraValueEditor para suportar visualização em múltiplas moedas

export function SafraValueEditor({
  values,
  onChange,
  safras,
  currency = "BRL",
  displayMode = "BRL", // Novo prop
  exchangeRates = {}, // Mapa de taxas por safra
}) {
  // Renderizar valores com conversão
  const renderValue = (safraId: string, valor: number) => {
    const safra = safras.find(s => s.id === safraId);
    const taxaCambio = exchangeRates[safraId] || safra?.taxa_cambio_usd || 5.00;
    
    return (
      <CurrencyValueDisplay
        value={valor}
        originalCurrency={currency}
        displayMode={displayMode}
        exchangeRate={taxaCambio}
      />
    );
  };
  
  // ... resto do componente
}
```

### 5. Adicionar no Dashboard Financeiro

```typescript
// Em /app/dashboard/financial/page.tsx

export default async function FinancialPage() {
  // ... código existente ...
  
  return (
    <div>
      {/* Adicionar controle global de visualização */}
      <div className="flex justify-end mb-4 px-6">
        <CurrencyViewToggle
          currentView="BRL"
          onViewChange={(view) => {
            // Salvar preferência no localStorage ou contexto
            localStorage.setItem('preferredCurrency', view);
          }}
        />
      </div>
      
      {/* Resto do dashboard... */}
    </div>
  );
}
```

## Vantagens desta abordagem

1. **Taxa de câmbio por safra**: Cada safra pode ter sua própria taxa, refletindo a realidade do mercado
2. **Taxa especial de contratação**: Permite override da taxa da safra para casos específicos
3. **Visualização flexível**: Usuário escolhe como quer ver os valores
4. **Tooltips informativos**: Mostra valor original e taxa usada
5. **Persistência de preferência**: Salva a escolha do usuário

## Fluxo de dados

1. **Banco de dados**: 
   - Safra tem `taxa_cambio_usd`
   - Registros financeiros podem ter `taxa_cambio_contratacao` (override)

2. **Conversão**:
   - Usa taxa de contratação se disponível
   - Senão usa taxa da safra
   - Senão usa taxa padrão (5.00)

3. **Visualização**:
   - BRL: Todos valores em reais
   - USD: Todos valores em dólares
   - BOTH: Mostra ambos lado a lado

## Exemplo de uso completo

```typescript
// Dados vindos do banco
const divida = {
  id: "123",
  instituicao_bancaria: "Banco do Brasil",
  moeda: "BRL",
  valor_total: 1000000,
  safra: {
    id: "safra-2024",
    nome: "2024/25",
    taxa_cambio_usd: 5.20
  },
  taxa_cambio_contratacao: null // Usa taxa da safra
};

// Visualização em USD
// Valor convertido: R$ 1.000.000 / 5.20 = US$ 192.307,69
```