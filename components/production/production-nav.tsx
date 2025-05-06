"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProductionNav() {
  const pathname = usePathname();
  
  // Definir todas as rotas possíveis
  const routes = [
    "/dashboard/production",
    "/dashboard/production/planting-areas",
    "/dashboard/production/productivity",
    "/dashboard/production/costs",
    "/dashboard/production/livestock",
    "/dashboard/production/livestock-operations",
    "/dashboard/production/config"
  ];
  
  // Função mais precisa para identificar a rota ativa
  const getNavClass = (path: string) => {
    let active = false;
    
    if (path === "/dashboard/production") {
      // Dashboard é selecionado apenas se o caminho for exatamente igual
      active = pathname === path;
    } else {
      // Para outras rotas, verificamos se o pathname começa com o path
      // mas também garantimos que não é uma rota mais específica que pertence a outro item
      const exactMatch = pathname === path;
      const startsWithPath = pathname.startsWith(path + "/");
      
      // Checa se é um match para esta rota e não para uma rota mais específica de outro item
      active = exactMatch || startsWithPath;
      
      // Casos especiais
      if (path === "/dashboard/production/livestock" && pathname.includes("livestock-operations")) {
        active = false;
      }
    }
    
    return cn(
      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
      active 
        ? "bg-muted" 
        : "hover:bg-muted/60"
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Link 
        href="/dashboard/production" 
        className={getNavClass("/dashboard/production")}
      >
        Dashboard
      </Link>
      <Link 
        href="/dashboard/production/planting-areas" 
        className={getNavClass("/dashboard/production/planting-areas")}
      >
        Áreas de Plantio
      </Link>
      <Link 
        href="/dashboard/production/productivity" 
        className={getNavClass("/dashboard/production/productivity")}
      >
        Produtividade
      </Link>
      <Link 
        href="/dashboard/production/costs" 
        className={getNavClass("/dashboard/production/costs")}
      >
        Custos de Produção
      </Link>
      <Link 
        href="/dashboard/production/livestock" 
        className={getNavClass("/dashboard/production/livestock")}
      >
        Rebanho
      </Link>
      <Link 
        href="/dashboard/production/livestock-operations" 
        className={getNavClass("/dashboard/production/livestock-operations")}
      >
        Operações Pecuárias
      </Link>
      <Link 
        href="/dashboard/production/config" 
        className={getNavClass("/dashboard/production/config")}
      >
        Configurações
      </Link>
    </div>
  );
}