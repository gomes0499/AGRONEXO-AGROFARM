'use client';

import React from 'react';
import { UserProvider } from "@/components/auth/user-provider";
import { OrganizationProvider } from "@/components/auth/organization-provider";
import { DashboardProvider } from "@/app/dashboard/dashboard-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardTickers } from "@/components/dashboard/dashboard-tickers";

interface DashboardProvidersWrapperProps {
  user: any;
  organization: any;
  commercialPrices: any;
  children: React.ReactNode;
}

export default function DashboardProvidersWrapper({
  user,
  organization,
  commercialPrices,
  children
}: DashboardProvidersWrapperProps) {
  return (
    <UserProvider user={user}>
      <OrganizationProvider organization={organization}>
        <DashboardProvider commercialPrices={commercialPrices}>
          <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
              <div className="flex flex-col overflow-x-hidden">
                <DashboardTickers commercialPrices={commercialPrices} />
                <div className="overflow-x-hidden">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </DashboardProvider>
      </OrganizationProvider>
    </UserProvider>
  );
}