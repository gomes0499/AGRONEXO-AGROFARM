"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { debugPropertiesQuery } from "@/lib/actions/debug-property-actions";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const runDebug = async () => {
    setLoading(true);
    try {
      const info = await debugPropertiesQuery();
      setDebugInfo(info);
    } catch (error) {
      console.error("Erro ao executar debug:", error);
      setDebugInfo({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      runDebug();
    }
  }, []);
  
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="mb-2"
      >
        {isOpen ? "Fechar" : "Debug"}
      </Button>
      
      {isOpen && (
        <Card className="w-96 max-h-96 overflow-auto shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Debug de Propriedades
              <Button
                onClick={runDebug}
                disabled={loading}
                size="sm"
                variant="ghost"
              >
                {loading ? "Carregando..." : "Atualizar"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {debugInfo && (
              <>
                {/* Sessão */}
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-1">
                    {debugInfo.session?.hasSession ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    Sessão
                  </h4>
                  <div className="pl-4 space-y-0.5 text-muted-foreground">
                    <p>Autenticado: {debugInfo.session?.hasSession ? "Sim" : "Não"}</p>
                    <p>Organização ID: {debugInfo.session?.organizationId}</p>
                    <p>Usuário ID: {debugInfo.session?.userId}</p>
                    <p>Função: {debugInfo.session?.role}</p>
                  </div>
                </div>
                
                {/* Banco de Dados */}
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-1">
                    {debugInfo.database?.error ? (
                      <XCircle className="h-3 w-3 text-red-500" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                    Banco de Dados
                  </h4>
                  <div className="pl-4 space-y-0.5 text-muted-foreground">
                    <p>Total de propriedades: {debugInfo.database?.propertiesCount}</p>
                    <p>Propriedades da organização: {debugInfo.database?.organizationPropertiesCount}</p>
                    {debugInfo.database?.rlsEnabled !== undefined && (
                      <p>RLS habilitado: {debugInfo.database?.rlsEnabled ? "Sim" : "Não"}</p>
                    )}
                    {debugInfo.database?.error && (
                      <div className="text-red-500 mt-1">
                        <p className="font-semibold">Erro:</p>
                        <p className="text-xs">{JSON.stringify(debugInfo.database.error, null, 2)}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Amostra de Dados */}
                {debugInfo.database?.sampleData && (
                  <div className="space-y-1">
                    <h4 className="font-semibold">Amostra de Dados</h4>
                    <div className="pl-4 space-y-0.5 text-muted-foreground">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(debugInfo.database.sampleData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* Erro Geral */}
                {debugInfo.error && (
                  <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-red-600 dark:text-red-400">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Erro
                    </p>
                    <p className="text-xs mt-1">{debugInfo.error}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}