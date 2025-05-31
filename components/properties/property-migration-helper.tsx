"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, DatabaseZap } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ensurePropertyTableColumns } from "@/lib/actions/property-actions";

interface PropertyMigrationHelperProps {
  missingColumns?: string[];
}

export function PropertyMigrationHelper({ missingColumns = [] }: PropertyMigrationHelperProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleRunMigration = async () => {
    try {
      setIsRunning(true);
      const success = await ensurePropertyTableColumns();
      
      setResult({ success });
      
      if (success) {
        toast.success("Migração da tabela de propriedades concluída com sucesso!");
        
        // Se a migração foi bem-sucedida, recarregar a página após 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error("Erro ao executar migração. Verifique o console para mais detalhes.");
      }
    } catch (error) {
      console.error("Erro ao executar migração:", error);
      toast.error("Erro ao executar migração. Verifique o console para mais detalhes.");
      setResult({ success: false, error: String(error) });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTitle>Erro na estrutura da tabela de propriedades</AlertTitle>
        <AlertDescription>
          {missingColumns.length > 0 ? (
            <>
              A tabela de propriedades está faltando as seguintes colunas: <strong>{missingColumns.join(', ')}</strong>. 
              Clique no botão abaixo para adicionar todas as colunas necessárias.
            </>
          ) : (
            <>
              A tabela de propriedades está faltando algumas colunas necessárias. 
              Clique no botão abaixo para adicionar as colunas necessárias.
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button 
          onClick={handleRunMigration} 
          disabled={isRunning}
          variant="default"
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Executando migração...
            </>
          ) : (
            <>
              <DatabaseZap className="h-4 w-4" />
              Corrigir tabela de propriedades
            </>
          )}
        </Button>
        
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Recarregar página
        </Button>
      </div>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <AlertTitle>{result.success ? "Sucesso" : "Erro"}</AlertTitle>
          <AlertDescription>
            {result.success 
              ? "Migração concluída com sucesso. Você pode agora tentar criar uma propriedade novamente." 
              : `Erro na migração: ${result.error || "Erro desconhecido"}`
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}