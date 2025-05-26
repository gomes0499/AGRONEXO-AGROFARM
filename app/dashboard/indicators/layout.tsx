import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";

export const metadata: Metadata = {
  title: "Indicadores | SR Consultoria",
  description: "Análise e configuração de indicadores financeiros para monitoramento da saúde financeira da operação",
};

export default function IndicatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Indicadores" />
      <div className="p-4 md:p-6 pt-2 space-y-4">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}