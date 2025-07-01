import { useState, useEffect } from 'react';

// Hook para simular dados de projeção enquanto as tabelas não existem
export function useProjectionData(organizationId: string) {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Por enquanto, retornar cenários mockados
    setScenarios([
      {
        id: 'optimistic',
        name: 'Cenário Otimista',
        description: 'Dólar alto e produtividade aumentada',
        is_baseline: false,
        dollar_rate: 6.0,
        productivity_multiplier: 1.1,
      },
      {
        id: 'pessimistic',
        name: 'Cenário Pessimista',
        description: 'Dólar baixo e produtividade reduzida',
        is_baseline: false,
        dollar_rate: 4.5,
        productivity_multiplier: 0.9,
      }
    ]);
  }, [organizationId]);

  const createScenario = async (data: any) => {
    // Simular criação
    const newScenario = {
      id: `scenario-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
    };
    setScenarios([...scenarios, newScenario]);
    return newScenario;
  };

  const updateScenario = async (id: string, data: any) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteScenario = async (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  return {
    scenarios,
    loading,
    createScenario,
    updateScenario,
    deleteScenario,
  };
}