"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndicatorConfigPanel } from "./indicator-config-panel";
import { Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { indicatorLabels } from "@/schemas/indicators";

type IndicatorConfigModalProps = {
  indicatorConfigs: Record<string, any>;
};

export function IndicatorConfigModal({
  indicatorConfigs,
}: IndicatorConfigModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("LIQUIDEZ");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Configurar Indicadores
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-5xl">
        <DialogHeader>
          <DialogTitle>Configurações de Indicadores</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <ScrollArea className="w-full">
              <TabsList className="w-full mb-4" >
                {Object.entries(indicatorLabels).map(([type, label]) => (
                  <TabsTrigger key={type} value={type}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>

            {Object.keys(indicatorLabels).map((type) => (
              <TabsContent key={type} value={type} className="mt-2">
                <ScrollArea className="h-[500px]">
                  <IndicatorConfigPanel
                    initialConfigs={{
                      [type]: indicatorConfigs[type],
                    }}
                    singleIndicator={type}
                  />
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
