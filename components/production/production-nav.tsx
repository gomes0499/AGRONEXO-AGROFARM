"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

export function ProductionNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Mapeamento de rotas para valores de tab
  const tabRoutes = {
    dashboard: "/dashboard/production",
    plantingAreas: "/dashboard/production/planting-areas",
    productivity: "/dashboard/production/productivity",
    costs: "/dashboard/production/costs",
    livestock: "/dashboard/production/livestock",
    livestockOperations: "/dashboard/production/livestock-operations",
    config: "/dashboard/production/config"
  };
  
  // Mapeamento reverso de rotas para valores de tab
  const routeToTabValue: Record<string, string> = {};
  Object.entries(tabRoutes).forEach(([tab, route]) => {
    routeToTabValue[route] = tab;
  });
  
  // Estabelecer a tab ativa com base no pathname atual
  useEffect(() => {
    let activeRoute = "";
    
    // Encontrar a correspondência mais longa para lidar com subrotas
    for (const [tab, route] of Object.entries(tabRoutes)) {
      if (pathname === route || 
          (pathname.startsWith(route + "/") && 
           // Caso especial para evitar que livestock seja ativado quando estamos em livestock-operations
           !(route === "/dashboard/production/livestock" && pathname.includes("livestock-operations")))) {
        // Se esta rota é mais longa do que a última correspondência, use-a
        if (route.length > activeRoute.length) {
          activeRoute = route;
          setActiveTab(tab);
        }
      }
    }
    
    // Caso especial para a página inicial
    if (pathname === "/dashboard/production") {
      setActiveTab("dashboard");
    }
  }, [pathname]);
  
  // Navegação entre tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(tabRoutes[value as keyof typeof tabRoutes]);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="plantingAreas">Áreas de Plantio</TabsTrigger>
        <TabsTrigger value="productivity">Produtividade</TabsTrigger>
        <TabsTrigger value="costs">Custos de Produção</TabsTrigger>
        <TabsTrigger value="livestock">Rebanho</TabsTrigger>
        <TabsTrigger value="livestockOperations">Operações Pecuárias</TabsTrigger>
        <TabsTrigger value="config">Configurações</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}