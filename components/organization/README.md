# Organization Components - Estrutura Organizada

Este diretório contém todos os componentes relacionados ao gerenciamento de organizações, organizados em uma estrutura modular e escalável.

## 📁 Estrutura de Pastas

### `/organization/` - Componentes da Organização Principal

Componentes relacionados à entidade organização em si:

- `list.tsx` - Lista de organizações (anteriormente `organization-list.tsx`)
- `info-tab.tsx` - Tab de informações da organização (anteriormente `organization-detail-info.tsx`)
- `settings-tab.tsx` - Tab de configurações (anteriormente `organization-settings.tsx`)
- `form.tsx` - Formulário de organização (anteriormente `organization-form.tsx`)
- `form-drawer.tsx` - Drawer do formulário (anteriormente `organization-form-drawer.tsx`)
- `logo-upload.tsx` - Upload de logo (anteriormente `organization-logo-upload.tsx`)
- `new-button.tsx` - Botão de nova organização (anteriormente `new-organization-button.tsx`)

### `/member/` - Componentes de Membros

Componentes relacionados ao gerenciamento de membros das organizações:

- `list-tab.tsx` - Tab de listagem de membros (anteriormente `organization-detail-members.tsx`)
- `actions.tsx` - Ações dos membros (anteriormente `member-actions.tsx`)
- `details-modal.tsx` - Modal de detalhes (anteriormente `member-details-modal.tsx`)
- `form-drawer.tsx` - Drawer do formulário (anteriormente `member-form-drawer.tsx`)
- `add-form.tsx` - Formulário de adição (anteriormente `add-member-form.tsx`)

### `/invite/` - Componentes de Convites

Componentes relacionados ao sistema de convites:

- `list-tab.tsx` - Tab de listagem de convites (anteriormente `organization-detail-invites.tsx`)
- `actions.tsx` - Ações dos convites (anteriormente `invite-actions.tsx`)
- `dialog.tsx` - Dialog de convite (anteriormente `invite-dialog.tsx`)
- `form.tsx` - Formulário de convite (anteriormente `invite-form.tsx`)

### `/common/` - Componentes Reutilizáveis

Componentes compartilhados entre todas as funcionalidades:

#### `/common/data-display/`

- `info-field.tsx` - Campo de informação reutilizável com cópia
- `card-header-primary.tsx` - Header primário para cards
- `search-and-filter-bar.tsx` - Barra de busca e filtro
- `table-header-primary.tsx` - Header primário para tabelas
- `phone-with-whatsapp.tsx` - Display de telefone com WhatsApp

#### `/common/forms/`

- `form-step-navigation.tsx` - Navegação para formulários multi-etapa
- `form-step-indicator.tsx` - Indicador de progresso para formulários

## 📦 Como Importar

### Imports Modernos (Recomendado)

```tsx
// Import por namespace
import { Organization, Member, Invite, Common } from "@/components/organization";

// Uso
<Organization.List organizations={orgs} />
<Member.ListTab members={members} />
<Invite.Dialog organizationId={id} />
<Common.InfoField icon={<Icon />} label="Label" value="Value" />
```

### Imports Diretos (Compatibilidade)

```tsx
// Import direto dos componentes
import {
  OrganizationList,
  OrganizationDetailMembers,
  InviteDialog,
  InfoField,
} from "@/components/organization";
```

### Imports Específicos

```tsx
// Import específico de pasta
import { ListTab } from "@/components/organization/member";
import { InfoField } from "@/components/organization/common/data-display";
```

## 🎯 Benefícios da Nova Estrutura

### 1. **Organização Clara**

- Separação lógica por funcionalidade
- Nomenclatura consistente e padronizada
- Estrutura escalável para novas funcionalidades

### 2. **Reutilização de Código**

- Componentes comuns centralizados
- Redução de duplicação de código
- Padrões visuais consistentes

### 3. **Manutenibilidade**

- Easier to find specific components
- Mudanças centralizadas em componentes comuns
- Imports organizados e previsíveis

### 4. **Performance**

- Tree-shaking melhorado
- Imports mais específicos
- Menos código carregado desnecessariamente
