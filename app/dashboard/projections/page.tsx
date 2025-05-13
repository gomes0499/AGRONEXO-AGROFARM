import { Metadata } from "next";
import { UnderConstruction } from "@/components/ui/under-construction";

export const metadata: Metadata = {
  title: "Projeções | SR Consultoria",
  description: "Projeções e simulações para planejamento de safras futuras",
};

export default function ProjectionsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 md:p-6 pt-2 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Projeções</h1>

        <UnderConstruction
          variant="coming-soon"
          title="Módulo de Projeções em Desenvolvimento"
          message="O módulo de projeções oferecerá ferramentas avançadas para simular cenários futuros, planejar safras, prever resultados financeiros e analisar riscos para sua operação agropecuária."
          icon="database"
        />
      </div>
    </div>
  );
}
