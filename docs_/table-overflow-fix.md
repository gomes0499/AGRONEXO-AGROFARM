# Correção para Rolamento Horizontal em Tabelas

Quando trabalhamos com tabelas que podem ter muitas colunas, é importante garantir que o rolamento horizontal fique contido dentro da tabela, e não afete a página inteira. Isso evita que o conteúdo vá para trás da sidebar e cause problemas de usabilidade.

## Estrutura do Layout

A correção para evitar que a página inteira rode horizontalmente é aplicada em três níveis:

1. **Layout principal do dashboard**: O container principal tem `overflow-x-hidden` para evitar que toda a página role horizontalmente
2. **SidebarInset**: O componente que contém o conteúdo principal tem `overflow-x-hidden` para garantir que não haja rolagem horizontal
3. **Container da tabela**: Cada tabela é envolvida em um container com `overflow-x-auto` e `maxWidth: 100%` para garantir que apenas a tabela tenha rolagem horizontal

## Solução Implementada

Foi criado um componente `ResponsiveTableWrapper` que encapsula qualquer tabela e garante que o rolamento horizontal fique contido nela:

```tsx
<ResponsiveTableWrapper>
  <Table>
    {/* conteúdo da tabela */}
  </Table>
</ResponsiveTableWrapper>
```

## Como Implementar em Novas Tabelas

Para garantir que todas as tabelas tenham o comportamento correto de rolamento horizontal, siga estas diretrizes:

1. **Opção 1**: Use o componente `ResponsiveTableWrapper`

```tsx
import { ResponsiveTableWrapper } from "@/components/projections/common/responsive-table-wrapper";

// Em seu componente de tabela:
<CardContent className="p-6">
  <ResponsiveTableWrapper>
    <Table>
      {/* conteúdo da tabela */}
    </Table>
  </ResponsiveTableWrapper>
</CardContent>
```

2. **Opção 2**: Aplique os estilos diretamente

Se não quiser usar o componente, aplique os seguintes estilos:

```tsx
<div className="overflow-x-auto overflow-y-hidden border rounded-md" style={{ maxWidth: '100%' }}>
  <div className="min-w-max">
    <Table>
      {/* conteúdo da tabela */}
    </Table>
  </div>
</div>
```

## Lembre-se

- Sempre use `overflow-x-hidden` no layout pai para evitar rolagem horizontal da página
- Mantenha o `overflow-x-auto` apenas no container da tabela
- Use `style={{ maxWidth: '100%' }}` para garantir que o container da tabela não ultrapasse a largura disponível
- Use `min-w-max` no container interno para garantir que a tabela não seja comprimida

Estas diretrizes devem ser seguidas em todos os módulos do sistema que utilizam tabelas com muitas colunas, especialmente:
- Projeções
- Financeiro
- Produção
- Comercial