"use client";

import {
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
  BuildingIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function NavUser({
  user,
}: {
  user: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Garantindo dados iniciais para evitar problemas de hidratação
  const [userData, setUserData] = useState({
    name: user?.name || 'Usuário',
    email: user?.email || 'usuario@example.com',
    avatar: user?.avatar || '',
  });

  // Buscar dados adicionais do usuário
  // Estabilizamos o efeito apenas para client-side para evitar problemas de hidratação
  useEffect(() => {
    // Garantir que execute apenas no cliente
    if (typeof window === 'undefined') return;
    const fetchUserData = async () => {
      try {
        const supabase = createClient();

        // Buscar dados do usuário diretamente da autenticação
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          return;
        }

        if (authUser) {
          // Atualizar dados do usuário com os metadados
          setUserData({
            name: authUser.user_metadata?.name || user.name,
            email: authUser.email || user.email,
            avatar: authUser.user_metadata?.avatar_url || user.avatar,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Função para obter as iniciais do nome - utiliza useMemo para estabilidade
  const getInitials = (name: string): string => {
    // Validação para evitar erros com valores vazios ou indefinidos
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return 'GS'; // Valor padrão para usuário desconhecido
    }
    
    try {
      return name
        .trim()
        .split(" ")
        .map((part) => part && part.length > 0 ? part[0] : '')
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .substring(0, 2) || 'GS';
    } catch (e) {
      // Retornamos um valor padrão em caso de erro
      return 'GS';
    }
  };

  // Função para logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      toast.error("Erro ao encerrar sessão");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  GS
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userData.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {userData.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    GS
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userData.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userData.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <UserCircleIcon className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/organization">
                  <BuildingIcon className="mr-2 h-4 w-4" />
                  <span>Organização</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-500 focus:text-red-500"
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
