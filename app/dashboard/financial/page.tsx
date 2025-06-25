import { Metadata } from "next";
import { getOrganizationId, getSession } from "@/lib/auth";
import { FinancialPageContent } from "@/components/financial/financial-page-content";

// Import our new actions
import { getDividasBancarias } from "@/lib/actions/financial-actions/dividas-bancarias";
import { getDividasTerras } from "@/lib/actions/financial-actions/dividas-terras";
import { getDividasFornecedores } from "@/lib/actions/financial-actions/dividas-fornecedores";
import { getCaixaDisponibilidades } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { getFinanceiras } from "@/lib/actions/financial-actions/financeiras";
import { getOutrasDespesas } from "@/lib/actions/financial-actions/outras-despesas";
import { getReceitasFinanceiras } from "@/lib/actions/financial-actions/receitas-financeiras-actions";
import { getSafras } from "@/lib/actions/production-actions";

export const metadata: Metadata = {
  title: "Financeiro | SR Consultoria",
  description: "Gestão financeira e controle de dívidas e disponibilidades",
};

export default async function FinancialPage() {
  const session = await getSession();
  const organizationId = await getOrganizationId();

  if (!session?.organization || !session?.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }

  const organization = {
    id: session.organizationId,
    nome: session.organization.nome,
  };

  // Fetch data from our new tables with error handling
  const [
    dividasBancarias,
    dividasTerras,
    dividasFornecedores,
    caixaDisponibilidades,
    financeiras,
    outrasDespesas,
    receitasFinanceiras,
    safras,
  ] = await Promise.all([
    getDividasBancarias(organizationId).catch((err) => {
      console.error("Erro ao buscar dívidas bancárias:", err);
      return [];
    }),
    getDividasTerras(organizationId).catch((err) => {
      console.error("Erro ao buscar dívidas de terras:", err);
      return [];
    }),
    getDividasFornecedores(organizationId).catch((err) => {
      console.error("Erro ao buscar dívidas de fornecedores:", err);
      return [];
    }),
    getCaixaDisponibilidades(organizationId).catch((err) => {
      console.error("Erro ao buscar caixa e disponibilidades:", err);
      return [];
    }),
    getFinanceiras(organizationId).catch((err) => {
      console.error("Erro ao buscar operações financeiras:", err);
      return [];
    }),
    getOutrasDespesas(organizationId).catch((err) => {
      console.error("Erro ao buscar outras despesas:", err);
      return [];
    }),
    getReceitasFinanceiras(organizationId).catch((err) => {
      console.error("Erro ao buscar receitas financeiras:", err);
      return [];
    }),
    getSafras(organizationId).catch((err) => {
      console.error("Erro ao buscar safras:", err);
      return [];
    }),
  ]);

  // Calculate totals for outras_despesas
  const outrasDespesasWithTotal = outrasDespesas.map((item) => {
    const valores = item.valores_por_safra || {};
    let total = 0;

    if (typeof valores === "string") {
      try {
        const parsedValues = JSON.parse(valores);
        total = Object.values(parsedValues).reduce<number>(
          (sum, value) => sum + (Number(value) || 0),
          0
        );
      } catch (e) {
        console.error("Erro ao processar valores_por_safra:", e);
      }
    } else {
      total = Object.values(valores).reduce<number>(
        (sum, value) => sum + (Number(value) || 0),
        0
      );
    }

    return {
      ...item,
      total,
    };
  });

  return (
    <FinancialPageContent
      organization={organization}
      dividasBancarias={dividasBancarias}
      dividasTerras={dividasTerras}
      dividasFornecedores={dividasFornecedores}
      caixaDisponibilidades={caixaDisponibilidades}
      financeiras={financeiras}
      outrasDespesasWithTotal={outrasDespesasWithTotal}
      receitasFinanceiras={receitasFinanceiras}
      safras={safras}
      organizationId={organizationId}
    />
  );
}
