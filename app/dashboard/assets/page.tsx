import { Metadata } from "next";
import { UnderConstruction } from "@/components/ui/under-construction";
import { SiteHeader } from "@/components/dashboard/site-header";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";

export const metadata: Metadata = {
  title: "Patrimonial | SR Consultoria",
  description: "Gestão patrimonial e controle de ativos",
};

export default async function AssetsPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Patrimonial" />
      <div className="p-4 md:p-6 pt-2 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Patrimonial</h1>

        <UnderConstruction
          variant="coming-soon"
          title="Módulo Patrimonial em Desenvolvimento"
          message="O módulo patrimonial permitirá o gerenciamento completo de todos os seus ativos, incluindo maquinário agrícola, veículos, benfeitorias e investimentos em terra."
          icon="database"
        />
      </div>
    </div>
  );
}
