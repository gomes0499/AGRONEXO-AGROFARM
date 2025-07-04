"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateHtmlPdfReport } from '@/lib/actions/definitive-report-actions';

interface PremiumPDFReportButtonProps {
  organizationId: string;
  disabled?: boolean;
}

export function PremiumPDFReportButton({ organizationId, disabled }: PremiumPDFReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    if (!organizationId || isGenerating) return;

    setIsGenerating(true);

    try {
      const result = await generateHtmlPdfReport(organizationId);

      if (result.success && result.data) {
        // Converter base64 para blob
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Criar URL para download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'Relatorio_Premium.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("✨ Relatório Premium Gerado!", {
          description: "Seu relatório em alta qualidade foi baixado com sucesso.",
          duration: 5000,
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório premium:', error);
      toast.error("❌ Erro na Geração", {
        description: error instanceof Error ? error.message : "Erro ao gerar relatório premium.",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={disabled || isGenerating || !organizationId}
      className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
      variant="default"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {isGenerating ? 'Gerando...' : 'Relatório Premium'}
      {!isGenerating && <Download className="h-4 w-4 ml-auto" />}
    </Button>
  );
}