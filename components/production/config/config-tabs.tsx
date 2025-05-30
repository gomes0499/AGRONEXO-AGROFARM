"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CulturesTab } from "@/components/production/config/cultures-tab";
import { SystemsTab } from "@/components/production/config/systems-tab";
import { CyclesTab } from "@/components/production/config/cycles-tab";
import { HarvestsTab } from "@/components/production/config/harvests-tab";
import { Culture, System, Cycle, Harvest } from "@/schemas/production";

interface ConfigTabsProps {
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  harvests: Harvest[];
  organizationId: string;
}

export function ConfigTabs({
  cultures,
  systems,
  cycles,
  harvests,
  organizationId,
}: ConfigTabsProps) {
  const [activeTab, setActiveTab] = useState("cultures");

  return (
    <Tabs
      defaultValue="cultures"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full max-w-full"
    >
      <TabsList className="w-full justify-start h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap">
        <TabsTrigger value="cultures">Culturas</TabsTrigger>
        <TabsTrigger value="systems">Sistemas</TabsTrigger>
        <TabsTrigger value="cycles">Ciclos</TabsTrigger>
        <TabsTrigger value="harvests">Safras</TabsTrigger>
      </TabsList>

      <div className="mt-4">
        <TabsContent value="cultures" className="mt-0">
          <CulturesTab
            initialCultures={cultures}
            organizationId={organizationId}
          />
        </TabsContent>
        <TabsContent value="systems" className="mt-0">
          <SystemsTab
            initialSystems={systems}
            organizationId={organizationId}
          />
        </TabsContent>
        <TabsContent value="cycles" className="mt-0">
          <CyclesTab initialCycles={cycles} organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="harvests" className="mt-0">
          <HarvestsTab
            initialHarvests={harvests}
            organizationId={organizationId}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
