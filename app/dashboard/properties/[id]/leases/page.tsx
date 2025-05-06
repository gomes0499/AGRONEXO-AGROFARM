import { Metadata } from "next";
import { LeaseList } from "@/components/properties/lease-list";
import { getLeases, getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Arrendamentos | SR Consultoria",
  description: "Gerenciamento de contratos de arrendamento para a propriedade.",
};

interface LeasesPageProps {
  params: {
    id: string;
  };
}

export default async function LeasesPage({ params }: LeasesPageProps) {
  const session = await getSession();
  
  if (!session?.organizationId) {
    redirect("/dashboard");
  }
  
  try {
    const [property, leases] = await Promise.all([
      getPropertyById(params.id),
      getLeases(session.organizationId, params.id)
    ]);
    
    // Verificar se a propriedade pertence à organização atual
    if (property.organizacao_id !== session.organizationId) {
      notFound();
    }
    
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/properties/${params.id}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar à Propriedade
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              Arrendamentos: {property.nome}
            </h1>
          </div>
        </div>
        
        <LeaseList leases={leases} propertyId={params.id} />
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    notFound();
  }
}