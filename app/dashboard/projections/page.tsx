import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BarChart3, FileText, TrendingDown, TrendingUp, ClipboardList } from "lucide-react";

// Tabs components
import { CultureProjectionTab } from "@/components/projections/cultures/culture-projection-tab";
import { DebtProjectionTab } from "@/components/projections/debts/debt-projection-tab";
import { CashFlowProjectionTab } from "@/components/projections/cash-flow/cash-flow-projection-tab";
import { DRETab } from "@/components/projections/dre/dre-tab";
import { BalancoPatrimonialTab } from "@/components/projections/balanco/balanco-patrimonial-tab";

export const metadata: Metadata = {
  title: "Projeções | SR Consultoria",
  description: "Projeções e simulações para planejamento de safras futuras",
};

export default async function ProjectionsPage() {
  try {
    const session = await getSession();

    if (!session?.organization || !session?.organizationId) {
      redirect("/auth/login");
    }

    const organizationId = session.organizationId;

    return (
      <div className="-mt-6 -mx-4 md:-mx-6">
        <Tabs defaultValue="cultures" className="w-full max-w-full">
          <div className="bg-muted/50 border-b">
            <div className="container max-w-full px-4 md:px-6 py-2">
              <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start w-full">
                <TabsTrigger
                  value="cultures"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Projeções de Culturas
                </TabsTrigger>
                <TabsTrigger
                  value="debts"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Posição de Dívida
                </TabsTrigger>
                <TabsTrigger
                  value="cash-flow"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Fluxo de Caixa
                </TabsTrigger>
                <TabsTrigger
                  value="dre"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  DRE
                </TabsTrigger>
                <TabsTrigger
                  value="balanco"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Balanço Patrimonial
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="p-4 md:p-6 pt-4">
            <TabsContent value="cultures" className="space-y-4">
              <CultureProjectionTab organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="debts" className="space-y-4">
              <DebtProjectionTab organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="cash-flow" className="space-y-4">
              <CashFlowProjectionTab organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="dre" className="space-y-4">
              <DRETab organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="balanco" className="space-y-4">
              <BalancoPatrimonialTab organizationId={organizationId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Erro na página de projeções:", error);
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Erro ao carregar a página de projeções</p>
        <p className="text-muted-foreground mt-2">
          Por favor, tente novamente mais tarde.
        </p>
      </div>
    );
  }
}
