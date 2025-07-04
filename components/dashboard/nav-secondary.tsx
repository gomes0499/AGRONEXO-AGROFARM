"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useUser } from "@/components/auth/user-provider";
import { PDFReportButton } from "@/components/dashboard/pdf-report-button";
import { RatingReportButton } from "@/components/dashboard/rating-report-button";
import { ExcelExportButton } from "@/components/dashboard/excel-export-button";
import { useOrganization } from "@/components/auth/organization-provider";
import { useUserRole } from "@/hooks/use-user-role";
import { UserRole } from "@/lib/auth/roles";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isThemeToggle?: boolean;
    isReportGenerator?: boolean;
    isPdfReport?: boolean;
    isRatingReport?: boolean;
    isExcelExport?: boolean;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { userRole } = useUserRole(organization?.id);
  
  // Obter o nome da organização atual para o relatório
  const organizationName = organization?.nome || user?.user_metadata?.organizacao?.nome || "Minha Organização";
  const organizationId = organization?.id || user?.user_metadata?.organizacao?.id;
  
  // Se for membro, não mostrar botões de geração
  const isMember = userRole === UserRole.MEMBRO;

  // Function to check if a menu item is active
  const isActive = (url: string) => {
    // If pathname exactly matches url, it's active
    if (pathname === url) {
      return true;
    }

    // If pathname starts with url and the next character is a slash or nothing, it's active
    // This handles nested routes correctly
    if (
      pathname.startsWith(url) &&
      (pathname.length === url.length || pathname.charAt(url.length) === "/")
    ) {
      return true;
    }

    return false;
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);

            // Special handling for theme toggle
            if (item.isThemeToggle) {
              return (
                <SidebarMenuItem key={item.title}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <ThemeToggle />
                  </div>
                </SidebarMenuItem>
              );
            }
            
            // Special handling for PDF report (não mostrar para membros)
            if (item.isPdfReport && organizationId && !isMember) {
              return (
                <SidebarMenuItem key={item.title}>
                  <PDFReportButton 
                    organizationId={organizationId}
                    organizationName={organizationName}
                    variant="ghost"
                    size="default"
                    showIcon={true}
                    showText={true}
                  />
                </SidebarMenuItem>
              );
            }
            
            
            
            // Special handling for Rating report (não mostrar para membros)
            if (item.isRatingReport && organizationId && !isMember) {
              return (
                <SidebarMenuItem key={item.title}>
                  <RatingReportButton 
                    organizationId={organizationId}
                    organizationName={organizationName}
                    variant="ghost"
                    size="default"
                    showIcon={true}
                    showText={true}
                  />
                </SidebarMenuItem>
              );
            }
            
            // Special handling for Excel export (não mostrar para membros)
            if (item.isExcelExport && organizationId && !isMember) {
              return (
                <SidebarMenuItem key={item.title}>
                  <ExcelExportButton 
                    organizationId={organizationId}
                    organizationName={organizationName}
                    variant="ghost"
                    size="default"
                    showIcon={true}
                    showText={true}
                  />
                </SidebarMenuItem>
              );
            }
            
            // Se for membro e o item é um botão de geração, pular
            if (isMember && (item.isPdfReport || item.isRatingReport || item.isExcelExport)) {
              return null;
            }
            
            
            // Standard menu item
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={active ? "bg-primary/10 dark:bg-primary/20" : ""}
                  data-active={active}
                >
                  <Link href={item.url}>
                    <item.icon className={active ? "text-primary" : ""} />
                    <span className={active ? "font-medium text-primary" : ""}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
