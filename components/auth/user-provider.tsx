"use client";

import { User } from "@supabase/supabase-js";
import { createContext, useContext, useState, ReactNode } from "react";

// Tipo que inclui os dados estendidos do usuário
export type UserMetadata = {
  name?: string;
  avatar_url?: string;
  telefone?: string;
  organizacao?: {
    id: string;
    nome: string;
    slug: string;
  };
  funcao?: string;
  cpf?: string;
  rg?: string;
  orgaoEmissor?: string;
  dataNascimento?: string;
  naturalidade?: string;
  estadoCivil?: string;
  inscricaoProdutorRural?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  nomeConjuge?: string;
  cpfConjuge?: string;
  rgConjuge?: string;
  orgaoEmissorConjuge?: string;
  dataNascimentoConjuge?: string;
  
  // Dados de onboarding
  onboarding_step?: number;
  onboarding_complete?: boolean;
  onboarding_personal_info_completed?: boolean;
  onboarding_documents_completed?: boolean;
};

// Estendemos o tipo User do Supabase para ter TypeScript correto
export type UserWithProfile = User & {
  // Deixamos o tipo de user_metadata mais específico
  user_metadata: UserMetadata;
};

// Interface do contexto de usuário
interface UserContextType {
  user: UserWithProfile | null;
  setUser: (user: UserWithProfile | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

// Valores padrão para o contexto
const defaultContext: UserContextType = {
  user: null,
  setUser: () => {},
  isLoading: true,
  setIsLoading: () => {},
};

// Criação do contexto
const UserContext = createContext<UserContextType>(defaultContext);

// Hook para usar o contexto de usuário
export const useUser = () => {
  const context = useContext(UserContext);
  
  // Métodos auxiliares para acessar metadados do usuário
  return {
    ...context,
    
    // Função para obter nome do usuário
    getUserName: () => context.user?.user_metadata?.name || context.user?.email?.split('@')[0] || "Usuário",
    
    // Função para obter avatar do usuário
    getUserAvatar: () => context.user?.user_metadata?.avatar_url || null,
    
    // Função para verificar se o onboarding está completo
    isOnboardingComplete: () => context.user?.user_metadata?.onboarding_complete === true,
    
    // Função para obter etapa atual do onboarding
    getOnboardingStep: () => context.user?.user_metadata?.onboarding_step || 0,
    
    // Função para verificar se o usuário é super admin
    isSuperAdmin: () => context.user?.app_metadata?.is_super_admin === true,
    
    // Função para obter dados de endereço
    getAddress: () => ({
      cep: context.user?.user_metadata?.cep,
      endereco: context.user?.user_metadata?.endereco,
      numero: context.user?.user_metadata?.numero,
      complemento: context.user?.user_metadata?.complemento,
      bairro: context.user?.user_metadata?.bairro,
      cidade: context.user?.user_metadata?.cidade,
      estado: context.user?.user_metadata?.estado,
    }),
    
    // Função para obter dados pessoais
    getPersonalInfo: () => ({
      cpf: context.user?.user_metadata?.cpf,
      rg: context.user?.user_metadata?.rg,
      orgaoEmissor: context.user?.user_metadata?.orgaoEmissor,
      dataNascimento: context.user?.user_metadata?.dataNascimento,
      naturalidade: context.user?.user_metadata?.naturalidade,
      estadoCivil: context.user?.user_metadata?.estadoCivil,
    }),
  };
};

// Props do provider
interface UserProviderProps {
  children: ReactNode;
  user?: UserWithProfile | null;
}

// Componente provider
export function UserProvider({
  children,
  user: initialUser = null,
}: UserProviderProps) {
  const [user, setUser] = useState<UserWithProfile | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, setIsLoading }}>
      {children}
    </UserContext.Provider>
  );
}
