import { z } from "zod";

// Schema para sócio/acionista
export const partnerSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  documento: z.string().min(11, "Documento inválido"),
  tipo_documento: z.enum(["cpf", "cnpj"]),
  percentual: z.number().min(0).max(100).optional(),
});

// Schema de validação para o formulário de organização
export const organizationSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  slug: z.string().optional().or(z.literal("")), // Removido validações pois o slug é gerado automaticamente
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  cnpj: z.string().optional().or(z.literal("")),
  tipo: z.enum(["fisica", "juridica"]),
  endereco: z.string().optional().or(z.literal("")),
  numero: z.string().optional().or(z.literal("")),
  complemento: z.string().optional().or(z.literal("")),
  bairro: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  estado: z.string().optional().or(z.literal("")),
  cep: z.string().optional().or(z.literal("")),
  inscricao_estadual: z.string().optional().or(z.literal("")),
  roteiro: z.string().optional().or(z.literal("")),
  latitude: z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
  // Novos campos
  estrutura_societaria: z.array(partnerSchema),
  // Cores personalizadas
  cor_primaria: z.string().optional(),
  cor_secundaria: z.string().optional(),
  cor_fundo: z.string().optional(),
  cor_texto: z.string().optional(),
  chart_colors: z.any().optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

export interface OrganizationFormProps {
  userId?: string;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  organizationData?: any;
  mode?: "create" | "edit";
}