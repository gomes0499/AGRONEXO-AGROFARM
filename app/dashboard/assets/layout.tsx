import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";

export const metadata: Metadata = {
  title: "Patrimônio | AGROFARM",
  description: "Gestão patrimonial e controle de ativos",
};

export default async function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Patrimônio" />
      <div className="p-4 md:p-6 pt-2 space-y-4">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}