# SR-Consultoria Database Scripts

Este diretório contém scripts SQL para configurar e manter o banco de dados Supabase para a aplicação SR-Consultoria.

## Arquivos Disponíveis

- `tables_only.sql` - Cria apenas as tabelas do banco de dados
- `drop_everything.sql` - Remove todas as tabelas e dados (use com cuidado!)
- `super-admin.sql` - Configurações para super administrador
- `add_fixed_policies.sql` - Adiciona políticas de segurança RLS (Row Level Security)
- `apply_functions.sql` - Adiciona funções RPC ao banco de dados
- `functions.sql` - Arquivo de referência com todas as funções RPC

## Como aplicar os scripts

### Aplicando funções RPC

Para resolver o problema de listagem de membros de organizações, siga os passos abaixo para aplicar a função RPC necessária:

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Navegue até o seu projeto > SQL Editor
3. Crie uma nova query
4. Cole o conteúdo do arquivo `apply_functions.sql`
5. Execute a query

A função principal `get_organization_members` permite obter dados reais de usuários ao listar membros da organização, resolvendo o problema de exibição de placeholders em vez de nomes reais.

## Estrutura da Função

A função `get_organization_members` realiza um JOIN entre:
- Tabela `associacoes` - Contém as associações entre usuários e organizações
- Tabela `auth.users` - Contém os dados de autenticação e perfil de usuários

Ela retorna informações completas de cada membro, incluindo:
- ID da associação
- ID do usuário
- ID da organização
- Função/papel do usuário
- Nome do usuário (extraído dos metadados)
- Email do usuário
- Informações de acesso

## Testando a Função

Você pode testar a função diretamente no SQL Editor com o comando:

```sql
SELECT * FROM get_organization_members('id-da-organizacao-aqui');
```

Substitua `'id-da-organizacao-aqui'` pelo UUID real da organização que deseja consultar.