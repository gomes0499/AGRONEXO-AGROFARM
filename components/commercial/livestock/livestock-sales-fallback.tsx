"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export function LivestockSalesFallback() {
  // Safe state initialization that won't cause 'cannot access before initialization' error
  const [isClient, setIsClient] = useState(false);

  // Safely handle client-side rendering
  useEffect(() => {
    try {
      setIsClient(true);
    } catch (error) {
      console.error("Error initializing livestock sales component:", error);
    }
  }, []);

  // Simple fallback to ensure stable rendering
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vendas Pecuárias</h1>
          <p className="text-muted-foreground">
            Gestão financeira de vendas de produtos pecuários
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados de Vendas Pecuárias</CardTitle>
          <CardDescription>
            Histórico financeiro de resultados pecuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <input
                disabled
                placeholder="Buscar..."
                className="w-full h-10 pl-8 pr-4 border rounded-md"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <div className="flex items-center justify-center p-8 text-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-muted-foreground">
                  Carregando dados de vendas...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}