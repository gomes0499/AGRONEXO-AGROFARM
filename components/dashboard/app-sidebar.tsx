"use client";

import * as React from "react";
import { ArrowUpCircleIcon } from "lucide-react";

import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { NavUser } from "@/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { data } from "./navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/auth/user-provider";
import { UserRole } from "@/lib/auth/roles";
import Image from "next/image";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const [navItems, setNavItems] = React.useState(data.navMain);
  const [userData, setUserData] = React.useState(data.user);

  React.useEffect(() => {
    async function loadUserData() {
      try {
        if (user) {
          // Atualiza dados do usuário para exibição usando metadados
          setUserData({
            name:
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Usuário",
            email: user.email || "",
            avatar: user.user_metadata?.avatar_url || "/avatars/user.jpg",
          });

          // Verifica função do usuário nos metadados
          const userRole = user.user_metadata?.funcao;
          // Verifica se é super admin
          const isSuperAdmin = user.app_metadata?.is_super_admin === true;

          let filteredNavItems = [...data.navMain];

          // Se não for super admin, remove as opções restritas
          if (!isSuperAdmin) {
            // Lista de módulos restritos a superadmin
            const restrictedModules = [
              "Organização", 
              "Bens Imóveis", 
              "Produção", 
              "Comercial",
              "Financeiro",
              "Patrimonial",
              "Projeções",
              "Indicadores"
            ];
            
            filteredNavItems = filteredNavItems.filter(
              (item) => !restrictedModules.includes(item.title)
            );
          }

          // Apenas superadmin pode acessar todos os módulos

          setNavItems(filteredNavItems);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    }

    loadUserData();
  }, [user]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <Image
                  src="/logo.svg"
                  alt="SR-Consultoria Logo"
                  width={200}
                  height={100}
                  priority
                  quality={100}
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
