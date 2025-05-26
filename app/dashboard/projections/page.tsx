import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";

// Tabs components
import { CultureProjectionTab } from "@/components/projections/cultures/culture-projection-tab";
import { DebtProjectionTab } from "@/components/projections/debts/debt-projection-tab";
import { CashFlowProjectionTab } from "@/components/projections/cash-flow/cash-flow-projection-tab";

export const metadata: Metadata = {
  title: "Projeções | SR Consultoria",
  description: "Projeções e simulações para planejamento de safras futuras",
};

export default async function ProjectionsPage() {
  const session = await getSession();

  if (!session?.organization || !session?.organizationId) {
    redirect("/auth/login");
  }

  const organizationId = session.organizationId;

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="cultures">
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start">
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
        </div>
      </Tabs>
    </div>
  );
}
