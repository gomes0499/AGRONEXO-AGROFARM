# SR-Consultoria - Documentação dos Módulos do Sistema 

## Visão Geral

SR-Consultoria é uma aplicação SaaS multitenant desenvolvida para consultoria agrícola e financeira, focada em produtores rurais, fazendas e gestão de propriedades agrícolas. O sistema oferece uma solução completa para gestão patrimonial, produção, finanças e planejamento estratégico do agronegócio.

## Estrutura de Navegação

### Arquitetura da Sidebar Principal

O sistema utiliza uma sidebar principal (`AppSidebar`) localizada em `/components/dashboard/app-sidebar.tsx` com os seguintes componentes:

1. **Header**: Logo da aplicação com link para dashboard
2. **Navegação Principal** (`NavMain`): Menu principal com os módulos do sistema
3. **Navegação Secundária** (`NavSecondary`): Funcionalidades auxiliares
4. **Footer**: Menu do usuário (`NavUser`)

### Controle de Acesso

O sistema implementa controle de acesso baseado em roles:
- **Super Admin**: Acesso completo a todos os módulos
- **Usuários Normais**: Acesso apenas à Visão Geral, Tema e Suporte

```typescript
const isSuperAdmin = user.app_metadata?.is_super_admin === true;
```

### Estrutura de Navegação Principal

```typescript
navMain: [
  { title: "Visão Geral", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Organização", url: "/dashboard/organization", icon: BuildingIcon },
  { title: "Bens Imóveis", url: "/dashboard/properties", icon: MapIcon },
  { title: "Produção", url: "/dashboard/production", icon: BarChartIcon },
  { title: "Comercial", url: "/dashboard/commercial", icon: StoreIcon },
  { title: "Financeiro", url: "/dashboard/financial", icon: WalletIcon },
  { title: "Patrimonial", url: "/dashboard/assets", icon: LandmarkIcon },
  { title: "Projeções", url: "/dashboard/projections", icon: LineChartIcon },
  { title: "Indicadores", url: "/dashboard/indicators", icon: GaugeIcon }
]
```

### Navegação Secundária

```typescript
navSecondary: [
  { title: "Tema", url: "#theme", icon: PaintbrushIcon, isThemeToggle: true },
  { title: "Suporte", url: "/dashboard/support", icon: Brain }
]
```

### Funcionalidades Adicionais da Navegação

1. **Organization Switcher**: Permite alternar entre organizações (integrado no `NavMain`)
2. **Gerador de Relatórios**: Botão no `NavMain` para gerar relatórios estruturados
3. **Toggle de Tema**: Alternância entre tema claro/escuro no `NavSecondary`

## Módulos do Sistema

### 1. Módulo de Autenticação e Usuários

**Rota**: Sistema de autenticação (não é um módulo navegável)

**Objetivo**: Gerenciar autenticação, perfis de usuário e controle de acesso.

**Funcionalidades**:

- Login e registro de usuários
- Recuperação e redefinição de senha
- Verificação de email
- Gestão de perfil pessoal com upload de imagem
- Sistema de funções (Proprietário, Administrador, Membro)
- Onboarding com múltiplas etapas (dados pessoais, endereço, documentos)

### 2. Módulo de Organização

**Rota**: `/dashboard/organization`

**Objetivo**: Implementar arquitetura multitenant permitindo múltiplas organizações/produtores.

**Funcionalidades**:

- Criação e configuração de organizações
- Gestão de membros e permissões
- Sistema de convites por email
- Troca entre organizações
- Upload de logo da organização
- Estrutura de membros
- Perfis sociais (LinkedIn, Instagram, YouTube, etc.)

### 3. Módulo de Propriedades e Terras

**Rota**: `/dashboard/properties`

**Objetivo**: Gerenciar o patrimônio imobiliário rural.

**Funcionalidades**:

- Cadastro completo de propriedades rurais
- Gestão de arrendamentos com custos projetados
- Registro de benfeitorias e melhorias
- Visualização em mapas interativos
- Cálculo de estatísticas e indicadores
- Upload de imagens das propriedades
- Integração com dados do CAR (Cadastro Ambiental Rural)

### 4. Módulo de Produção

**Rota**: `/dashboard/production`

**Sub-navegação** (componente `ProductionNavClient`):
- Configurações
- Áreas de Plantio
- Produtividade
- Custos de Produção
- Rebanho
- Operações Pecuárias

**Objetivo**: Controlar toda a produção agrícola e pecuária.

**Funcionalidades**:

#### Configurações Base:

- Gestão de safras (ex: 2023/24)
- Cadastro de culturas (soja, milho, algodão, etc.)
- Sistemas de cultivo (sequeiro, irrigado)
- Ciclos produtivos (1ª, 2ª, 3ª safra)

#### Produção Agrícola:

- Áreas de plantio por cultura/safra/sistema
- Registro de produtividade (sc/ha, @/ha, kg/ha)
- Custos de produção categorizados:
  - Calcário e fertilizantes
  - Sementes e tratamento
  - Defensivos (herbicida, inseticida, fungicida)
  - Beneficiamento e serviços
  - Custos administrativos

#### Produção Pecuária:

- Cadastro de rebanho por categoria
- Operações pecuárias (confinamento, etc.)
- Volume de abate por safra

**Funcionalidades especiais**:

- Criação em lote para múltiplas safras
- Dashboards com gráficos de produção
- Cálculo automático de indicadores

### 5. Módulo Comercial

**Rota**: `/dashboard/commercial`

**Sub-navegação** (componente `CommercialNavClient`):
- Sementes
- Pecuária

**Objetivo**: Gestão das vendas e comercialização.

**Funcionalidades**:

- Vendas de sementes com análise de receitas e custos
- Vendas pecuárias com controle financeiro
- Relatórios de desempenho comercial

### 6. Módulo Financeiro

**Rota**: `/dashboard/financial`

**Sub-navegação** (componente `FinancialNavigation`):
- Dívidas Bancárias (`/dashboard/financial/dividas-bancarias`)
- Dívidas Terras (`/dashboard/financial/dividas-terras`)
- Dívidas Fornecedores (`/dashboard/financial/dividas-fornecedores`)
- Caixa e Disponibilidades (`/dashboard/financial/caixa-disponibilidades`)
- Financeiras (`/dashboard/financial/financeiras`)
- Outras Despesas (`/dashboard/financial/outras-despesas`)

**Objetivo**: Gestão financeira completa da operação.

**Funcionalidades**:

#### Gestão de Dívidas:

- **Dívidas Bancárias**: modalidade (custeio/investimento), indexadores, fluxo de pagamento
- **Dívidas com Tradings**: estrutura similar com empresas de comercialização
- **Dívidas de Imóveis**: aquisição de terras com cronograma de pagamento
- **Fornecedores**: valores projetados por ano

#### Gestão de Ativos Circulantes:

- **Liquidez**: caixa, bancos, investimentos
- **Estoques**: fertilizantes, defensivos, almoxarifado
- **Contratos Recebíveis**: valores a receber
- **Adiantamentos a Fornecedores**
- **Empréstimos a Terceiros**

#### Funcionalidades especiais:

- Suporte a múltiplas moedas (BRL/USD)
- Fluxos de pagamento anuais projetados
- Cálculo de indicadores financeiros
- Dashboards com distribuição de dívidas

### 7. Módulo de Patrimônio/Ativos

**Rota**: `/dashboard/assets`

**Objetivo**: Controlar o patrimônio e investimentos.

**Funcionalidades**:

- Cadastro de máquinas e equipamentos
- Controle de investimentos por categoria:
  - Tratores, colheitadeiras, pulverizadores
  - Aeronaves e veículos
  - Benfeitorias
  - Investimentos em solo
- Vendas de ativos
- Planos de investimento futuros
- Planos de aquisição de terras

### 8. Módulo de Projeções

**Rota**: `/dashboard/projections`

**Objetivo**: Planejamento estratégico e projeções financeiras.

**Funcionalidades**:

#### Configurações de Projeção:

- Criação de múltiplos cenários
- Duplicação de projeções existentes

#### Tipos de Projeções:

- **Culturas**: área, produtividade, preços por safra
- **Dívidas**: projeção por categoria e ano
- **Caixa e Disponibilidades**: ativos circulantes projetados
- **Fluxo de Caixa**: receitas, despesas, investimentos

#### Relatórios Financeiros:

- **Balanço Patrimonial**: visão completa de ativos e passivos
- **DRE (Demonstração de Resultados)**: análise de resultados
- **Fluxo de Caixa**: simplificado e completo

#### Análises:

- Análise de sensibilidade
- Cálculo automático de indicadores

### 9. Módulo de Indicadores

**Rota**: `/dashboard/indicators`

**Componente**: `IndicatorNavClient`

**Objetivo**: Monitorar indicadores-chave de desempenho.

**Funcionalidades**:

- Configuração de limites para indicadores:
  - Liquidez
  - Dívida/EBITDA
  - Dívida/Receita
  - Dívida/Patrimônio
  - LTV (Loan-to-Value)
- Preços de commodities
- Taxas de câmbio
- Parâmetros de sensibilidade

### 10. Módulo de Visão Geral/Dashboard Executivo

**Rota**: `/dashboard`

**Objetivo**: Consolidar dados de todos os módulos em uma visão unificada para análise executiva e tomada de decisões estratégicas. Este é o módulo CORE do sistema.

**Funcionalidades**:

#### Consolidação de Dados Multi-dimensional:

- **Integração de dados**: Combina informações de propriedades, produção, finanças, comercial e patrimônio
- **Processamento em tempo real**: Cálculos dinâmicos baseados em filtros selecionados
- **Análise temporal**: Comparações ano a ano e evolução histórica

#### Dashboard Executivo:

- **KPIs Principais**: Área total, valor patrimonial, produção, receitas, EBITDA com análise de tendências
- **Mapas Interativos**: Visualização geográfica das propriedades com distribuição por estados
- **Ranking de Propriedades**: Classificação por valor e performance

#### Análises Financeiras Avançadas:

- **Posição de Dívidas**: Consolidação de todas as modalidades de dívida
- **Indicadores de Liquidez**: Cálculo de capacidade de pagamento e fluxo de caixa
- **Ratios Financeiros**: Dívida/EBITDA, Dívida/Receita, Dívida Líquida
- **Alertas de Risco**: Sistema de cores para métricas críticas

#### Análises de Produção:

- **Performance por Cultura**: Produtividade, custos e receitas detalhadas
- **Combinações Cultura-Sistema**: Análise específica por tipo de irrigação
- **Evolução Produtiva**: Gráficos de área plantada, produtividade e receita
- **Comparações Sazonais**: Performance entre safras consecutivas

#### Geração de Relatórios Inteligentes:

- **Relatórios Visuais**: Captura automática de todas as abas do dashboard em PDF
- **Relatórios Estruturados**: Extração direta de dados com análises automatizadas
- **Sumário Executivo**: Conclusões e recomendações baseadas em dados
- **Múltiplos Formatos**: PDF executivo e exportação Excel detalhada

**Funcionalidades Técnicas**:

- Arquitetura multi-tenant com isolamento de dados
- Processamento otimizado para grandes volumes de dados
- Cache inteligente para performance
- Integração com APIs externas (SICAR, cotações)
- Validação cruzada de dados entre módulos

### 11. Módulo de Chat/Assistente

**Objetivo**: Fornecer suporte contextual através de IA.

**Funcionalidades**:

- Chat flutuante integrado à interface
- Assistente contextual com conhecimento do sistema
- Integração com diferentes modelos de IA (Groq, Ollama)
- Análise inteligente de dados

## Estrutura de Arquivos de Navegação

```
components/
├── dashboard/
│   ├── app-sidebar.tsx              # Sidebar principal do sistema
│   ├── navigation.ts                # Dados de navegação (navMain e navSecondary)
│   ├── nav-main.tsx                 # Componente de navegação principal
│   ├── nav-secondary.tsx            # Componente de navegação secundária
│   ├── nav-user.tsx                 # Menu do usuário
│   ├── organization-switcher.tsx    # Seletor de organização
│   └── financial-navigation.tsx     # Sub-navegação do módulo financeiro
├── production/
│   └── production-nav-client.tsx    # Sub-navegação do módulo de produção
├── commercial/
│   └── common/
│       └── commercial-nav-client.tsx # Sub-navegação do módulo comercial
└── indicators/
    └── indicator-nav-client.tsx     # Navegação do módulo de indicadores
```

## Resumo dos Módulos Restritos

### Módulos com Acesso Restrito a Super Admin:
1. Organização
2. Bens Imóveis  
3. Produção
4. Comercial
5. Financeiro
6. Patrimonial
7. Projeções
8. Indicadores

### Módulos Disponíveis para Todos os Usuários:
1. Visão Geral (Dashboard)
2. Tema (configuração de aparência)
3. Suporte

## Conclusão

O SR-Consultoria oferece uma solução completa e integrada para gestão de propriedades rurais, cobrindo desde o controle patrimonial até projeções estratégicas. A arquitetura modular permite expansão e customização conforme as necessidades específicas, com um sistema de navegação intuitivo e controle de acesso baseado em roles para garantir a segurança e segregação adequada dos dados.
