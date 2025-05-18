import { SiteHeader } from "@/components/dashboard/site-header";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { MemberDetails } from "@/components/organization/member-details";
import { notFound } from "next/navigation";

interface MemberDetailPageProps {
  params: {
    id: string;
    memberId: string;
  };
}

export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Obtém dados da organização e do membro
  const supabase = await createClient();

  // Verificar se o usuário tem permissão para acessar esta organização
  const { data: association } = await supabase
    .from("associacoes")
    .select("*")
    .eq("usuario_id", user.id)
    .eq("organizacao_id", params.id)
    .single();

  if (!association) {
    return notFound();
  }

  // Buscar organização
  const { data: organization } = await supabase
    .from("organizacoes")
    .select("id, nome, slug")
    .eq("id", params.id)
    .single();

  if (!organization) {
    return notFound();
  }

  // Buscar a associação do membro
  console.log("Buscando membro com ID:", params.memberId);
  console.log("Organização ID:", params.id);

  // Primeiro buscar a associação
  const { data: associationData, error: associationError } = await supabase
    .from("associacoes")
    .select("*")
    .eq("id", params.memberId)
    .eq("organizacao_id", params.id)
    .single();

  if (associationError) {
    console.error("Erro ao buscar associação:", associationError);
    return notFound();
  }

  if (!associationData) {
    console.log("Associação não encontrada");
    return notFound();
  }

  // Depois buscar os dados do usuário a partir do auth.users usando o admin client
  const adminClient = await createAdminClient();
  const { data: userData, error: userError } =
    await adminClient.auth.admin.getUserById(associationData.usuario_id);

  if (userError) {
    console.error("Erro ao buscar dados do usuário:", userError);
    return notFound();
  }

  if (!userData || !userData.user) {
    console.log("Usuário não encontrado");
    return notFound();
  }

  // Combinar os dados da associação com os dados do usuário
  const memberAssociation = {
    ...associationData,
    user: {
      id: userData.user.id,
      email: userData.user.email,
      nome:
        userData.user.user_metadata?.name || userData.user.email?.split("@")[0],
      telefone: userData.user.user_metadata?.telefone,
      imagem: userData.user.user_metadata?.avatar_url,
      metadados: userData.user.user_metadata || {},
    },
  };

  console.log("Dados do membro combinados:", memberAssociation);

  return (
    <div className="flex flex-col">
      <SiteHeader
        title={`Detalhes do Membro: ${
          memberAssociation.user?.nome || "Usuário"
        }`}
        showBackButton={true}
        backUrl={`/dashboard/organization/${params.id}`}
        backLabel="Voltar para Organização"
      />
      <main className="flex-1 p-6">
        <div className="max-w-4xl ">
          <MemberDetails
            member={memberAssociation}
            organizationId={params.id}
            organizationName={organization.nome}
          />
        </div>
      </main>
    </div>
  );
}
