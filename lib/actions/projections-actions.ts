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
export async function getProjections(organizationId?: string) {
  try {
    const supabase = await createClient();
    const orgId = organizationId || await getOrganizationId();

    const { data, error } = await supabase
      .from("projections")
      .select("*")
      .eq("organizacao_id", orgId)
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

// Buscar uma projeção por ID
export async function getProjectionById(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("projections")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar projeção:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao buscar projeção:", error);
    return { data: null, error };
  }
}

// Criar nova projeção
export async function createProjection(nome: string, descricao?: string) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();


    // Verificar se já existe uma projeção com o mesmo nome
    const { data: existingProjections, error: checkError } = await supabase
      .from("projections")
      .select("id, nome")
      .eq("organizacao_id", organizationId)
      .eq("is_active", true);

    if (checkError) {
      console.error("Erro ao verificar projeções existentes:", checkError);
      return { data: null, error: { message: "Erro ao verificar projeções existentes" } };
    }

    // Verificar manualmente se há duplicação (case-insensitive)
    const normalizedName = nome.trim().toLowerCase();
    const duplicateProjection = existingProjections?.find(
      proj => proj.nome.trim().toLowerCase() === normalizedName
    );

    if (duplicateProjection) {
      return { data: null, error: { message: `Já existe um cenário com o nome "${nome}"` } };
    }

    // 1. Criar a projeção master
    const { data: projection, error: projectionError } = await supabase
      .from("projections")
      .insert({
        organizacao_id: organizationId,
        nome: nome.trim(),
        descricao: descricao?.trim(),
        is_active: true,
      })
      .select()
      .single();

    if (projectionError) {
      console.error("❌ ERRO ao criar projeção:", projectionError);
      return { data: null, error: projectionError };
    }


    // 2. Copiar dados de áreas de plantio
    const { error: areasError } = await supabase.rpc('copy_areas_plantio_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (areasError) {
      console.error("❌ ERRO ao copiar áreas de plantio:", areasError);
    } else {
    }

    // 3. Copiar dados de produtividades
    const { error: produtividadesError } = await supabase.rpc('copy_produtividades_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (produtividadesError) {
      console.error("❌ ERRO ao copiar produtividades:", produtividadesError);
    } else {
    }

    // 4. Copiar dados de custos de produção
    const { error: custosError } = await supabase.rpc('copy_custos_producao_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (custosError) {
      console.error("❌ ERRO ao copiar custos de produção:", custosError);
    } else {
    }

    // 5. Copiar dados de preços de commodities
    const { error: commodityError } = await supabase.rpc('copy_commodity_prices_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (commodityError) {
      console.error("❌ ERRO ao copiar preços de commodities:", commodityError);
      console.error("Detalhes do erro:", {
        code: commodityError.code,
        message: commodityError.message,
        details: commodityError.details,
        hint: commodityError.hint
      });
    } else {
    }

    // 6. Copiar dados de cotações de câmbio
    const { error: cambioError } = await supabase.rpc('copy_cotacoes_cambio_to_projection', {
      p_projection_id: projection.id,
      p_organizacao_id: organizationId
    });

    if (cambioError) {
      console.error("❌ ERRO ao copiar cotações de câmbio:", cambioError);
      console.error("Detalhes do erro:", {
        code: cambioError.code,
        message: cambioError.message,
        details: cambioError.details,
        hint: cambioError.hint
      });
    } else {
    }

    
    revalidatePath("/dashboard/production");
    return { data: projection, error: null };
  } catch (error) {
    console.error("❌ ERRO GERAL ao criar projeção:", error);
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

    // Se está atualizando o nome, verificar se não há duplicação
    if (updates.nome) {
      const { data: existingProjections, error: checkError } = await supabase
        .from("projections")
        .select("id, nome")
        .eq("organizacao_id", organizationId)
        .eq("is_active", true)
        .neq("id", id);

      if (checkError) {
        console.error("Erro ao verificar projeções existentes:", checkError);
        return { data: null, error: { message: "Erro ao verificar projeções existentes" } };
      }

      // Verificar manualmente se há duplicação (case-insensitive)
      const normalizedName = updates.nome.trim().toLowerCase();
      const duplicateProjection = existingProjections?.find(
        proj => proj.nome.trim().toLowerCase() === normalizedName
      );

      if (duplicateProjection) {
        return { data: null, error: { message: `Já existe um cenário com o nome "${updates.nome}"` } };
      }
    }

    const { data, error } = await supabase
      .from("projections")
      .update({
        ...updates,
        nome: updates.nome?.trim(),
        descricao: updates.descricao?.trim(),
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