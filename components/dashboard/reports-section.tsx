"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useOrganization } from "@/components/auth/organization-provider";
import { PDFReportButton } from "@/components/dashboard/pdf-report-button";
import { ExcelExportButton } from "@/components/dashboard/excel-export-button";

export function ReportsSection() {
  const { organization } = useOrganization();

  if (!organization) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Relatórios</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <PDFReportButton 
              organizationId={organization.id}
              organizationName={organization.nome}
              variant="ghost"
              size="default"
              showIcon={true}
              showText={true}
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ExcelExportButton 
              organizationId={organization.id}
              organizationName={organization.nome}
              variant="ghost"
              size="default"
              showIcon={true}
              showText={true}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}