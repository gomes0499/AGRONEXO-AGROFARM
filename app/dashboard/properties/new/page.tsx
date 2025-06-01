import { Metadata } from "next";
import { PropertyForm } from "@/components/properties/property-form";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { PropertyMigrationHelper } from "@/components/properties/property-migration-helper";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nova Propriedade | SR Consultoria",
  description: "Cadastre uma nova propriedade rural no sistema.",
};

export default async function NewPropertyPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();

  const session = await getSession();

  if (!session?.organizationId) {
    redirect("/dashboard");
  }

  // Verificar se todas as colunas necessárias existem na tabela propriedades
  const supabase = await createClient();
  const columnsToCheck = [
    "imagem",
    "cartorio_registro",
    "numero_car",
    "data_inicio",
    "data_termino",
    "tipo_anuencia",
  ];

  // Verificar cada coluna essencial
  let allColumnsExist = true;
  let missingColumns = [];

  for (const column of columnsToCheck) {
    const { count, error } = await supabase
      .from("information_schema.columns")
      .select("column_name", { count: "exact", head: true })
      .eq("table_name", "propriedades")
      .eq("column_name", column);

    if (error || !count || count === 0) {
      allColumnsExist = false;
      missingColumns.push(column);
    }
  }

  return (
    <>
      <SiteHeader
        title="Nova Propriedade"
        showBackButton
        backUrl="/dashboard/properties"
        backLabel="Voltar para Propriedades"
      />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Nova Propriedade
          </h1>
          <p className="text-muted-foreground">
            Cadastre uma nova propriedade rural no sistema.
          </p>
        </div>
        <Separator />

        {!allColumnsExist ? (
          <div className="my-4">
            <PropertyMigrationHelper missingColumns={missingColumns} />
          </div>
        ) : (
          <PropertyForm organizationId={session.organizationId} />
        )}
      </div>
    </>
  );
}
