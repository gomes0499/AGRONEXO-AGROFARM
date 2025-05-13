import { Metadata } from "next";
import { UnderConstruction } from "@/components/ui/under-construction";

export const metadata: Metadata = {
  title: "Comercial | SR Consultoria",
  description: "Gestão comercial de commodities e produtos agrícolas",
};

export default function CommercialDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 md:p-6 pt-2 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Comercial</h1>

        <UnderConstruction
          variant="coming-soon"
          title="Módulo Comercial em Desenvolvimento"
          message="O módulo comercial permitirá o gerenciamento completo de operações de venda, precificação e análise de mercado para otimizar a comercialização da sua produção agrícola."
          icon="database"
        />
      </div>
    </div>
  );
}
