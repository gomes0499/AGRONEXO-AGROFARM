import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financeiro | SR Consultoria",
  description: "Gestão financeira e controle de dívidas e investimentos",
};

export default async function FinancialPage() {
  // Redirecionar para a página de dívidas bancárias ao acessar a raiz do módulo financeiro
  redirect("/dashboard/financial/bank-debts");
}