import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Projeções | SR Consultoria",
  description: "Projeções financeiras e de produção para planejamento estratégico",
};

export default async function ProjectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  
  // Obter session para organizationId
  const session = await getSession();
  const organizationId = session?.organizationId;

  if (!organizationId) {
    throw new Error("Organization ID not found");
  }
  
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <SiteHeader title="Projeções" />
      <div className="flex-1 p-4 md:p-6 pt-2 overflow-hidden">
        {children}
      </div>
    </div>
  );
}