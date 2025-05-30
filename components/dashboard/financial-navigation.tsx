"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BanknoteIcon,
  Building2Icon,
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
          Módulo Financeiro
        </h3>
        <div className="mt-2 grid gap-1">
          <NavItem
            href="/dashboard/financial/dividas-bancarias"
            label="Dívidas Bancárias"
            icon={<BanknoteIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/dividas-terras"
            label="Dívidas Terras"
            icon={<BuildingIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/dividas-fornecedores"
            label="Dívidas Fornecedores"
            icon={<TruckIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/caixa-disponibilidades"
            label="Caixa e Disponibilidades"
            icon={<BarChartIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/financeiras"
            label="Financeiras"
            icon={<CircleDollarSignIcon className="h-4 w-4" />}
          />
          <NavItem
            href="/dashboard/financial/outras-despesas"
            label="Outras Despesas"
            icon={<FileTextIcon className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}
