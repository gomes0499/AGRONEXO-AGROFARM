import { Metadata } from "next";
import { UnderConstruction } from "@/components/ui/under-construction";
import { SiteHeader } from "@/components/dashboard/site-header";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";

export const metadata: Metadata = {
  title: "Financeiro | SR Consultoria",
  description: "Gestão financeira e controle de dívidas e investimentos",
};

export default async function FinancialPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Financeiro" />
      <div className="p-4 md:p-6 pt-2 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>

        <UnderConstruction
          variant="coming-soon"
          title="Módulo Financeiro em Desenvolvimento"
          message="O módulo financeiro fornecerá ferramentas completas para gestão de dívidas, fluxo de caixa, análises financeiras e planejamento de investimentos para sua operação agropecuária."
          icon="database"
        />
      </div>
    </div>
  );
}
