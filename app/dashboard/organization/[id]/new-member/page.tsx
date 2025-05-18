import { SiteHeader } from "@/components/dashboard/site-header";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { MemberForm } from "@/components/organization/member-form";

interface NewMemberPageProps {
  params: {
    id: string;
  };
}

export default async function NewMemberPage({ params }: NewMemberPageProps) {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Obtém dados da organização
  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizacoes")
    .select("*")
    .eq("id", params.id)
    .single();

  // Verifica se o usuário tem permissão para acessar esta organização
  const { data: association } = await supabase
    .from("associacoes")
    .select("*")
    .eq("usuario_id", user.id)
    .eq("organizacao_id", params.id)
    .single();

  if (!association) {
    return (
      <div className="flex flex-col">
        <SiteHeader 
          title="Novo Membro"
          showBackButton={true}
          backUrl={`/dashboard/organization/${params.id}`}
          backLabel="Voltar"
        />
        <div className="flex flex-1 flex-col items-start justify-start p-6">
          <div className="max-w-md text-left">
            <h2 className="text-2xl font-semibold">
              Acesso não autorizado
            </h2>
            <p className="mt-2 text-muted-foreground">
              Você não tem permissão para adicionar membros a esta organização.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SiteHeader 
        title="Adicionar Novo Membro"
        showBackButton={true}
        backUrl={`/dashboard/organization/${params.id}`}
        backLabel="Voltar"
      />
      <main className="flex-1 p-6">
        <div className="max-w-3xl">
          <MemberForm 
            organizationId={params.id} 
            organizationName={organization?.nome || "Organização"} 
          />
        </div>
      </main>
    </div>
  );
}