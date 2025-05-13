import { Metadata } from "next";
import { UnderConstruction } from "@/components/ui/under-construction";

export const metadata: Metadata = {
  title: "Patrimonial | SR Consultoria",
  description: "Gestão patrimonial e controle de ativos",
};

export default function AssetsPage() {
  return (
    <div className="flex flex-col min-h-screen">
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
