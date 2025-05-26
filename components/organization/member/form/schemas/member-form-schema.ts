import { z } from "zod";
import { UserRole } from "@/lib/auth/roles";

// Schema para formulário de adição de membro
export const memberSchema = z.object({
  // Dados básicos
  email: z.string().email({ message: "Email inválido" }),
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  telefone: z.string().optional(),
  funcao: z.enum([UserRole.ADMINISTRADOR, UserRole.MEMBRO]),

  // Dados pessoais
  cpf: z.string().optional(),
  rg: z.string().optional(),
  orgaoEmissor: z.string().optional(),
  estadoEmissor: z.string().optional(),
  dataNascimento: z.date().optional(),
  naturalidade: z.string().optional(),
  estadoCivil: z.string().optional(),

  // Campos do cônjuge (opcionais)
  nomeConjuge: z.string().optional(),
  cpfConjuge: z.string().optional(),
  rgConjuge: z.string().optional(),
  orgaoEmissorConjuge: z.string().optional(),
  dataNascimentoConjuge: z.date().optional(),

  // Endereço
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  celular: z.string().optional(),

  // Documentos adicionais
  inscricaoProdutorRural: z.string().optional(),
});

export type MemberFormValues = z.infer<typeof memberSchema>;

export interface MemberFormProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  organizationId: string;
  organizationName?: string;
}