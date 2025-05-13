import { HelpCircleIcon, SearchIcon, PieChartIcon, BuildingIcon, BrainCircuitIcon, Brain } from "lucide-react";
import { 
  BarChartIcon, CameraIcon, FileCodeIcon, FileTextIcon, FolderIcon, 
  SettingsIcon, UsersIcon, WalletIcon, LineChartIcon, MapIcon, 
  LandmarkIcon, AreaChartIcon, GaugeIcon, StoreIcon
} from "lucide-react";
import { LayoutDashboardIcon } from "lucide-react";
import { ListIcon } from "lucide-react";

export const data = {
  user: {
    name: "Usuário",
    email: "usuario@exemplo.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Início",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Organização",
      url: "/dashboard/organization",
      icon: BuildingIcon,
    },
    {
      title: "Propriedades",
      url: "/dashboard/properties",
      icon: MapIcon,
    },
    {
      title: "Produção",
      url: "/dashboard/production",
      icon: BarChartIcon,
    },
    {
      title: "Comercial",
      url: "/dashboard/commercial",
      icon: StoreIcon,
    },
    {
      title: "Financeiro",
      url: "/dashboard/financial",
      icon: WalletIcon,
    },
    {
      title: "Patrimonial",
      url: "/dashboard/assets",
      icon: LandmarkIcon,
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
      title: "Suporte com IA",
      url: "/dashboard/support",
      icon: Brain,
    },
 
  ],
};