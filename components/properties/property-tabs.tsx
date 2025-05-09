"use client";

import { useState, useEffect } from "react";
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

  // Atualizar a URL com o hash quando a tab mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  // Verificar o hash da URL ao carregar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["overview", "leases", "improvements", "map"].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

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

  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "leases", label: `Arrendamentos (${leases.length})` },
    { id: "improvements", label: `Benfeitorias (${improvements.length})` },
    { id: "map", label: "Mapa CAR/SICAR" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="border-b border-border/60 flex-1">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-sm font-medium px-4 py-2 border-b-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                )}
                aria-current={activeTab === tab.id ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex gap-2 ml-4">
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

      <div className="mt-4">
        {activeTab === "overview" && <PropertyDetail property={property} />}

        {activeTab === "leases" && (
          <LeaseList leases={leases} propertyId={property.id!} />
        )}

        {activeTab === "improvements" && (
          <ImprovementList
            improvements={improvements}
            propertyId={property.id!}
          />
        )}

        {activeTab === "map" && (
          <PropertyMap property={property} />
        )}
      </div>
    </div>
  );
}
