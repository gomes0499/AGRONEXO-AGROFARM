"use client";

import { UnderConstruction } from "@/components/ui/under-construction";
import { Button } from "@/components/ui/button";

export default function UnderConstructionExamplePage() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-semibold mb-4">Exemplo de "Dados Insuficientes"</h2>
        <UnderConstruction
          variant="no-data"
          icon="database"
          showBackButton={false}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Exemplo Com Mensagem Personalizada</h2>
        <UnderConstruction
          title="Dados Em Processamento"
          message="Aguarde enquanto processamos os dados necessários para esta funcionalidade."
          variant="no-data"
          icon="database"
          showBackButton={false}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Exemplo Com Conteúdo Adicional</h2>
        <UnderConstruction
          variant="no-data"
          icon="database"
          showBackButton={false}
        >
          <div className="flex flex-col items-center mt-2">
            <p className="mb-2 text-sm text-center">Deseja ser notificado quando esta funcionalidade estiver disponível?</p>
            <Button variant="outline" size="sm">Ativar Notificações</Button>
          </div>
        </UnderConstruction>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Outros Exemplos do Componente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UnderConstruction 
            variant="coming-soon"
            showBackButton={false}
          />
          
          <UnderConstruction
            variant="maintenance"
            icon="wrench"
            showBackButton={false}
          />
        </div>
      </div>
    </div>
  );
}