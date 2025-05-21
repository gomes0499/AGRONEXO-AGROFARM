import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";
import { FinancialNavigation } from "@/components/dashboard/financial-navigation";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";

export const metadata: Metadata = {
  title: "Financeiro | SR Consultoria",
  description: "Gestão financeira e controle de dívidas e investimentos",
};

export default async function FinancialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Financeiro" />
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="border-r w-64 hidden md:block">
          <div className="py-4 px-2">
            <FinancialNavigation />
          </div>
        </div>
        <div className="flex-1 p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}