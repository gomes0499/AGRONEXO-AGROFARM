"use client";

import * as React from "react";
import { ReactNode } from "react";
const { createContext, useContext, useState, useEffect } = React;

// Interface para organização
export interface Organization {
  id: string;
  nome: string;
  slug: string;
  logo?: string | null;
  [key: string]: any; // Para outras propriedades que podem existir
}

// Interface do contexto de organização
interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (organization: Organization | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

// Chave para armazenamento local
const STORAGE_KEY = "current-organization";

// Valores padrão para o contexto
const defaultContext: OrganizationContextType = {
  organization: null,
  setOrganization: () => {},
  isLoading: true,
  setIsLoading: () => {},
};

// Criação do contexto
const OrganizationContext =
  createContext<OrganizationContextType>(defaultContext);

// Hook para usar o contexto de organização
export const useOrganization = () => useContext(OrganizationContext);

// Props do provider
interface OrganizationProviderProps {
  children: ReactNode;
  organization?: Organization | null;
}

// Componente provider
export function OrganizationProvider({
  children,
  organization: initialOrganization = null,
}: OrganizationProviderProps) {
  // Tenta recuperar do localStorage na inicialização
  const getSavedOrganization = (): Organization | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Erro ao recuperar organização do localStorage:", error);
      return null;
    }
  };

  const [organization, setOrganizationState] = useState<Organization | null>(
    initialOrganization || getSavedOrganization()
  );
  const [isLoading, setIsLoading] = useState(!organization);

  // Função personalizada para atualizar a organização e persistir no localStorage
  const setOrganization = (org: Organization | null) => {
    setOrganizationState(org);
    
    if (typeof window !== "undefined") {
      try {
        if (org) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(org));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Erro ao salvar organização no localStorage:", error);
      }
    }
  };

  // Carregar a organização salva no localStorage na inicialização
  useEffect(() => {
    // Se já temos uma organização definida pelo prop, usamos ela e salvamos
    if (initialOrganization) {
      setOrganization(initialOrganization);
      return;
    }
    
    // Caso contrário, tentamos recuperar do localStorage
    const savedOrg = getSavedOrganization();
    if (savedOrg && !organization) {
      setOrganizationState(savedOrg);
      setIsLoading(false);
    }
  }, [initialOrganization]);
  
  // Sincroniza com user_metadata quando o usuário muda a organização
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Listener para mensagens do localStorage de outras abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newOrg = JSON.parse(e.newValue);
          setOrganizationState(newOrg);
        } catch (error) {
          console.error("Erro ao processar alteração de organização:", error);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <OrganizationContext.Provider
      value={{ organization, setOrganization, isLoading, setIsLoading }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}
