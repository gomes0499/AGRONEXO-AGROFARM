"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getSeedSales,
  getLivestockSales,
  getPrices,
} from "@/lib/actions/commercial-actions";
import { getHarvests, getCultures } from "@/lib/actions/production-actions";
import { getProperties } from "@/lib/actions/property-actions";
import { SeedSale, LivestockSale } from "@/schemas/commercial";
import { Culture, Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import CommercialErrorBoundary from "@/components/commercial/common/commercial-error-boundary";
import { SeedSalesList } from "@/components/commercial/seeds/seed-sales-list";
import { NewSeedSaleButton } from "@/components/commercial/seeds/new-seed-sale-button";
import { LivestockSalesList } from "@/components/commercial/livestock/livestock-sales-list";
import { NewLivestockSaleButton } from "@/components/commercial/livestock/new-livestock-sale-button";

interface CommercialClientPageProps {
  organizationId: string;
}

// Função não aninhada para evitar problemas TDZ
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CommercialClientPage({
  organizationId,
}: CommercialClientPageProps) {
  // Criar estados para armazenar os dados
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("seeds");
  const [seedSales, setSeedSales] = useState<SeedSale[]>([]);
  const [livestockSales, setLivestockSales] = useState<LivestockSale[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Carregar os dados quando o componente montar
  useEffect(() => {
    if (!organizationId) return;

    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);

        // Carregar os dados um por um para evitar problemas com Promise.all
        const propertiesData = await getProperties(organizationId);
        if (!isMounted) return;
        setProperties(Array.isArray(propertiesData) ? propertiesData : []);

        const harvestsData = await getHarvests(organizationId);
        if (!isMounted) return;
        setHarvests(Array.isArray(harvestsData) ? harvestsData : []);

        const culturesData = await getCultures(organizationId);
        if (!isMounted) return;
        setCultures(Array.isArray(culturesData) ? culturesData : []);

        const seedSalesData = await getSeedSales(organizationId);
        if (!isMounted) return;
        setSeedSales(Array.isArray(seedSalesData) ? seedSalesData : []);

        const livestockSalesData = await getLivestockSales(organizationId);
        if (!isMounted) return;
        setLivestockSales(
          Array.isArray(livestockSalesData) ? livestockSalesData : []
        );
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        if (isMounted) {
          setError("Erro ao carregar dados. Por favor, tente novamente.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  // Mostrar um loader enquanto os dados estão carregando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Mostrar mensagem de erro se houver
  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 p-6 rounded-lg">
        <h3 className="text-red-600 font-medium">Erro no módulo comercial</h3>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  // Component for the Seeds Sales tab
  const SeedsComponent = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vendas de Sementes</h1>
          <p className="text-muted-foreground">
            Gestão financeira de vendas de sementes por cultura e ano
          </p>
        </div>
        <NewSeedSaleButton
          cultures={cultures}
          properties={properties}
          organizationId={organizationId}
          harvests={harvests}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados de Vendas</CardTitle>
          <CardDescription>
            Histórico de resultados de vendas de sementes por ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeedSalesList
            initialSeedSales={seedSales}
            cultures={cultures}
            properties={properties}
            organizationId={organizationId}
            harvests={harvests}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Component for the Livestock Sales tab
  const LivestockComponent = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vendas Pecuárias</h1>
          <p className="text-muted-foreground">
            Gestão financeira de vendas de produtos pecuários
          </p>
        </div>
        <NewLivestockSaleButton
          organizationId={organizationId}
          properties={properties}
          harvests={harvests}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados de Vendas Pecuárias</CardTitle>
          <CardDescription>
            Histórico financeiro de resultados pecuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LivestockSalesList
            initialLivestockSales={livestockSales}
            organizationId={organizationId}
            properties={properties}
            harvests={harvests}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Renderizar o conteúdo de modo seguro
  return (
    <CommercialErrorBoundary>
      <Tabs
        defaultValue="seeds"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="seeds">Sementes</TabsTrigger>
          <TabsTrigger value="livestock">Pecuária</TabsTrigger>
        </TabsList>

        <TabsContent value="seeds">{SeedsComponent}</TabsContent>

        <TabsContent value="livestock">{LivestockComponent}</TabsContent>
      </Tabs>
    </CommercialErrorBoundary>
  );
}
