import { getOrganizationId } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeedsTab } from "@/components/commercial/seeds/seeds-tab";
import { LivestockTab } from "@/components/commercial/livestock/livestock-tab";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommercialDashboardPage() {
  const organizationId = await getOrganizationId();

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="seeds">
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start">
              <TabsTrigger
                value="seeds"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Sementes
              </TabsTrigger>
              <TabsTrigger
                value="livestock"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Pecuária
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          <TabsContent value="seeds" className="space-y-4">
            <SeedsTab organizationId={organizationId} />
          </TabsContent>

          <TabsContent value="livestock" className="space-y-4">
            <LivestockTab organizationId={organizationId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
