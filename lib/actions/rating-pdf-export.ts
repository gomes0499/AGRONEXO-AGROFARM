"use server";

import { generateRatingPDF } from "@/lib/pdf/rating-pdf-generator";
import { saveRatingHistory } from "./rating-history-actions";

// Função para apenas gerar PDF sem salvar no histórico
export async function generateRatingPDFOnly(calculation: any, organizationName: string) {
  return exportRatingPDF(calculation, organizationName, false);
}

export async function exportRatingPDF(calculation: any, organizationName: string, saveToHistory: boolean = true) {
  try {
    // Generate the PDF
    const pdfBuffer = await generateRatingPDF(calculation, organizationName);
    
    // Convert buffer to base64 for client-side download
    const base64 = pdfBuffer.toString('base64');
    const filename = `rating_${calculation.rating_letra}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save to history if we have necessary data
    console.log("Full calculation object:", calculation);
    console.log("Calculation data extracted:", {
      id: calculation.id,
      organizacao_id: calculation.organizacao_id,
      rating_model_id: calculation.rating_model_id,
      modelo_id: calculation.modelo_id,
      cenario_id: calculation.cenario_id,
      safra_id: calculation.safra_id,
      detalhes_calculo: calculation.detalhes_calculo
    });
    
    if (calculation.id && calculation.organizacao_id && saveToHistory) {
      try {
        // Try to get modelo_id from different places
        const modeloId = calculation.modelo_id || 
                        calculation.rating_model_id || 
                        calculation.detalhes_calculo?.modelo_id ||
                        '19183c48-d1a9-4651-8fe7-3616eab0fd76'; // SR/Prime model ID as fallback
        
        // Get safra_id from multiple sources
        const safraId = calculation.safra_id || 
                       calculation.detalhes_calculo?.safra_id;
                       
        if (!safraId) {
          console.error("No safra_id found in calculation");
          throw new Error("safra_id is required for rating history");
        }
        
        const historyData = {
          organizationId: calculation.organizacao_id,
          ratingCalculationId: calculation.id,
          safraId: safraId,
          scenarioId: calculation.cenario_id || calculation.scenario_id || calculation.detalhes_calculo?.scenario_id || null,
          modeloId: modeloId,
          ratingLetra: calculation.rating_letra,
          pontuacaoTotal: calculation.pontuacao_total,
          pdfFileName: filename,
          pdfFileSize: pdfBuffer.length,
        };
        
        console.log("Saving rating history with data:", historyData);
        
        await saveRatingHistory(historyData);
        console.log("Rating history saved successfully");
      } catch (historyError) {
        console.error("Error saving rating history:", historyError);
        // Don't fail the PDF export if history save fails
      }
    } else {
      console.log("Missing required data for history:", {
        hasId: !!calculation.id,
        hasOrgId: !!calculation.organizacao_id
      });
    }
    
    return {
      success: true,
      data: base64,
      filename
    };
  } catch (error) {
    console.error("Error generating rating PDF:", error);
    return {
      success: false,
      error: "Erro ao gerar PDF do rating"
    };
  }
}