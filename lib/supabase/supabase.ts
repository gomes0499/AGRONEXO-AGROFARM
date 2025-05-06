export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export enum UserRole {
  PROPRIETARIO = "PROPRIETARIO",
  ADMINISTRADOR = "ADMINISTRADOR",
  MEMBRO = "MEMBRO",
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nome: string
          email: string
          telefone: string | null
          imagem: string | null
          metadados: {
            funcao: UserRole
            cpf?: string
            rg?: string
            orgaoEmissor?: string
            cep?: string
            endereco?: string
            numero?: string
            complemento?: string
            bairro?: string
            cidade?: string
            estado?: string
            celular?: string
            inscricaoProdutorRural?: string
            dataNascimento?: string
            naturalidade?: string
            estadoCivil?: string
            nomeConjuge?: string
            cpfConjuge?: string
            rgConjuge?: string
            orgaoEmissorConjuge?: string
            dataNascimentoConjuge?: string
          } | null
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          telefone?: string | null
          imagem?: string | null
          metadados?: {
            funcao: UserRole
            cpf?: string
            rg?: string
            orgaoEmissor?: string
            cep?: string
            endereco?: string
            numero?: string
            complemento?: string
            bairro?: string
            cidade?: string
            estado?: string
            celular?: string
            inscricaoProdutorRural?: string
            dataNascimento?: string
            naturalidade?: string
            estadoCivil?: string
            nomeConjuge?: string
            cpfConjuge?: string
            rgConjuge?: string
            orgaoEmissorConjuge?: string
            dataNascimentoConjuge?: string
          } | null
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          telefone?: string | null
          imagem?: string | null
          metadados?: {
            funcao?: UserRole
            cpf?: string
            rg?: string
            orgaoEmissor?: string
            cep?: string
            endereco?: string
            numero?: string
            complemento?: string
            bairro?: string
            cidade?: string
            estado?: string
            celular?: string
            inscricaoProdutorRural?: string
            dataNascimento?: string
            naturalidade?: string
            estadoCivil?: string
            nomeConjuge?: string
            cpfConjuge?: string
            rgConjuge?: string
            orgaoEmissorConjuge?: string
            dataNascimentoConjuge?: string
          } | null
        }
      }
      organizacoes: {
        Row: {
          id: string
          nome: string
          slug: string
          logo: string | null
          endereco: string | null
          telefone: string | null
          email: string | null
          website: string | null
          created_at: string
          cpf: string | null
          cnpj: string | null
          cep: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          cidade: string | null
          estado: string | null
          inscricaoEstadual: string | null
          perfilLinkedIn: string | null
          perfilInstagram: string | null
          canalYouTube: string | null
          perfilX: string | null
          perfilTikTok: string | null
          paginaFacebook: string | null
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          logo?: string | null
          endereco?: string | null
          telefone?: string | null
          email?: string | null
          website?: string | null
          cpf?: string | null
          cnpj?: string | null
          cep?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          estado?: string | null
          inscricaoEstadual?: string | null
          perfilLinkedIn?: string | null
          perfilInstagram?: string | null
          canalYouTube?: string | null
          perfilX?: string | null
          perfilTikTok?: string | null
          paginaFacebook?: string | null
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          logo?: string | null
          endereco?: string | null
          telefone?: string | null
          email?: string | null
          website?: string | null
          cpf?: string | null
          cnpj?: string | null
          cep?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string | null
          estado?: string | null
          inscricaoEstadual?: string | null
          perfilLinkedIn?: string | null
          perfilInstagram?: string | null
          canalYouTube?: string | null
          perfilX?: string | null
          perfilTikTok?: string | null
          paginaFacebook?: string | null
        }
      }
      associacoes: {
        Row: {
          id: string
          usuario_id: string
          organizacao_id: string
          funcao: UserRole
          eh_proprietario: boolean
          data_adicao: string
          ultimo_login: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          organizacao_id: string
          funcao: UserRole
          eh_proprietario: boolean
          data_adicao?: string
          ultimo_login?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          organizacao_id?: string
          funcao?: UserRole
          eh_proprietario?: boolean
          data_adicao?: string
          ultimo_login?: string | null
        }
      }
      convites: {
        Row: {
          id: string
          organizacao_id: string
          email: string
          token: string
          funcao: UserRole
          status: "PENDENTE" | "ACEITO" | "RECUSADO" | "EXPIRADO"
          ultimo_envio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organizacao_id: string
          email: string
          token: string
          funcao: UserRole
          status: "PENDENTE" | "ACEITO" | "RECUSADO" | "EXPIRADO"
          ultimo_envio?: string | null
        }
        Update: {
          id?: string
          organizacao_id?: string
          email?: string
          token?: string
          funcao?: UserRole
          status?: "PENDENTE" | "ACEITO" | "RECUSADO" | "EXPIRADO"
          ultimo_envio?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
    }
  }
}
