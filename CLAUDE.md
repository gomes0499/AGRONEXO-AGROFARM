SR-Consultoria é uma aplicação SaaS multitenant para consultoria agrícola e financeira, focada especialmente em produtores rurais, fazendas e gestão de propriedades agrícolas. O sistema deve ser construído com as seguintes tecnologias:

- Next.js 15+ com App Router e React Server Components
- TypeScript para tipagem estática
- Tailwind CSS 4.0 para estilização
- shadcn/ui para componentes de interface
- Supabase para banco de dados, autenticação e armazenamento
- Resend para envio de emails transacionais
- Zod para validação de dados
- React Query para gerenciamento de estado no cliente

O sistema deve seguir as melhores práticas:

- Arquitetura multitenant (cada organização/produtor = 1 tenant)
- Server Components para conteúdo estático e Server Actions para operações
- Client Components apenas onde interatividade é necessária
- Empty states para todas as listas e dashboards
- Skeletons durante carregamento
- Layout responsivo (mobile, tablet, desktop)
- Validação de dados no cliente e servidor
- SEO otimizado
- Autenticação segura com verificação de email
