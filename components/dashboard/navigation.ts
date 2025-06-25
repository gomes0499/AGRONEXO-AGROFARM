import { BuildingIcon, 
  WalletIcon, LineChartIcon, MapIcon, 
  LandmarkIcon, GaugeIcon, PaintbrushIcon,
  BarChartIcon,
  Brain,
  FileText
} from "lucide-react";
import { LayoutDashboardIcon } from "lucide-react";

export const data = {

  navMain: [
    {
      title: "Visão Geral",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Organização",
      url: "/dashboard/organization",
      icon: BuildingIcon,
    },
    {
      title: "Patrimonial",
      url: "/dashboard/assets",
      icon: LandmarkIcon,
    },
    {
      title: "Produção",
      url: "/dashboard/production",
      icon: BarChartIcon,
    },
    {
      title: "Financeiro",
      url: "/dashboard/financial",
      icon: WalletIcon,
    },
    {
      title: "Projeções",
      url: "/dashboard/projections",
      icon: LineChartIcon,
    },
    {
      title: "Indicadores",
      url: "/dashboard/indicators",
      icon: GaugeIcon,
    },
  ],
  navSecondary: [
    {
      title: "Tema",
      url: "#theme",
      icon: PaintbrushIcon,
      isThemeToggle: true,
    },
    {
      title: "Suporte",
      url: "/dashboard/support",
      icon: Brain,
    },
  ],
};