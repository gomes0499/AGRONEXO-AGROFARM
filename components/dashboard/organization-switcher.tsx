"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, PlusCircle, Building } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOrganization } from "@/components/auth/organization-provider";
import { useUser } from "@/components/auth/user-provider";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/lib/auth/roles";

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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Verificar se o usuário é super admin
  const isSuperAdmin = React.useMemo(() => {
    return user?.app_metadata?.is_super_admin === true;
  }, [user]);

  // Carregar organizações do usuário
  React.useEffect(() => {
    async function loadOrganizations() {
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
            .select("*, organizacao:organizacao_id(id, nome, slug, logo)")
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
    }

    loadOrganizations();
  }, [user, isSuperAdmin]);

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
  }, [organizations, organization, loading]);

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
      await supabase.auth.updateUser({
        data: {
          organizacao: {
            id: org.id,
            nome: org.nome,
            slug: org.slug,
          },
        },
      });

      // Atualizar também o último login para esta organização
      await supabase
        .from("associacoes")
        .update({ ultimo_login: new Date().toISOString() })
        .eq("usuario_id", user?.id)
        .eq("organizacao_id", org.id);

      // Fechar popover
      setOpen(false);

      // Forçar uma navegação completa para atualizar a página inteira
      // Isso garante que os componentes do servidor serão renderizados com a nova organização
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Erro ao trocar de organização:", error);
    }
  };

  // Função para criar nova organização
  const createNewOrganization = () => {
    setCreatingNewOrg(true);
    setOpen(false);
    router.push("/dashboard/organization/new");
  };

  // Obtem iniciais para avatar - usando React.useMemo para garantir consistência entre servidor e cliente
  const getInitials = React.useMemo(() => {
    // Inicializamos com um valor memorizado para evitar problemas de hidratação
    const cache: Record<string, string> = {};
    
    return (name: string): string => {
      // Se já calculamos antes, retorna do cache
      if (cache[name]) return cache[name];
      
      if (!name || name.trim() === "") return "OR";
      
      // Calculamos e armazenamos em cache
      const initials = name
        .trim()
        .split(" ")
        .map((part) => (part && part.length > 0 ? part[0] : ""))
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .substring(0, 2) || "OR";
        
      cache[name] = initials;
      return initials;
    };
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton className="flex w-full justify-between ">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 rounded-md">
                  {organization && organization.logo ? (
                    <AvatarImage
                      src={organization.logo}
                      alt={organization.nome || ""}
                    />
                  ) : null}
                  <AvatarFallback className="rounded-md bg-primary text-xs text-primary-foreground">
                    {organization && organization.nome ? 
                      getInitials(organization.nome) 
                      : "OR"
                    }
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">
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
                        {org.logo ? (
                          <AvatarImage src={org.logo} alt={org.nome || ""} />
                        ) : null}
                        <AvatarFallback className="rounded-md bg-primary text-xs text-primary-foreground">
                          {org.nome ? getInitials(org.nome) : "OR"}
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
  );
}
