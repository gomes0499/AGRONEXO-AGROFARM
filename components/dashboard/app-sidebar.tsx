"use client";

import * as React from "react";
import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { NavUser } from "@/components/dashboard/nav-user";
import { ThemeAwareLogo } from "@/components/dashboard/theme-aware-logo";
import { RatingSection } from "@/components/dashboard/rating-section";
import { ReportsSection } from "@/components/dashboard/reports-section";
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
import { useUser } from "@/components/auth/user-provider";
import { useOrganization } from "@/components/auth/organization-provider";
import { useUserRole } from "@/hooks/use-user-role";
import { UserRole } from "@/lib/auth/roles";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { userRole } = useUserRole(organization?.id);
  const [navItems, setNavItems] = React.useState(data.navMain);
  const [navSecondaryItems, setNavSecondaryItems] = React.useState(
    data.navSecondary
  );

  // Inicializar com dados do usuário se disponível para evitar hidratação incorreta
  const [userData, setUserData] = React.useState({
    name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário",
    email: user?.email || "usuario@example.com",
    avatar: user?.user_metadata?.avatar_url || "",
  });

  React.useEffect(() => {
    async function loadUserData() {
      try {
        if (user) {
          setUserData({
            name:
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Usuário",
            email: user.email || "",
            avatar: user.user_metadata?.avatar_url || "",
          });

          // Verifica se é super admin
          const isSuperAdmin = user.app_metadata?.is_super_admin === true;

          let filteredNavItems = [...data.navMain];

          // Filtrar navegação secundária
          let filteredSecondaryItems = [...data.navSecondary];

          // Se for membro (não proprietário nem administrador), só pode ver Visão Geral
          if (userRole === UserRole.MEMBRO) {
            filteredNavItems = filteredNavItems.filter(
              (item) => item.title === "Visão Geral"
            );
          }
          // Se não for super admin, remove as opções restritas
          else if (!isSuperAdmin) {
            // Lista de módulos restritos a superadmin
            const restrictedModules = [
              "Organização",
              "Bens Imóveis",
              "Produção",
              "Comercial",
              "Financeiro",
              "Patrimonial",
              "Indicadores",
            ];

            filteredNavItems = filteredNavItems.filter(
              (item) => !restrictedModules.includes(item.title)
            );
          }

          setNavItems(filteredNavItems);
          setNavSecondaryItems(filteredSecondaryItems);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    }

    loadUserData();
  }, [user, userRole]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 h-12"
            >
              <Link href="/dashboard">
                <ThemeAwareLogo
                  width={1200}
                  height={1200}
                  priority={true}
                  quality={100}
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <RatingSection />
        <ReportsSection />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
        <div className="px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Desenvolvido por{" "}
            <a
              href="https://agronexo.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-primary transition-colors"
            >
              AgroNexo
            </a>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
