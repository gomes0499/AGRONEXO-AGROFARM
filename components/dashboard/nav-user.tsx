"use client";

import {
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
  BuildingIcon,
} from "lucide-react";

import { UserAvatar } from "@/components/ui/user-avatar";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


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
    name: user?.name || "Usuário",
    email: user?.email || "usuario@example.com",
    avatar: user?.avatar || "",
  });
  

  // Buscar dados adicionais do usuário
  // Usar useEffect com flag isMounted para evitar atualizações após desmontagem
  useEffect(() => {
    let isMounted = true;
    
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

        if (authUser && isMounted) {
          // Atualizar dados do usuário com os metadados
          const newName = authUser.user_metadata?.name || user.name || "Usuário";
          const newEmail = authUser.email || user.email || "usuario@example.com";
          const newAvatar = authUser.user_metadata?.avatar_url || user.avatar || "";
          
          setUserData({
            name: newName,
            email: newEmail,
            avatar: newAvatar,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    fetchUserData();
    
    return () => {
      isMounted = false;
    };
  }, [user.name, user.email, user.avatar]);


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
              <UserAvatar
                name={userData.name}
                src={userData.avatar}
                className="h-8 w-8 rounded-lg"
                fallbackClassName="rounded-lg bg-primary text-primary-foreground"
              />
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
                <UserAvatar
                  name={userData.name}
                  src={userData.avatar}
                  className="h-8 w-8 rounded-lg"
                  fallbackClassName="rounded-lg bg-primary text-primary-foreground"
                />
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
