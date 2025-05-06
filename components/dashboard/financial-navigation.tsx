"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BanknoteIcon,
  Building2Icon,
  LayoutDashboardIcon,
  CoinsIcon,
  BuildingIcon,
  TruckIcon,
  BarChartIcon,
  CircleDollarSignIcon,
  PackageIcon,
  FileTextIcon,
} from "lucide-react";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

export function FinancialNavigation() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const NavItem = ({ href, label, icon, exact = false }: NavItemProps) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 py-2 px-3 text-sm rounded-md transition-colors",
        isActive(href, exact)
          ? "bg-primary text-primary-foreground font-medium"
          : "hover:bg-muted"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="grid gap-4">
      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
          Dashboard
        </h3>
        <div className="mt-2 grid gap-1">
          <NavItem
            href="/dashboard/financial"
            label="Visão Geral"
            icon={<LayoutDashboardIcon className="h-4 w-4" />}
            exact
          />
        </div>
      </div>

      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
          Dívidas
        </h3>
        <div className="mt-2 grid gap-1">
          <NavItem
            href="/dashboard/financial/bank-debts"
            label="Dívidas Bancárias"
            icon={<BanknoteIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/trading-debts"
            label="Dívidas com Trading"
            icon={<Building2Icon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/property-debts"
            label="Dívidas de Imóveis"
            icon={<BuildingIcon className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
          Fornecedores e Recebíveis
        </h3>
        <div className="mt-2 grid gap-1">
          <NavItem
            href="/dashboard/financial/suppliers"
            label="Fornecedores"
            icon={<TruckIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/receivables"
            label="Contratos Recebíveis"
            icon={<FileTextIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/supplier-advances"
            label="Adiantamentos"
            icon={<CoinsIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/third-party-loans"
            label="Empréstimos a Terceiros"
            icon={<CircleDollarSignIcon className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
          Liquidez e Estoques
        </h3>
        <div className="mt-2 grid gap-1">
          <NavItem
            href="/dashboard/financial/liquidity"
            label="Fatores de Liquidez"
            icon={<BarChartIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/inventories"
            label="Estoques"
            icon={<PackageIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/commodity-stocks"
            label="Estoques de Commodities"
            icon={<CoinsIcon className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}
