"use client";

import { DebtPositionTable } from "./debt-position-table";

interface DebtProjectionTabProps {
  organizationId: string;
}

export function DebtProjectionTab({ organizationId }: DebtProjectionTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <DebtPositionTable 
        organizationId={organizationId} 
        initialDebtPositions={{
          dividas: [],
          ativos: [],
          indicadores: {
            endividamento_total: {},
            caixas_disponibilidades: {},
            divida_liquida: {},
            divida_dolar: {},
            divida_liquida_dolar: {},
            receita_ano_safra: {},
            ebitda_ano_safra: {},
            dolar_fechamento: {},
            patrimonio_liquido: {},
            ltv: {},
            indicadores_calculados: {
              divida_receita: {},
              divida_ebitda: {},
              divida_liquida_receita: {},
              divida_liquida_ebitda: {},
              reducao_valor: {},
              reducao_percentual: {}
            }
          },
          anos: []
        }}
        safras={[]}
      />
    </div>
  );
}