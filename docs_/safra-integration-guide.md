# Guia de Integração - Seletor de Safra nos Formulários Financeiros

## ✅ Já Implementados

### 1. **Dívidas Bancárias/Trading** (Consolidado)
- ✅ Pagamento por Safra (SafraValueEditor)
- ✅ Campo tipo_instituicao (BANCO/TRADING/OUTRO)
- ✅ Aba Trading removida da navegação

### 2. **Dívidas Imóveis**
- ✅ Pagamento por Safra (SafraValueEditor)
- ✅ Campo safra_id opcional

### 3. **Fornecedores**
- ✅ Pagamento por Safra (SafraValueEditor)
- ✅ Campo safra_id opcional

## 📋 Pendentes - Seletor de Safra Simples

Os formulários abaixo precisam apenas de um seletor de safra simples (não pagamentos por safra):

### Template de Implementação

Para cada formulário, siga este padrão:

#### 1. **Imports** (adicionar ao topo):
```typescript
import { Harvest } from "@/schemas/production";
import { getHarvests } from "@/lib/actions/production-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
```

#### 2. **Estados** (adicionar após isSubmitting):
```typescript
const [harvests, setHarvests] = useState<Harvest[]>([]);
const [isLoadingHarvests, setIsLoadingHarvests] = useState(false);

// Carregar safras quando o modal abrir
useEffect(() => {
  if (open && organizationId) {
    loadHarvests();
  }
}, [open, organizationId]);

const loadHarvests = async () => {
  try {
    setIsLoadingHarvests(true);
    const harvestsData = await getHarvests(organizationId);
    setHarvests(harvestsData);
  } catch (error) {
    console.error("Erro ao carregar safras:", error);
    toast.error("Erro ao carregar safras");
  } finally {
    setIsLoadingHarvests(false);
  }
};
```

#### 3. **DefaultValues** (adicionar ao schema):
```typescript
safra_id: existingItem?.safra_id || "",
```

#### 4. **Campo no Formulário** (adicionar no JSX):
```tsx
<FormField
  control={form.control}
  name="safra_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Safra</FormLabel>
      <Select
        disabled={isSubmitting || isLoadingHarvests}
        onValueChange={field.onChange}
        defaultValue={field.value}
        value={field.value}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={isLoadingHarvests ? "Carregando safras..." : "Selecione a safra"} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {harvests.map((harvest) => (
            <SelectItem key={harvest.id} value={harvest.id || ""}>
              {harvest.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

## 📂 Arquivos Pendentes

### 1. **Estoques**
- `components/financial/inventory/inventory-form.tsx`
- Schema já tem `safra_id` ✅

### 2. **Estoques Commodity**
- `components/financial/commodity-inventory/commodity-inventory-form.tsx`
- Schema já tem `safra_id` ✅

### 3. **Recebíveis**
- `components/financial/receivables/receivable-form.tsx`
- Schema já tem `safra_id` ✅

### 4. **Adiantamentos**
- `components/financial/advances/advance-form.tsx`
- Schema já tem `safra_id` ✅

### 5. **Empréstimos**
- `components/financial/loans/loan-form.tsx`
- Schema já tem `safra_id` ✅

## 🚀 Scripts SQL Executados

1. **add_safra_id_to_financial_tables.sql** - Adiciona safra_id em todas as tabelas
2. **add_tipo_instituicao_to_debts.sql** - Adiciona tipo de instituição nas dívidas

## 🎯 Resultado Final

Após implementar todos os formulários:
- ✅ Todos os dados financeiros conectados às safras específicas
- ✅ Relatórios por safra possíveis
- ✅ Análise financeira por período agrícola
- ✅ Melhor organização dos dados financeiros

## 📝 Próximos Passos

1. Execute os scripts SQL no banco de dados
2. Implemente os seletores de safra nos 5 formulários pendentes usando o template
3. Teste a funcionalidade completa
4. Considere criar filtros por safra nas listagens