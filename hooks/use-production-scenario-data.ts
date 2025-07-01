import { useEffect, useState } from "react";
import { useProductionScenario } from "@/contexts/production-scenario-context";
import { getProductivityScenarioDataWithDetails } from "@/lib/actions/productivity-scenario-actions";

export function useProductionScenarioData(organizationId?: string) {
  const { activeProductivityScenarioId, activeProductivityScenario } = useProductionScenario();
  const [scenarioData, setScenarioData] = useState<Record<string, any>>({});
  const [mappedData, setMappedData] = useState<Record<string, Record<string, any>>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeProductivityScenarioId || !organizationId) {
      setScenarioData({});
      setMappedData({});
      return;
    }

    async function loadScenarioData() {
      try {
        setIsLoading(true);
        const data = await getProductivityScenarioDataWithDetails(activeProductivityScenarioId!, organizationId!);
        
        // Organizar dados por produtividade_id e safra_id
        const organized: Record<string, Record<string, any>> = {};
        
        // Organizar dados por chave cultura-sistema para facilitar uso nos gráficos
        const mapped: Record<string, Record<string, any>> = {};
        
        data.forEach((item: any) => {
          if (!organized[item.produtividade_id]) {
            organized[item.produtividade_id] = {};
          }
          organized[item.produtividade_id][item.safra_id] = {
            produtividade: item.produtividade,
            unidade: item.unidade
          };
          
          // Criar chave para mapeamento similar ao usado nos gráficos
          if (item.produtividade?.cultura && item.produtividade?.sistema) {
            const cultureName = item.produtividade.cultura.nome;
            const systemName = item.produtividade.sistema.nome;
            
            // Normalizar nome da cultura para match com o gráfico
            let chartKey = cultureName;
            
            // Para ALGODÃO SEQUEIRO, o gráfico pode usar apenas "Algodão"
            if (cultureName === 'ALGODÃO' && systemName === 'SEQUEIRO') {
              chartKey = 'Algodão';
            } else if (systemName && systemName !== 'SEQUEIRO') {
              chartKey = `${cultureName} ${systemName}`;
            }
            
            console.log(`Mapping: ${cultureName} ${systemName} -> ${chartKey}`);
            
            if (!mapped[chartKey]) {
              mapped[chartKey] = {};
            }
            
            mapped[chartKey][item.safra_id] = {
              produtividade: item.produtividade,
              unidade: item.unidade
            };
          }
        });
        
        setScenarioData(organized);
        setMappedData(mapped);
        console.log('Scenario data loaded:', { organized, mapped });
      } catch (error) {
        console.error("Error loading scenario data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadScenarioData();
  }, [activeProductivityScenarioId, organizationId]);

  return {
    activeScenario: activeProductivityScenario,
    scenarioData,
    mappedData,
    isLoading,
    hasActiveScenario: !!activeProductivityScenarioId
  };
}