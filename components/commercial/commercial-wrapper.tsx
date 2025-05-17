"use client";

import { useState, useEffect } from "react";
import { CommercialNavClient } from "@/components/commercial/commercial-nav-client";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CommercialWrapperProps {
  seedsComponent: React.ReactNode;
  livestockComponent: React.ReactNode;
}

export function CommercialWrapper({
  seedsComponent,
  livestockComponent,
}: CommercialWrapperProps) {
  // Initialize with safe defaults
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Ensure rendering happens only on the client
  useEffect(() => {
    try {
      setIsClient(true);
    } catch (error) {
      console.error("Error initializing commercial wrapper:", error);
      setHasError(true);
    }
  }, []);

  // Show loading state if not yet client-rendered
  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Fallback error state
  if (hasError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Módulo Comercial</CardTitle>
          <CardDescription>
            Ocorreu um erro ao carregar o módulo comercial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Estamos enfrentando problemas técnicos. Por favor, tente novamente mais tarde.</p>
          <p className="text-sm text-gray-500 mt-2">
            Se o problema persistir, entre em contato com o suporte técnico.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Try/catch wrapped rendering for additional safety
  try {
    return (
      <CommercialNavClient
        seedsComponent={seedsComponent}
        livestockComponent={livestockComponent}
      />
    );
  } catch (error) {
    console.error("Error rendering commercial nav:", error);
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Módulo Comercial</CardTitle>
          <CardDescription>
            Ocorreu um erro ao carregar a navegação comercial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Estamos enfrentando problemas técnicos. Por favor, tente novamente mais tarde.</p>
          <p className="text-sm text-gray-500 mt-2">
            Se o problema persistir, entre em contato com o suporte técnico.
          </p>
        </CardContent>
      </Card>
    );
  }
}