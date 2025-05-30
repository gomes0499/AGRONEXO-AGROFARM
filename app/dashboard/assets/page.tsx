import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EquipmentsTab } from "@/components/assets/equipment/equipments-tab";
import { InvestmentsTab } from "@/components/assets/investments/investments-tab";
import { AssetSalesTab } from "@/components/assets/asset-sales/asset-sales-tab";
import { LandPlansTab } from "@/components/assets/land-plans/land-plans-tab";
import { Wrench, TrendingUp, HandCoins, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssetsPage() {
  const session = await getSession();

  if (!session?.organization || !session?.organizationId) {
    redirect("/auth/login");
  }

  const organizationId = session.organizationId;

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="equipments">
        <div className="bg-muted/50 border-b">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start w-full">
              <TabsTrigger
                value="equipments"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Equipamentos
              </TabsTrigger>
              <TabsTrigger
                value="investments"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Investimentos
              </TabsTrigger>
              <TabsTrigger
                value="asset-sales"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Vendas de Ativos
              </TabsTrigger>
              <TabsTrigger
                value="land-plans"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Aquisição de Áreas
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          <TabsContent value="equipments" className="space-y-4">
            <EquipmentsTab organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="investments" className="space-y-4">
            <InvestmentsTab organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="asset-sales" className="space-y-4">
            <AssetSalesTab organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="land-plans" className="space-y-4">
            <LandPlansTab organizationId={organizationId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
