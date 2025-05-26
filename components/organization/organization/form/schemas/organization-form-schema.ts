import { z } from "zod";

// Schema de validação para o formulário de organização
export const organizationSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  slug: z
    .string()
    .min(3, "Identificador deve ter pelo menos 3 caracteres")
    .max(30, "Identificador deve ter no máximo 30 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "Identificador deve conter apenas letras minúsculas, números e hifens"
    ),
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
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

export interface OrganizationFormProps {
  userId?: string;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  organizationData?: any;
  mode?: "create" | "edit";
}