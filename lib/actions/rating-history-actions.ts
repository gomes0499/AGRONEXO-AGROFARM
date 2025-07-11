"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface RatingHistoryItem {
  id?: string;
  organizacao_id: string;
  rating_calculation_id: string;
  safra_id: string;
  scenario_id?: string | null;
  modelo_id: string;
  rating_letra: string;
  pontuacao_total: number;
  pdf_file_name: string;
  pdf_file_url?: string;
  pdf_file_size?: number;
  generated_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  safra?: { nome: string };
  scenario?: { name: string };
  modelo?: { nome: string };
  organizacao?: { nome: string };
}

export async function saveRatingHistory({
  organizationId,
  ratingCalculationId,
  safraId,
  scenarioId,
  modeloId,
  ratingLetra,
  pontuacaoTotal,
  pdfFileName,
  pdfFileUrl,
  pdfFileSize,
}: {
  organizationId: string;
  ratingCalculationId: string;
  safraId: string;
  scenarioId?: string | null;
  modeloId: string;
  ratingLetra: string;
  pontuacaoTotal: number;
  pdfFileName: string;
  pdfFileUrl?: string;
  pdfFileSize?: number;
}): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("rating_history")
    .insert({
      organizacao_id: organizationId,
      rating_calculation_id: ratingCalculationId,
      safra_id: safraId,
      scenario_id: scenarioId,
      modelo_id: modeloId,
      rating_letra: ratingLetra,
      pontuacao_total: pontuacaoTotal,
      pdf_file_name: pdfFileName,
      pdf_file_url: pdfFileUrl,
      pdf_file_size: pdfFileSize,
    });
    
  if (error) {
    console.error("Error saving rating history:", error);
    throw new Error("Erro ao salvar histórico de rating");
  }
  
  revalidatePath("/indicators");
}

export async function getRatingHistory(
  organizationId: string
): Promise<RatingHistoryItem[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_history")
    .select(`
      *,
      safra:safras(nome),
      scenario:projection_scenarios(name),
      modelo:rating_models(nome),
      organizacao:organizacoes(nome)
    `)
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);
    
  if (error) {
    console.error("Error fetching rating history:", error);
    throw new Error("Erro ao buscar histórico de rating");
  }
  
  return data || [];
}

export async function deleteRatingHistory(historyId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("rating_history")
    .delete()
    .eq("id", historyId);
    
  if (error) {
    console.error("Error deleting rating history:", error);
    throw new Error("Erro ao excluir histórico de rating");
  }
  
  revalidatePath("/indicators");
}