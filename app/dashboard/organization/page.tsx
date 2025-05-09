import { SiteHeader } from "@/components/dashboard/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { UserRole } from "@/lib/auth/roles";
import { OrganizationInfo } from "@/components/organization/organization-info";
import { OrganizationMembers } from "@/components/organization/organization-members";
import { OrganizationInvites } from "@/components/organization/organization-invites";
import { OrganizationSettings } from "@/components/organization/organization-settings";
import { OrganizationList } from "@/components/organization/organization-list";

export default async function OrganizationPage() {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Verifica se o usuário é super admin
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;

  // Obtém dados do usuário e suas associações
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("*, organizacao:organizacao_id(*), associacao:associacoes(*)")
    .eq("id", user.id)
    .single();

  // Se for super admin, mostra página de listagem de todas organizações
  if (isSuperAdmin) {
    // Buscar todas as organizações
    const { data: allOrganizations } = await supabase
      .from("organizacoes")
      .select("*")
      .order("nome");

    return (
      <div className="flex flex-col">
        <SiteHeader title="Todas as Organizações" />
        <main className="flex-1 p-6">
          <OrganizationList organizations={allOrganizations || []} />
        </main>
      </div>
    );
  }

  // Para usuários normais, verifica se tem organização associada
  const organizationId = userData?.organizacao?.id;
  const userRole = userData?.associacao?.[0]?.funcao;
  const isOwnerOrAdmin =
    userRole === UserRole.PROPRIETARIO || userRole === UserRole.ADMINISTRADOR;

  // Se não tiver organização, mostra um estado vazio
  if (!organizationId) {
    return (
      <div className="flex flex-col">
        <SiteHeader title="Organização" />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl font-semibold">
              Sem organização associada
            </h2>
            <p className="mt-2 text-muted-foreground">
              Você ainda não está associado a uma organização. Crie uma
              organização ou aguarde um convite para começar.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/organization/new">Criar Organização</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Buscar mais dados da organização
  const { data: organizationData } = await supabase
    .from("organizacoes")
    .select("*")
    .eq("id", organizationId)
    .single();

  // Buscar membros da organização
  const { data: members } = await supabase
    .from("associacoes")
    .select("*, user:user_id(*)")
    .eq("organizacao_id", organizationId)
    .order("eh_proprietario", { ascending: false });

  // Buscar convites pendentes
  const { data: invites } = await supabase
    .from("convites")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("status", "PENDENTE");

  return (
    <div className="flex flex-col">
      <SiteHeader title="Organização" />
      <main className="flex-1 p-6">
        <Tabs defaultValue="info">
          <TabsList className="mb-6">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            {isOwnerOrAdmin && (
              <TabsTrigger value="invites">Convites</TabsTrigger>
            )}
            {isOwnerOrAdmin && (
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <OrganizationInfo
              organization={organizationData}
              isOwnerOrAdmin={isOwnerOrAdmin}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <OrganizationMembers
              members={members || []}
              isOwnerOrAdmin={isOwnerOrAdmin}
            />
          </TabsContent>

          {isOwnerOrAdmin && (
            <TabsContent value="invites" className="space-y-6">
              <OrganizationInvites invites={invites || []} />
            </TabsContent>
          )}

          {isOwnerOrAdmin && (
            <TabsContent value="settings" className="space-y-6">
              <OrganizationSettings />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
