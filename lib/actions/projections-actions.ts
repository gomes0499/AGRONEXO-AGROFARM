"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface Projection {
  id: string;
  organizacao_id: string;
  nome: string;
  descricao?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Listar todas as projeções
export async function getProjections() {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from("projections")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar projeções:", error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Erro ao buscar projeções:", error);
    return { data: [], error };
  }
}

// Criar nova projeção
export async function createProjection(nome: string, descricao?: string) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    // 1. Criar a projeção master
    const { data: projection, error: projectionError } = await supabase
      .from("projections")
      .insert({
        organizacao_id: organizationId,
        nome,
        descricao,
        is_active: true,
      })
      .select()
      .single();

    if (projectionError) {
      console.error("Erro ao criar projeção:", projectionError);
      return { data: null, error: projectionError };
    }

    // 2. Copiar dados de áreas de plantio
    const { error: areasError } = await supabase.rpc('copy_areas_plantio_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (areasError) {
      console.error("Erro ao copiar áreas de plantio:", areasError);
    }

    // 3. Copiar dados de produtividades
    const { error: produtividadesError } = await supabase.rpc('copy_produtividades_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (produtividadesError) {
      console.error("Erro ao copiar produtividades:", produtividadesError);
    }

    // 4. Copiar dados de custos de produção
    const { error: custosError } = await supabase.rpc('copy_custos_producao_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (custosError) {
      console.error("Erro ao copiar custos de produção:", custosError);
    }

    // 5. Copiar dados de preços de commodities
    const { error: commodityError } = await supabase.rpc('copy_commodity_prices_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (commodityError) {
      console.error("Erro ao copiar preços de commodities:", commodityError);
    }

    // 6. Copiar dados de cotações de câmbio
    const { error: cambioError } = await supabase.rpc('copy_cotacoes_cambio_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (cambioError) {
      console.error("Erro ao copiar cotações de câmbio:", cambioError);
    }

    revalidatePath("/dashboard/production");
    return { data: projection, error: null };
  } catch (error) {
    console.error("Erro ao criar projeção:", error);
    return { data: null, error };
  }
}

// Atualizar projeção
export async function updateProjection(
  id: string,
  updates: {
    nome?: string;
    descricao?: string;
    is_active?: boolean;
  }
) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from("projections")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organizacao_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar projeção:", error);
      return { data: null, error };
    }

    revalidatePath("/dashboard/production");
    return { data, error: null };
  } catch (error) {
    console.error("Erro ao atualizar projeção:", error);
    return { data: null, error };
  }
}

// Deletar projeção
export async function deleteProjection(id: string) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { error } = await supabase
      .from("projections")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", organizationId);

    if (error) {
      console.error("Erro ao deletar projeção:", error);
      return { error };
    }

    revalidatePath("/dashboard/production");
    return { error: null };
  } catch (error) {
    console.error("Erro ao deletar projeção:", error);
    return { error };
  }
}