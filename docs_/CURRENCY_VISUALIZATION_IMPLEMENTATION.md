# Implementação da Visualização em Dólar - Módulo Financeiro

## Resumo da Implementação

Implementamos um sistema completo de visualização de valores em múltiplas moedas (BRL/USD) baseado na taxa de câmbio específica de cada safra, conforme solicitado.

## Componentes Implementados

### 1. CurrencyViewToggle
- Toggle para alternar entre visualização em R$, US$ ou ambas
- Localização: `/components/financial/currency-config/currency-view-toggle.tsx`

### 2. CurrencyValueDisplay
- Componente que exibe valores com conversão automática
- Mostra tooltip com valor original e taxa de câmbio
- Localização: `/components/financial/common/currency-value-display.tsx`

### 3. Utilitários de Conversão
- Funções para converter valores entre moedas
- Localização: `/lib/utils/currency-converter.ts`

## Banco de Dados

### Migração Criada
```sql
-- /database/migrations/0006_add_exchange_rate_to_financial_tables.sql

-- Adiciona campos de taxa de câmbio nas safras
ALTER TABLE safras 
ADD COLUMN IF NOT EXISTS taxa_cambio_usd DECIMAL(10,4) DEFAULT 5.0000,
ADD COLUMN IF NOT EXISTS moeda_principal moeda_tipo DEFAULT 'BRL';

-- Adiciona referência de safra nas tabelas financeiras
ALTER TABLE dividas_bancarias
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id),
ADD COLUMN IF NOT EXISTS taxa_cambio_contratacao DECIMAL(10,4);
```

## Exemplo de Implementação - Dívidas Bancárias

### 1. Atualização da Action
```typescript
// /lib/actions/financial-actions/dividas-bancarias.ts
export async function getDividasBancarias(organizacaoId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .select(`
      *,
      safra:safras!safra_id (
        id,
        nome,
        taxa_cambio_usd,
        moeda_principal
      )
    `)
    .eq("organizacao_id", organizacaoId);
```

### 2. Componente de Listagem Atualizado
```typescript
// /components/financial/dividas-bancarias/dividas-bancarias-listing.tsx

export function DividasBancariasListing({
  organization,
  initialDividasBancarias,
  safras = [],
}: DividasBancariasListingProps) {
  const [displayMode, setDisplayMode] = useState<"BRL" | "USD" | "BOTH">("BRL");

  // Função para obter taxa de câmbio
  const getExchangeRate = (divida: any) => {
    if (divida.taxa_cambio_contratacao) {
      return divida.taxa_cambio_contratacao;
    }
    if (divida.safra?.taxa_cambio_usd) {
      return divida.safra.taxa_cambio_usd;
    }
    return 5.00; // Taxa padrão
  };

  return (
    <Card>
      <CardHeaderPrimary
        action={
          <div className="flex items-center gap-2">
            <CurrencyViewToggle
              currentView={displayMode}
              onViewChange={setDisplayMode}
            />
            <Button>Nova Dívida</Button>
          </div>
        }
      />
      
      <Table>
        <TableCell>
          <CurrencyValueDisplay
            value={calculateTotal(divida)}
            originalCurrency={divida.moeda || "BRL"}
            displayMode={displayMode}
            exchangeRate={getExchangeRate(divida)}
          />
        </TableCell>
      </Table>
    </Card>
  );
}
```

## Como Funciona

### 1. Taxa de Câmbio por Safra
- Cada safra pode ter sua própria taxa de câmbio (`taxa_cambio_usd`)
- Define-se a moeda principal da safra (`moeda_principal`)

### 2. Taxa de Câmbio Específica
- Registros financeiros podem ter taxa específica de contratação
- Prioridade: taxa_contratacao > taxa_safra > taxa_padrão (5.00)

### 3. Visualização
- **BRL**: Todos valores em reais
- **USD**: Todos valores convertidos para dólares
- **BOTH**: Mostra ambos os valores lado a lado

### 4. Conversão
```typescript
// Exemplo de conversão
const valorBRL = 1000000;
const taxaCambio = divida.safra.taxa_cambio_usd || 5.00;
const valorUSD = valorBRL / taxaCambio; // US$ 192,307.69
```

## Próximos Passos para Implementar em Outras Abas

### 1. Dívidas de Terras
```typescript
// Atualizar getDividasTerras para incluir safra
// Adicionar CurrencyViewToggle no componente
// Usar CurrencyValueDisplay para valores
```

### 2. Caixa e Disponibilidades
```typescript
// Já tem safra_id, só adicionar visualização
// Implementar toggle de moeda
// Usar CurrencyValueDisplay
```

### 3. Outras Despesas
```typescript
// Adicionar referência de safra
// Implementar conversão baseada na safra
```

## Aplicar as Migrações

Para ativar a funcionalidade, execute as migrações:

```bash
# Aplicar migração de categorias financeiras
psql $DATABASE_URL < /database/migrations/0005_update_financial_categories.sql

# Aplicar migração de taxa de câmbio
psql $DATABASE_URL < /database/migrations/0006_add_exchange_rate_to_financial_tables.sql
```

## Configuração de Taxa de Câmbio

### 1. Por Safra (Admin)
```sql
-- Atualizar taxa de câmbio de uma safra
UPDATE safras 
SET taxa_cambio_usd = 5.20,
    moeda_principal = 'BRL'
WHERE id = 'safra-2024-id';
```

### 2. Por Registro (Override)
```sql
-- Taxa específica para uma dívida
UPDATE dividas_bancarias
SET taxa_cambio_contratacao = 5.35
WHERE id = 'divida-id';
```

## Benefícios

1. **Flexibilidade**: Cada safra tem sua própria taxa
2. **Precisão**: Taxa específica de contratação quando necessário
3. **Usabilidade**: Usuário escolhe como visualizar
4. **Transparência**: Tooltips mostram detalhes da conversão
5. **Consistência**: Mesma lógica em todo o sistema

## Considerações Importantes

1. **Performance**: Conversões são feitas no cliente
2. **Armazenamento**: Valores sempre salvos na moeda original
3. **Histórico**: Taxa de câmbio é preservada no registro
4. **Auditoria**: Sistema mantém rastreabilidade das conversões