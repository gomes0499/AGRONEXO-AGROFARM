"use server";

import { generateRatingPDF } from "@/lib/pdf/rating-pdf-generator";

export async function exportRatingPDF(calculation: any, organizationName: string) {
  try {
    // Generate the PDF
    const pdfBuffer = await generateRatingPDF(calculation, organizationName);
    
    // Convert buffer to base64 for client-side download
    const base64 = pdfBuffer.toString('base64');
    const filename = `rating_${calculation.rating_letra}_${new Date().toISOString().split('T')[0]}.pdf`;
    
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