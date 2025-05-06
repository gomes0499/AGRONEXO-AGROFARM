import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/dashboard/site-header";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { InviteForm } from "@/components/organization/invite-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@/lib/auth/roles";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function InvitePage({ params }: PageProps) {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();
  
  // Verifica se o usuário é super admin
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;
  
  // Obtém dados da organização específica
  const supabase = await createClient();
  const { data: organization, error } = await supabase
    .from("organizacoes")
    .select("*")
    .eq("id", params.id)
    .single();

  // Se não encontrar a organização, retorna 404
  if (error || !organization) {
    return notFound();
  }

  // Se não for super admin, verifica se tem permissão para acessar esta organização
  if (!isSuperAdmin) {
    const { data: membership } = await supabase
      .from("associacoes")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("organizacao_id", params.id)
      .single();

    // Se não for membro da organização, redireciona
    if (!membership) {
      return redirect("/dashboard");
    }

    // Verifica se tem permissão de proprietário ou admin
    const canManage = membership.funcao === UserRole.PROPRIETARIO || 
                      membership.funcao === UserRole.ADMINISTRADOR;
    
    if (!canManage) {
      return redirect("/dashboard/organization");
    }
  }

  return (
    <div className="flex flex-col">
      <SiteHeader title={`Convidar para ${organization.nome}`} />
      <main className="flex-1 p-6">
        <div className="max-w-full">
          <Card>
            <CardHeader>
              <CardTitle>Convidar Novo Membro</CardTitle>
              <CardDescription>
                Envie convites para que outras pessoas possam participar da organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteForm organizationId={params.id} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}