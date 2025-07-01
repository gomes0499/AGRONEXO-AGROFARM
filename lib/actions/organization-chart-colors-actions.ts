"use server";

import { createClient } from "@/lib/supabase/server";
import { ChartColors, DEFAULT_CHART_COLORS } from "@/lib/constants/chart-colors";

export async function getOrganizationChartColors(organizationId: string): Promise<ChartColors> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("organizacoes")
      .select("chart_colors")
      .eq("id", organizationId)
      .single();
    
    if (error) {
      console.error("Erro ao buscar cores da organização:", error);
      return DEFAULT_CHART_COLORS;
    }
    
    // Se não houver cores personalizadas, retornar as padrões
    if (!data?.chart_colors) {
      return DEFAULT_CHART_COLORS;
    }
    
    // Garantir que todas as cores estejam presentes
    return {
      ...DEFAULT_CHART_COLORS,
      ...data.chart_colors
    };
  } catch (error) {
    console.error("Erro ao buscar cores:", error);
    return DEFAULT_CHART_COLORS;
  }
}

export async function updateOrganizationChartColors(
  organizationId: string, 
  colors: Partial<ChartColors>
): Promise<ChartColors> {
  try {
    const supabase = await createClient();
    
    // Buscar cores atuais
    const currentColors = await getOrganizationChartColors(organizationId);
    
    // Mesclar com as novas cores
    const updatedColors = {
      ...currentColors,
      ...colors
    };
    
    // Atualizar no banco
    const { error } = await supabase
      .from("organizacoes")
      .update({ 
        chart_colors: updatedColors,
        updated_at: new Date().toISOString()
      })
      .eq("id", organizationId);
    
    if (error) {
      console.error("Erro ao atualizar cores:", error);
      throw new Error("Erro ao atualizar cores da organização");
    }
    
    return updatedColors;
  } catch (error) {
    console.error("Erro ao atualizar cores:", error);
    throw error;
  }
}