"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/auth";

export async function copyPricesToProjection(projectionId: string) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();


    // First, check if projection already has prices
    const { data: existingPrices, error: checkError } = await supabase
      .from("commodity_price_projections_projections")
      .select("id")
      .eq("projection_id", projectionId)
      .limit(1);

    if (checkError) {
      console.error("Error checking existing prices:", checkError);
      throw new Error("Failed to check existing prices");
    }

    if (existingPrices && existingPrices.length > 0) {
      return { success: true, message: "Projection already has prices" };
    }

    // Get all base commodity prices
    const { data: basePrices, error: fetchError } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId)
      .is("projection_id", null);

    if (fetchError) {
      console.error("Error fetching base prices:", fetchError);
      throw new Error("Failed to fetch base prices");
    }

    if (!basePrices || basePrices.length === 0) {
      return { success: true, message: "No base prices to copy" };
    }


    // Copy each price to the projection
    const projectionPrices = basePrices.map(price => ({
      projection_id: projectionId,
      organizacao_id: price.organizacao_id,
      commodity_type: price.commodity_type,
      cultura_id: price.cultura_id,
      sistema_id: price.sistema_id,
      ciclo_id: price.ciclo_id,
      safra_id: price.safra_id,
      unit: price.unit,
      current_price: price.current_price,
      precos_por_ano: price.precos_por_ano,
      premissas_precos: price.premissas_precos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      original_commodity_price_id: price.id
    }));

    const { data: insertedPrices, error: insertError } = await supabase
      .from("commodity_price_projections_projections")
      .insert(projectionPrices)
      .select();

    if (insertError) {
      console.error("Error inserting projection prices:", insertError);
      throw new Error("Failed to copy prices to projection");
    }


    // Also copy exchange rates if they exist
    const { data: baseRates, error: ratesError } = await supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("organizacao_id", organizationId)
      .is("projection_id", null);

    if (!ratesError && baseRates && baseRates.length > 0) {

      const projectionRates = baseRates.map(rate => ({
        projection_id: projectionId,
        organizacao_id: rate.organizacao_id,
        tipo_moeda: rate.tipo_moeda,
        safra_id: rate.safra_id,
        unit: rate.unit,
        cotacao_atual: rate.cotacao_atual,
        cotacoes_por_ano: rate.cotacoes_por_ano,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        original_cotacao_id: rate.id
      }));

      const { error: ratesInsertError } = await supabase
        .from("cotacoes_cambio_projections")
        .insert(projectionRates);

      if (ratesInsertError) {
        console.error("Error inserting exchange rates:", ratesInsertError);
      } else {
      }
    }

    return { 
      success: true, 
      message: `Successfully copied ${insertedPrices?.length || 0} prices to projection` 
    };
  } catch (error) {
    console.error("Error in copyPricesToProjection:", error);
    throw error;
  }
}

export async function fixAllProjectionsWithoutPrices() {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    // Get all projections for the organization
    const { data: projections, error: projectionsError } = await supabase
      .from("projections")
      .select("id, nome")
      .eq("organizacao_id", organizationId)
      .eq("is_active", true);

    if (projectionsError) {
      console.error("Error fetching projections:", projectionsError);
      throw new Error("Failed to fetch projections");
    }

    if (!projections || projections.length === 0) {
      return { success: true, message: "No projections found" };
    }

    let fixedCount = 0;
    for (const projection of projections) {
      try {
        await copyPricesToProjection(projection.id);
        fixedCount++;
      } catch (error) {
        console.error(`Failed to fix projection ${projection.nome}:`, error);
      }
    }

    return { 
      success: true, 
      message: `Fixed ${fixedCount} out of ${projections.length} projections` 
    };
  } catch (error) {
    console.error("Error in fixAllProjectionsWithoutPrices:", error);
    throw error;
  }
}