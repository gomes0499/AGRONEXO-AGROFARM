import { forceRefreshDebtMetrics } from "@/lib/actions/force-refresh-debt";
import { getTotalDividasBancariasConsolidado } from "@/lib/actions/financial-actions/dividas-bancarias";
import { getFinancialMetrics } from "@/lib/actions/financial-metrics-actions";

export default async function DebugDebtPage() {
  const organizationId = "41ee5785-2d48-4f68-a307-d4636d114ab1"; // Wilsemar Elger

  // Teste 1: Função direta do banco
  const directResult = await forceRefreshDebtMetrics(organizationId);
  
  // Teste 2: Função consolidada TypeScript
  const consolidatedResult = await getTotalDividasBancariasConsolidado(organizationId);
  
  // Teste 3: Métricas financeiras (que o dashboard usa)
  const financialMetrics = await getFinancialMetrics(organizationId);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Debug - Dívidas Bancárias</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">1. Função Direta do Banco (calcular_total_dividas_bancarias)</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(directResult, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">2. Função TypeScript (getTotalDividasBancariasConsolidado)</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(consolidatedResult, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">3. Métricas Financeiras (getFinancialMetrics)</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(financialMetrics.dividaBancaria, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-100 p-4 rounded border border-yellow-300">
          <h3 className="font-semibold text-yellow-800">Esperado:</h3>
          <p className="text-yellow-700">Todos os valores devem mostrar R$ 85.780.145</p>
        </div>
      </div>
    </div>
  );
}