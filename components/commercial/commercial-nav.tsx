"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function CommercialNav() {
  const pathname = usePathname();
  
  // Lista das rotas do módulo comercial
  const routes = [
    "/dashboard/commercial",
    "/dashboard/commercial/prices",
    "/dashboard/commercial/seed-sales",
    "/dashboard/commercial/livestock-sales",
    "/dashboard/commercial/stocks",
    "/dashboard/commercial/analysis",
  ];
  
  // Função para determinar se um link está ativo
  const getNavClass = (path: string) => {
    let active = false;
    
    if (path === "/dashboard/commercial") {
      // Dashboard é selecionado apenas se o caminho for exatamente igual
      active = pathname === path;
    } else {
      // Outros itens são selecionados se o caminho começar com o path
      const exactMatch = pathname === path;
      const startsWithPath = pathname.startsWith(path + "/");
      
      // Checa se é um match para esta rota
      active = exactMatch || startsWithPath;
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
        href="/dashboard/commercial" 
        className={getNavClass("/dashboard/commercial")}
      >
        Dashboard
      </Link>
      <Link 
        href="/dashboard/commercial/prices" 
        className={getNavClass("/dashboard/commercial/prices")}
      >
        Preços
      </Link>
      <Link 
        href="/dashboard/commercial/seed-sales" 
        className={getNavClass("/dashboard/commercial/seed-sales")}
      >
        Vendas de Sementes
      </Link>
      <Link 
        href="/dashboard/commercial/livestock-sales" 
        className={getNavClass("/dashboard/commercial/livestock-sales")}
      >
        Vendas Pecuárias
      </Link>
      <Link 
        href="/dashboard/commercial/stocks" 
        className={getNavClass("/dashboard/commercial/stocks")}
      >
        Estoques
      </Link>
      <Link 
        href="/dashboard/commercial/analysis" 
        className={getNavClass("/dashboard/commercial/analysis")}
      >
        Análise de Mercado
      </Link>
    </div>
  );
}