"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectionsPageData } from "@/lib/actions/projections/unified-projections-actions";

// Import refactored components
import { CultureProjectionsTable } from "@/components/projections/cultures/culture-projections-table";
import { DebtPositionTable } from "@/components/projections/debts/debt-position-table";

interface ProjectionsPageClientProps {
  organizationId: string;
  initialData: ProjectionsPageData;
}

export function ProjectionsPageClient({
  organizationId,
  initialData,
}: ProjectionsPageClientProps) {
  const {
    cultureProjections,
    debtPositions,
    safras,
  } = initialData;

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="cultures" className="w-full max-w-full">
        <div className="bg-card border-b overflow-x-auto">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList>
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
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          <TabsContent value="cultures" className="space-y-4">
            <CultureProjectionsTable
              organizationId={organizationId}
              initialProjections={cultureProjections}
              safras={safras}
            />
          </TabsContent>

          <TabsContent value="debts" className="space-y-4">
            <DebtPositionTable
              organizationId={organizationId}
              initialDebtPositions={debtPositions}
              safras={safras}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}