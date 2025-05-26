"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LeaseList } from "@/components/properties/lease-list";
import { ImprovementList } from "@/components/properties/improvement-list";
import { PropertyDetail } from "@/components/properties/property-detail";
import { PropertyMap } from "@/components/properties/property-map";
import type { Property } from "@/schemas/properties";
import { Button } from "@/components/ui/button";
import { EditIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { deleteProperty } from "@/lib/actions/property-actions";

interface PropertyTabsProps {
  property: Property;
  leases: any[];
  improvements: any[];
}

export function PropertyTabs({
  property,
  leases,
  improvements,
}: PropertyTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Verificar o hash da URL ao carregar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (
        hash &&
        ["overview", "leases", "improvements", "map"].includes(hash)
      ) {
        setActiveTab(hash);
      }
    }
  }, []);

  // Atualizar a URL com o hash quando a tab mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProperty(property.id!);
      router.push("/dashboard/properties");
    } catch (error) {
      console.error("Erro ao excluir propriedade:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="leases">
              Arrendamentos ({leases.length})
            </TabsTrigger>
            <TabsTrigger value="improvements">
              Benfeitorias ({improvements.length})
            </TabsTrigger>
            <TabsTrigger value="map">Mapa CAR/SICAR</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/properties/${property.id}/edit`}>
                <EditIcon size={14} className="mr-1.5" />
                Editar
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2Icon size={14} className="mr-1.5" />
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir propriedade</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a propriedade &quot;
                    {property.nome}&quot;? Esta ação não pode ser desfeita e
                    removerá todos os dados relacionados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className={cn(
                      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                      isDeleting && "opacity-50 pointer-events-none"
                    )}
                  >
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <TabsContent value="overview" className="mt-4">
          <PropertyDetail property={property} />
        </TabsContent>

        <TabsContent value="leases" className="mt-4">
          <LeaseList 
            leases={leases} 
            propertyId={property.id!} 
            organizationId={property.organizacao_id}
          />
        </TabsContent>

        <TabsContent value="improvements" className="mt-4">
          <ImprovementList
            improvements={improvements}
            propertyId={property.id!}
            organizationId={property.organizacao_id}
          />
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <PropertyMap property={property} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
