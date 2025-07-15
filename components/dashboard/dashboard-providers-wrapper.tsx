'use client';

import React from 'react';
import { UserProvider } from "@/components/auth/user-provider";
import { OrganizationProvider } from "@/components/auth/organization-provider";
import { DashboardProvider } from "@/app/dashboard/dashboard-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardTickers } from "@/components/dashboard/dashboard-tickers";
import { ProductionScenarioProvider } from "@/contexts/production-scenario-context";
import { ScenarioLoadingOverlay } from "@/components/ui/scenario-loading-overlay";
import { useScenarioLoading } from "@/hooks/use-scenario-loading";
import { ChartColorsProvider } from "@/contexts/chart-colors-context";
import { ChartColorsLoader } from "@/components/dashboard/chart-colors-loader";
import { MobileNav, MobileNavPadding } from "@/components/ui/mobile-nav";
import { ChartColors } from "@/lib/constants/chart-colors";
import { CepeaDataLoader } from "@/components/dashboard/cepea-data-loader";

interface DashboardProvidersWrapperProps {
  user: any;
  organization: any;
  commercialPrices: any;
  children: React.ReactNode;
  chartColors?: ChartColors;
}

function DashboardContent({ commercialPrices, children }: { commercialPrices: any; children: React.ReactNode }) {
  const { isLoading, message } = useScenarioLoading();
  
  return (
    <>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <DashboardTickers commercialPrices={commercialPrices} />
          <CepeaDataLoader />
          <div className="flex flex-col overflow-x-hidden">
            <MobileNavPadding>
              <div className="overflow-x-hidden">
                {children}
              </div>
            </MobileNavPadding>
          </div>
          <MobileNav />
        </SidebarInset>
      </SidebarProvider>
      <ScenarioLoadingOverlay isLoading={isLoading} message={message} />
    </>
  );
}

export default function DashboardProvidersWrapper({
  user,
  organization,
  commercialPrices,
  children,
  chartColors
}: DashboardProvidersWrapperProps) {
  const organizationId = organization?.id || "";
  
  return (
    <UserProvider user={user}>
      <OrganizationProvider organization={organization}>
        <DashboardProvider commercialPrices={commercialPrices}>
          <ChartColorsProvider initialColors={chartColors}>
            <ProductionScenarioProvider organizationId={organizationId}>
              <DashboardContent commercialPrices={commercialPrices}>
                {children}
              </DashboardContent>
            </ProductionScenarioProvider>
          </ChartColorsProvider>
        </DashboardProvider>
      </OrganizationProvider>
    </UserProvider>
  );
}