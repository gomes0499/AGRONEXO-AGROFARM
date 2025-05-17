import { Metadata } from "next";
import { UnderConstruction } from "@/components/ui/under-construction";
import { SiteHeader } from "@/components/dashboard/site-header";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";

export const metadata: Metadata = {
  title: "Indicadores | SR Consultoria",
  description: "Indicadores de desempenho e análises para tomada de decisão",
};

export default async function IndicatorsPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Indicadores" />
      <div className="p-4 md:p-6 pt-2 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Indicadores</h1>

        <UnderConstruction
          variant="coming-soon"
          title="Módulo de Indicadores em Desenvolvimento"
          message="O módulo de indicadores fornecerá métricas e KPIs consolidados em painéis interativos para análise de desempenho em todas as áreas da sua operação agropecuária."
          icon="database"
        />
      </div>
    </div>
  );
}
