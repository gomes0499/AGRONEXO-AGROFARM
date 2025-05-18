"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export interface CommercialNavClientProps {
  seedsComponent?: React.ReactNode;
  livestockComponent?: React.ReactNode;
  stocksComponent?: React.ReactNode;
}

export function CommercialNavClient({
  seedsComponent,
  livestockComponent,
}: CommercialNavClientProps) {
  const [activeTab, setActiveTab] = useState("seeds");

  // Handler for tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-4">
          {/* Seeds Tab */}
          <TabsTrigger value="seeds" className="relative">
            Sementes
          </TabsTrigger>

          {/* Livestock Tab */}
          <TabsTrigger value="livestock" className="relative">
            Pecuária
          </TabsTrigger>
        </TabsList>

        {/* Contents for each tab */}
        <TabsContent value="seeds" className="mt-0">
          {seedsComponent || (
            <div className="flex items-center justify-center h-60 border rounded-lg">
              <p className="text-muted-foreground">
                Módulo de vendas de sementes em desenvolvimento
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="livestock" className="mt-0">
          {livestockComponent || (
            <div className="flex items-center justify-center h-60 border rounded-lg">
              <p className="text-muted-foreground">
                Módulo de vendas pecuárias em desenvolvimento
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}