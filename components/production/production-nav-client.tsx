"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

export interface ProductionNavClientProps {
  children: React.ReactNode;
}

export function ProductionNavClient({ children }: ProductionNavClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Estado para controlar a transição de navegação
  const [isPending, startTransition] = useTransition();
  // Estado para armazenar a tab que está sendo carregada
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  // Mapeamento de rotas para valores de tab
  const tabRoutes = {
    dashboard: "/dashboard/production",
    plantingAreas: "/dashboard/production/planting-areas",
    productivity: "/dashboard/production/productivity",
    costs: "/dashboard/production/costs",
    livestock: "/dashboard/production/livestock",
    livestockOperations: "/dashboard/production/livestock-operations",
    config: "/dashboard/production/config",
  };

  // Estabelecer a tab ativa com base no pathname atual
  useEffect(() => {
    let activeRoute = "";
    let foundTab = "dashboard"; // Default

    // Encontrar a correspondência mais longa para lidar com subrotas
    for (const [tab, route] of Object.entries(tabRoutes)) {
      if (
        pathname === route ||
        (pathname.startsWith(route + "/") &&
          // Caso especial para evitar que livestock seja ativado quando estamos em livestock-operations
          !(
            route === "/dashboard/production/livestock" &&
            pathname.includes("livestock-operations")
          ))
      ) {
        // Se esta rota é mais longa do que a última correspondência, use-a
        if (route.length > activeRoute.length) {
          activeRoute = route;
          foundTab = tab;
        }
      }
    }

    // Caso especial para a página inicial
    if (pathname === "/dashboard/production") {
      foundTab = "dashboard";
    }

    setActiveTab(foundTab);
    setPendingTab(null); // Limpar qualquer tab pendente
    setLoading(false);
  }, [pathname]);

  // Navegação entre tabs com atualização do URL (mas sem recarregar a página)
  const handleTabChange = (value: string) => {
    if (value === activeTab) return;

    // Definimos a tab pendente para feedback visual
    setPendingTab(value);

    // Usamos startTransition para indicar que estamos em uma transição
    startTransition(() => {
      // Atualizamos o URL
      router.push(tabRoutes[value as keyof typeof tabRoutes], {
        scroll: false,
      });

      // A atualização do activeTab será feita pelo useEffect que monitora o pathname
    });
  };

  if (loading || !activeTab) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {/* Configurações sempre por último */}
          <TabsTrigger value="config" className="relative">
            {isPending && pendingTab === "config" && (
              <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin text-primary" />
            )}
            Configurações
          </TabsTrigger>
          {/* Dashboard tab sempre primeiro */}
          <TabsTrigger value="dashboard" className="relative">
            {isPending && pendingTab === "dashboard" && (
              <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin text-primary" />
            )}
            Dashboard
          </TabsTrigger>

          {/* Áreas de Plantio */}
          <TabsTrigger value="plantingAreas" className="relative">
            {isPending && pendingTab === "plantingAreas" && (
              <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin text-primary" />
            )}
            Áreas de Plantio
          </TabsTrigger>

          {/* Produtividade */}
          <TabsTrigger value="productivity" className="relative">
            {isPending && pendingTab === "productivity" && (
              <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin text-primary" />
            )}
            Produtividade
          </TabsTrigger>

          {/* Custos de Produção */}
          <TabsTrigger value="costs" className="relative">
            {isPending && pendingTab === "costs" && (
              <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin text-primary" />
            )}
            Custos de Produção
          </TabsTrigger>

          {/* Rebanho */}
          <TabsTrigger value="livestock" className="relative">
            {isPending && pendingTab === "livestock" && (
              <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin text-primary" />
            )}
            Rebanho
          </TabsTrigger>

          {/* Operações Pecuárias */}
          <TabsTrigger value="livestockOperations" className="relative">
            {isPending && pendingTab === "livestockOperations" && (
              <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin text-primary" />
            )}
            Operações Pecuárias
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Wrapper para o conteúdo com indicador de carregamento */}
      <div className="mt-4 relative">
        {/* Overlay semi-transparente durante a transição */}
        {isPending && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
