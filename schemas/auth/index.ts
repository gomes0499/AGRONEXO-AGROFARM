import { z } from 'zod';

// Esquema de validação de login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'O e-mail é obrigatório' })
    .email({ message: 'E-mail inválido' }),
  password: z
    .string()
    .min(1, { message: 'A senha é obrigatória' })
    .min(8, { message: 'A senha deve ter pelo menos 8 caracteres' }),
  rememberMe: z.boolean().optional(),
});

// Esquema de validação para registro
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'O nome é obrigatório' })
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z
    .string()
    .min(1, { message: 'O e-mail é obrigatório' })
    .email({ message: 'E-mail inválido' }),
  password: z
    .string()
    .min(1, { message: 'A senha é obrigatória' })
    .min(8, { message: 'A senha deve ter pelo menos 8 caracteres' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'A confirmação de senha é obrigatória' }),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Você deve aceitar os termos de serviço',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

// Esquema de validação para recuperação de senha
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'O e-mail é obrigatório' })
    .email({ message: 'E-mail inválido' }),
});

// Esquema de validação para redefinição de senha
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, { message: 'A senha é obrigatória' })
    .min(8, { message: 'A senha deve ter pelo menos 8 caracteres' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'A confirmação de senha é obrigatória' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

// Esquema de validação para atualização de perfil básico
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z
    .string()
    .email({ message: 'E-mail inválido' }),
  phone: z
    .string()
    .optional(),
  image: z
    .string()
    .optional()
    .nullable(),
});

// Esquema completo para dados pessoais
export const personalInfoSchema = z.object({
  cpf: z
    .string()
    .min(11, { message: 'CPF inválido' })
    .max(14, { message: 'CPF inválido' })
    .optional()
    .nullable(),
  rg: z
    .string()
    .optional()
    .nullable(),
  orgaoEmissor: z
    .string()
    .optional()
    .nullable(),
  dataNascimento: z
    .string()
    .optional()
    .nullable(),
  naturalidade: z
    .string()
    .optional()
    .nullable(),
  estadoCivil: z
    .string()
    .optional()
    .nullable(),
  inscricaoProdutorRural: z
    .string()
    .optional()
    .nullable(),
});

// Esquema para dados de endereço
export const addressSchema = z.object({
  cep: z
    .string()
    .min(8, { message: 'CEP deve conter 8 dígitos' })
    .max(9, { message: 'CEP inválido' })
    .optional()
    .nullable(),
  endereco: z
    .string()
    .optional()
    .nullable(),
  numero: z
    .string()
    .optional()
    .nullable(),
  complemento: z
    .string()
    .optional()
    .nullable(),
  bairro: z
    .string()
    .optional()
    .nullable(),
  cidade: z
    .string()
    .optional()
    .nullable(),
  estado: z
    .string()
    .length(2, { message: 'Estado deve ser a sigla com 2 letras' })
    .optional()
    .nullable(),
});

// Esquema para dados do cônjuge
export const spouseSchema = z.object({
  nomeConjuge: z
    .string()
    .optional()
    .nullable(),
  cpfConjuge: z
    .string()
    .min(11, { message: 'CPF inválido' })
    .max(14, { message: 'CPF inválido' })
    .optional()
    .nullable(),
  rgConjuge: z
    .string()
    .optional()
    .nullable(),
  orgaoEmissorConjuge: z
    .string()
    .optional()
    .nullable(),
  dataNascimentoConjuge: z
    .string()
    .optional()
    .nullable(),
});

// Esquema para status de onboarding
export const onboardingSchema = z.object({
  onboarding_complete: z
    .boolean()
    .default(false)
    .optional(),
  onboarding_step: z
    .number()
    .default(0)
    .optional(),
});

// Esquema para alteração de email
export const changeEmailSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'O e-mail é obrigatório' })
    .email({ message: 'E-mail inválido' }),
  password: z
    .string()
    .min(1, { message: 'A senha atual é obrigatória para confirmar a mudança' })
});

// Esquema para alteração de senha
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: 'A senha atual é obrigatória' }),
  newPassword: z
    .string()
    .min(1, { message: 'A nova senha é obrigatória' })
    .min(8, { message: 'A nova senha deve ter pelo menos 8 caracteres' }),
  confirmNewPassword: z
    .string()
    .min(1, { message: 'A confirmação da nova senha é obrigatória' })
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'As senhas não conferem',
  path: ['confirmNewPassword'],
});

// Esquema completo de perfil do usuário
export const fullProfileSchema = updateProfileSchema
  .merge(personalInfoSchema)
  .merge(addressSchema)
  .merge(spouseSchema)
  .merge(onboardingSchema);

// Exporta os tipos para uso em componentes e funções
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type FullProfileFormValues = z.infer<typeof fullProfileSchema>;
export type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;