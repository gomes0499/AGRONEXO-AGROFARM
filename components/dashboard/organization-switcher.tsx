"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { useOrganization } from "@/components/auth/organization-provider";
import { useUser } from "@/components/auth/user-provider";
import { createClient } from "@/lib/supabase/client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizationFormModal } from "@/components/organization/organization/form/organization-form-modal";

interface Organization {
  id: string;
  nome: string;
  slug: string;
  logo?: string | null;
}

export function OrganizationSwitcher() {
  const router = useRouter();
  const { organization, setOrganization } = useOrganization();
  const { user } = useUser();

  const [open, setOpen] = React.useState(false);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creatingNewOrg, setCreatingNewOrg] = React.useState(false);
  const [showNewOrgForm, setShowNewOrgForm] = React.useState(false);

  // Verificar se o usuário é super admin
  const isSuperAdmin = React.useMemo(() => {
    return user?.app_metadata?.is_super_admin === true;
  }, [user]);

  // Função para carregar organizações
  const loadOrganizations = React.useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const supabase = createClient();

      // Se for super admin, buscar todas as organizações
      if (isSuperAdmin) {
        const { data, error } = await supabase
          .from("organizacoes")
          .select("id, nome, slug, logo")
          .order("nome");

        if (error) throw error;
        setOrganizations(data || []);
      } else {
        // Para usuários normais, buscar apenas organizações associadas
        const { data, error } = await supabase
          .from("associacoes")
          .select("*, organizacao:organizacoes!associacoes_organizacao_id_fkey(id, nome, slug, logo)")
          .eq("usuario_id", user.id);

        if (error) throw error;

        // Extrair e formatar organizações
        const orgs =
          data?.map((assoc) => assoc.organizacao as Organization) || [];
        setOrganizations(orgs);
      }
    } catch (error) {
      console.error("Erro ao carregar organizações:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isSuperAdmin]);

  // Carregar organizações do usuário
  React.useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Verificar se a organização atual está na lista de organizações carregadas
  React.useEffect(() => {
    if (organization && organizations.length > 0 && !loading) {
      // Verifica se a organização atual existe na lista de organizações do usuário
      const orgExists = organizations.some((org) => org.id === organization.id);

      // Se não existir, redefinir para a primeira organização disponível
      if (!orgExists && organizations[0]) {
        setOrganization(organizations[0]);
      }
    }
  }, [organizations, organization, loading, setOrganization]);

  // Verificar se o usuário pode criar organizações
  const canCreateOrg = React.useMemo(() => {
    // Somente super admin pode criar organizações
    return isSuperAdmin;
  }, [isSuperAdmin]);

  // Função para trocar de organização
  const switchOrganization = async (org: Organization) => {
    try {
      // Atualizar estado local (isso também irá salvar no localStorage graças ao provider)
      setOrganization(org);

      // Atualizar no banco a organização atual do usuário nos metadados
      const supabase = createClient();

      // Atualizar nos user_metadata para que o backend possa acessar
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          organizacao: {
            id: org.id,
            nome: org.nome,
            slug: org.slug,
          },
        },
      });
      
      if (updateError) {
        console.error("Erro ao atualizar user metadata:", updateError);
      }

      // Atualizar também o último login para esta organização
      await supabase
        .from("associacoes")
        .update({ ultimo_login: new Date().toISOString() })
        .eq("usuario_id", user?.id)
        .eq("organizacao_id", org.id);

      // Fechar popover
      setOpen(false);

      // Aguardar um pouco para garantir que o metadata foi atualizado no servidor
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fazer um refresh soft usando router para atualizar os server components
      // sem causar uma navegação completa
      router.refresh();
      
      // Force a hard reload to ensure organization switching works
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Erro ao trocar de organização:", error);
    }
  };

  // Função para criar nova organização
  const createNewOrganization = () => {
    setCreatingNewOrg(true);
    setOpen(false);
    setShowNewOrgForm(true);
  };

  // Função para lidar com o sucesso da criação da organização
  const handleOrganizationCreated = () => {
    setShowNewOrgForm(false);
    setCreatingNewOrg(false);
    // Recarregar organizações
    loadOrganizations();
  };

  // Função para fechar o form de nova organização
  const handleCloseNewOrgForm = () => {
    setShowNewOrgForm(false);
    setCreatingNewOrg(false);
  };


  // Função para obter iniciais sem cache para evitar problemas de hidratação
  const getInitials = (name: string | null | undefined): string => {
    if (!name || name.trim() === "") return "OR";

    const initials = name
      .trim()
      .split(" ")
      .map((part) => (part && part.length > 0 ? part[0] : ""))
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .substring(0, 2);

    return initials || "OR";
  };

  // Estado para evitar problemas de hidratação
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <SidebarMenuButton className="flex w-full justify-between bg-muted/50 h-10">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 rounded-md">
                    {mounted && organization?.logo && (
                      <AvatarImage
                        src={organization.logo}
                        alt={organization.nome || ""}
                      />
                    )}
                    <AvatarFallback className="rounded-md bg-primary text-xs text-foreground">
                      {mounted && organization?.nome
                        ? getInitials(organization.nome)
                        : "OR"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium text-foreground ">
                    {loading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      organization?.nome || "Selecionar organização"
                    )}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] min-w-52 rounded-md p-0">
              <Command>
                <CommandInput placeholder="Buscar organização..." />
                <CommandList>
                  <CommandEmpty>Nenhuma organização encontrada.</CommandEmpty>
                  <CommandGroup
                    heading={
                      isSuperAdmin ? "Todas as organizações" : "Suas organizações"
                    }
                  >
                    {organizations.map((org) => (
                      <CommandItem
                        key={org.id}
                        onSelect={() => switchOrganization(org)}
                        className="text-sm"
                      >
                        <Avatar className="mr-2 h-6 w-6 rounded-md">
                          {mounted && org.logo && (
                            <AvatarImage src={org.logo} alt={org.nome || ""} />
                          )}
                          <AvatarFallback className="rounded-md bg-primary text-xs text-primary-foreground">
                            {mounted && org.nome ? getInitials(org.nome) : "OR"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{org.nome}</span>
                        {organization?.id === org.id && (
                          <Check className="ml-auto h-4 w-4 opacity-100" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {canCreateOrg && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={createNewOrganization}
                          className="cursor-pointer"
                          disabled={creatingNewOrg}
                        >
                          <PlusCircle className="mr-2 h-5 w-5" />
                          <span>Criar nova organização</span>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Form de Nova Organização */}
      {showNewOrgForm && user && (
        <OrganizationFormModal
          userId={user.id}
          isOpen={showNewOrgForm}
          onClose={handleCloseNewOrgForm}
          onOpenChange={setShowNewOrgForm}
          onSuccess={handleOrganizationCreated}
          mode="create"
        />
      )}
    </>
  );
}
