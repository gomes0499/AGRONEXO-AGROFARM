"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface FullReportGeneratorProps {
  title?: string;
  className?: string;
  organizationName?: string;
}

export function FullReportGenerator({
  title = "Gerar Relatório Completo",
  className,
  organizationName = "Minha Organização",
}: FullReportGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const generateFullReport = async () => {
    try {
      setLoading(true);
      toast.info("Iniciando geração do relatório completo...");

      // Cria um novo documento PDF
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // margens em mm

      // Preparar capa do relatório
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Desenha um retângulo colorido para representar a logo da SR Consultoria
      pdf.setFillColor(0, 102, 204); // Azul corporativo
      pdf.rect(margin, 30, pageWidth - (margin * 2), 10, 'F');
      
      // Adiciona texto da logo
      pdf.setFontSize(28);
      pdf.setTextColor(0, 102, 204);
      pdf.text("SR CONSULTORIA", pageWidth / 2, 60, { align: "center" });
      
      // Adiciona slogan
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Relatórios e Análises Empresariais", pageWidth / 2, 70, { align: "center" });

      // Adiciona título do relatório
      pdf.setFontSize(22);
      pdf.setTextColor(50, 50, 50);
      pdf.text("RELATÓRIO COMPLETO", pageWidth / 2, 100, { align: "center" });
      
      // Adiciona nome da organização
      pdf.setFontSize(18);
      pdf.text(organizationName, pageWidth / 2, 115, { align: "center" });
      
      // Adiciona data
      pdf.setFontSize(14);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 130, { align: "center" });
      
      // Adiciona rodapé
      pdf.setFontSize(10);
      pdf.text("SR Consultoria - Relatório Confidencial", pageWidth / 2, pageHeight - 20, { align: "center" });

      // Lista das abas a serem capturadas
      const tabs = [
        { id: "properties", title: "Propriedades" },
        { id: "production", title: "Produção" },
        { id: "financial", title: "Financeiro" },
        { id: "projections", title: "Fluxo de Caixa Projetado" }
      ];

      // Função para ativar uma aba
      const activateTab = (tabId: string) => {
        const tab = document.querySelector(`[role="tab"][value="${tabId}"]`) as HTMLElement;
        if (tab) {
          tab.click();
          return true;
        }
        return false;
      };

      // Função para capturar uma aba
      const captureTab = async (tabId: string, tabTitle: string) => {
        // Verifica se conseguiu ativar a aba
        if (!activateTab(tabId)) {
          toast.error(`Não foi possível acessar a aba ${tabTitle}`);
          return;
        }
        
        // Aguarda a aba ser renderizada
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const tabContent = document.querySelector('[role="tabpanel"][data-state="active"]') as HTMLElement;
        if (!tabContent) {
          toast.error(`Não foi possível encontrar o conteúdo da aba ${tabTitle}`);
          return;
        }

        // Notifica usuário
        toast.info(`Capturando aba ${tabTitle}...`);
        
        // Adiciona uma nova página para cada aba (exceto a primeira que vem após a capa)
        if (tabId !== tabs[0].id) {
          pdf.addPage();
        } else {
          pdf.addPage();
        }
        
        // Adiciona título da seção
        pdf.setFillColor(240, 240, 240);
        pdf.rect(0, 0, pageWidth, 20, 'F');
        pdf.setFontSize(14);
        pdf.setTextColor(50, 50, 50);
        pdf.text(tabTitle, margin, 15);
        
        // Captura a aba
        const canvas = await html2canvas(tabContent, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: (clonedDoc) => {
            const clonedContent = clonedDoc.querySelector('[role="tabpanel"][data-state="active"]');
            if (clonedContent) {
              (clonedContent as HTMLElement).style.height = 'auto';
              (clonedContent as HTMLElement).style.overflow = 'visible';
              (clonedContent as HTMLElement).style.display = 'block';
              (clonedContent as HTMLElement).style.position = 'static';
              
              // Garantir que todos os cards sejam visíveis
              const cards = clonedContent.querySelectorAll('.card');
              cards.forEach(card => {
                (card as HTMLElement).style.display = 'block';
                (card as HTMLElement).style.overflow = 'visible';
                (card as HTMLElement).style.height = 'auto';
                (card as HTMLElement).style.visibility = 'visible';
                (card as HTMLElement).style.opacity = '1';
              });
              
              // Garantir que SVGs estejam visíveis
              const svgs = clonedContent.querySelectorAll('svg');
              svgs.forEach(svg => {
                svg.setAttribute('width', svg.getAttribute('width') || '100%');
                svg.setAttribute('height', svg.getAttribute('height') || '100%');
                svg.style.visibility = 'visible';
                svg.style.display = 'block';
              });
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Se a imagem for maior que a página, divida em várias páginas
        if (imgHeight > pageHeight - 30) {
          const pagesNeeded = Math.ceil(imgHeight / (pageHeight - 30));
          
          for (let i = 0; i < pagesNeeded; i++) {
            if (i > 0) pdf.addPage();
            
            const srcY = i * canvas.height / pagesNeeded;
            const srcHeight = canvas.height / pagesNeeded;
            
            pdf.addImage(
              imgData, 
              'PNG', 
              margin, 
              25, // Espaço para o título
              imgWidth, 
              (pageHeight - 35), // Altura ajustada para caber na página
              '', 
              'FAST'
            );
            
            // Adiciona numeração de página
            pdf.setFontSize(10);
            pdf.text(`${tabTitle} - Página ${i+1} de ${pagesNeeded}`, pageWidth / 2, pageHeight - 10, { align: "center" });
          }
        } else {
          // A imagem cabe em uma única página
          pdf.addImage(
            imgData, 
            'PNG', 
            margin, 
            25, // Espaço para o título
            imgWidth, 
            imgHeight
          );
          
          // Adiciona numeração de página
          pdf.setFontSize(10);
          pdf.text(`${tabTitle}`, pageWidth / 2, pageHeight - 10, { align: "center" });
        }
      };

      // Captura cada aba sequencialmente
      for (const tab of tabs) {
        await captureTab(tab.id, tab.title);
      }

      // Salvar o PDF
      pdf.save(`relatorio-completo-${organizationName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Relatório completo gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório completo:", error);
      toast.error("Erro ao gerar o relatório completo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="default"
      className={className}
      onClick={generateFullReport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {title}
    </Button>
  );
}