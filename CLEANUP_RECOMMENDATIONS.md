# SR Consultoria - Recomendações de Limpeza de Código

## ⚠️ IMPORTANTE: Análise Atualizada

Após uma análise mais profunda, descobri que a aplicação usa um padrão específico onde:

- Componentes `-refactored.tsx` são versões Client Components otimizadas
- Componentes `-server.tsx` no diretório `_components` são Server Components que importam os refactored
- Este é um padrão válido do Next.js 15 para otimização de performance

## ✅ Arquivos SEGUROS para Deletar

### 1. Diretórios de API Vazios

```bash
rm -rf app/api/chat-test/
rm -rf app/api/chat-groq-test/
rm -rf app/api/organization-stats/
```

### 2. Arquivos de Backup

```bash
rm components/production/stats/area-plantada-chart-old.tsx
rm supabase/migrations/20250627_create_projection_scenarios.sql.bak
```

### 3. Componentes Mobile Não Utilizados

```bash
rm components/ui/mobile-chart.tsx
rm components/ui/mobile-form.tsx
```

### 4. Variantes do Market Ticker Não Utilizadas

```bash
rm components/dashboard/market-ticker-sse.tsx
rm components/dashboard/market-ticker-client.tsx
rm components/dashboard/market-ticker-wrapper.tsx
```

### 5. CSV e Arquivos de Dados Antigos no Root

```bash
rm cotacoes_cambio_rows.csv
rm dividas_bancarias_rows.csv
rm arrendamentos_rows.csv
```

### 6. Diretório de Dados Antigos

```bash
rm -rf dados/
```

## ⚠️ NÃO DELETAR

### 1. Componentes Refactored

- Todos os arquivos `-refactored.tsx` estão em uso ativo
- São parte da arquitetura de otimização Next.js 15

### 2. Componentes Server (\_components)

- Os arquivos `-server.tsx` em `_components` são wrappers necessários
- Fazem parte do padrão RSC (React Server Components)

### 3. Mobile Components em Uso

- `mobile-modal.tsx`
- `mobile-table.tsx`
- `mobile-tabs.tsx`
- `mobile-nav.tsx`
- `mobile-filters.tsx`
- `dividas-bancarias-listing-mobile.tsx`
- `planting-area-list-mobile.tsx`
- `mobile-dashboard-view.tsx`

### 4. Document Components

- `document-upload.tsx` - Usado em values-onus-step
- `property-form-simple.tsx` - Usado em property-form-modal

## 📋 Script de Limpeza Seguro

```bash
#!/bin/bash

# Limpeza segura de código morto
echo "🧹 Iniciando limpeza segura..."

# 1. Remover diretórios de API vazios
rm -rf app/api/chat-test/
rm -rf app/api/chat-groq-test/
rm -rf app/api/organization-stats/

# 2. Remover arquivos de backup
rm -f components/production/stats/area-plantada-chart-old.tsx
rm -f supabase/migrations/20250627_create_projection_scenarios.sql.bak

# 3. Remover componentes mobile não utilizados
rm -f components/ui/mobile-chart.tsx
rm -f components/ui/mobile-form.tsx

# 4. Remover variantes não utilizadas do market ticker
rm -f components/dashboard/market-ticker-sse.tsx
rm -f components/dashboard/market-ticker-client.tsx
rm -f components/dashboard/market-ticker-wrapper.tsx

# 5. Remover CSVs antigos
rm -f cotacoes_cambio_rows.csv
rm -f dividas_bancarias_rows.csv
rm -f arrendamentos_rows.csv

# 6. Remover diretório de dados antigos
rm -rf dados/

echo "✅ Limpeza concluída!"
```

## 🔍 Arquivos que Requerem Investigação Manual

### 1. Diretório docs\_

- Contém PDFs e documentação antiga
- Verificar se ainda é necessário antes de deletar

### 2. Arquivos de Cache e DB

- `lib/cache/` - Verificar se é usado em produção
- `lib/db/` - Verificar se contém lógica importante

### 3. Scripts Antigos

- Verificar scripts em `scripts/` que podem ser obsoletos

## 📊 Impacto da Limpeza

### Limpeza Segura:

- **Arquivos a remover**: ~15-20 arquivos
- **Redução de código**: ~5-10%
- **Risco**: Baixo

### Benefícios:

- Menos confusão com arquivos duplicados
- Estrutura mais limpa
- Manutenção mais fácil

## 🚀 Próximos Passos

1. **Fazer backup**: `git checkout -b cleanup-backup`
2. **Executar limpeza segura**: Use o script acima
3. **Testar aplicação**: `npm run dev` e `npm run build`
4. **Verificar funcionalidades**: Testar principais features
5. **Commit se tudo funcionar**: `git add . && git commit -m "chore: remove dead code"`

## 💡 Recomendações Futuras

1. **Documentar padrão de arquitetura**: Criar documento explicando o padrão refactored/server
2. **Convenção de nomes**: Estabelecer quando usar -client, -server, -refactored
3. **Processo de deprecação**: Marcar componentes obsoletos antes de deletar
4. **Limpeza regular**: Fazer revisão trimestral de código morto
