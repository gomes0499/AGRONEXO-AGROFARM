"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ReportGeneratorButtonProps {
  title?: string;
  className?: string;
}

export function ReportGeneratorButton({
  title = "Exportar Relatório",
  className,
}: ReportGeneratorButtonProps) {
  const [loading, setLoading] = useState(false);

  const exportAsPDF = async () => {
    try {
      setLoading(true);
      toast.info("Iniciando captura dos dados do dashboard...");

      // Seleciona o conteúdo ativo da aba atual
      const tabContent = document.querySelector('[role="tabpanel"][data-state="active"]');
      if (!tabContent) {
        throw new Error("Não foi possível encontrar o conteúdo da aba ativa");
      }

      // Cria um novo documento PDF
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // margens em mm

      // Adiciona título ao PDF
      const currentTabName = document.querySelector('[role="tab"][data-state="active"]')?.textContent || "Dashboard";
      pdf.setFontSize(18);
      pdf.text(`Relatório - ${currentTabName}`, margin, margin + 10);
      pdf.setFontSize(12);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, margin + 20);
      
      pdf.setFontSize(10);
      pdf.text("SR Consultoria", margin, pageHeight - margin);

      // Dar um tempo para os gráficos renderizarem completamente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Captura a página inteira primeiro como fallback
      const fullCanvas = await html2canvas(tabContent as HTMLElement, {
        scale: 1.5, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Ajusta o CSS do clone para garantir que elementos visíveis sejam capturados
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
          }
        }
      });
      
      // Adicionar imagem da página inteira ao PDF
      const fullImgData = fullCanvas.toDataURL('image/png');
      const fullImgWidth = pageWidth - (2 * margin);
      const fullImgHeight = (fullCanvas.height * fullImgWidth) / fullCanvas.width;
      
      if (fullImgHeight > pageHeight - (margin * 2)) {
        // A imagem é maior que a página, vamos dividir em várias páginas
        const pagesNeeded = Math.ceil(fullImgHeight / (pageHeight - (margin * 2)));
        
        for (let i = 0; i < pagesNeeded; i++) {
          if (i > 0) pdf.addPage();
          
          const srcY = i * fullCanvas.height / pagesNeeded;
          const srcHeight = fullCanvas.height / pagesNeeded;
          
          pdf.addImage(
            fullImgData, 
            'PNG', 
            margin, 
            i === 0 ? margin + 25 : margin, // Na primeira página, deixar espaço para o título
            fullImgWidth, 
            (pageHeight - (i === 0 ? margin + 25 : margin * 2)),
            '', 
            'FAST'
          );
        }
      } else {
        // A imagem cabe em uma única página
        pdf.addImage(
          fullImgData, 
          'PNG', 
          margin, 
          margin + 25, // Espaço para o título
          fullImgWidth, 
          fullImgHeight
        );
      }

      // Agora tenta capturar cada card individualmente para melhor qualidade
      try {
        const cards = tabContent.querySelectorAll('.card');
        let cardsPdf = new jsPDF("portrait", "mm", "a4");
        
        // Adiciona o mesmo título
        cardsPdf.setFontSize(18);
        cardsPdf.text(`Relatório - ${currentTabName} (Cards)`, margin, margin + 10);
        cardsPdf.setFontSize(12);
        cardsPdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, margin + 20);
        
        cardsPdf.setFontSize(10);
        cardsPdf.text("SR Consultoria", margin, pageHeight - margin);
        
        let yPosition = margin + 30; // Posição inicial após o título
        let hasValidCards = false;
        
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i] as HTMLElement;
          
          // Pular cards muito pequenos ou vazios
          if (card.offsetHeight < 50) continue;
          
          // Notificar progresso
          toast.info(`Processando card ${i+1} de ${cards.length}...`);
          
          try {
            // Captura o card como imagem
            const canvas = await html2canvas(card, {
              scale: 2, // Maior qualidade
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false,
              onclone: (clonedDoc) => {
                const clonedCard = clonedDoc.querySelector(`#${card.id}`) || clonedDoc.querySelectorAll('.card')[i];
                if (clonedCard) {
                  (clonedCard as HTMLElement).style.display = 'block';
                  (clonedCard as HTMLElement).style.visibility = 'visible';
                  (clonedCard as HTMLElement).style.position = 'static';
                  (clonedCard as HTMLElement).style.overflow = 'visible';
                  (clonedCard as HTMLElement).style.opacity = '1';
                }
              }
            });
            
            // Verificar se o canvas capturou alguma coisa
            const imageData = canvas.toDataURL('image/png');
            if (imageData === 'data:,') continue; // Canvas vazio
            
            // Calcular proporção da imagem
            const imgWidth = pageWidth - (2 * margin);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Verificar se precisamos adicionar uma nova página
            if (yPosition + imgHeight > pageHeight - margin) {
              cardsPdf.addPage();
              yPosition = margin;
            }
            
            // Adicionar a imagem ao PDF
            cardsPdf.addImage(imageData, 'PNG', margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10; // espaço entre as imagens
            hasValidCards = true;
          } catch (cardError) {
            console.warn(`Falha ao capturar card ${i+1}:`, cardError);
            // Continua com o próximo card
          }
        }
        
        // Se conseguimos capturar algum card individualmente, salve este PDF
        if (hasValidCards) {
          cardsPdf.save(`relatorio-cards-${currentTabName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
          toast.success("Relatório detalhado dos cards gerado com sucesso!");
        }
      } catch (cardsError) {
        console.warn("Não foi possível processar os cards individualmente:", cardsError);
        // Continua apenas com o PDF da página inteira
      }
      
      // Salvar o PDF principal (página inteira)
      pdf.save(`relatorio-${currentTabName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const exportAsImage = async () => {
    try {
      setLoading(true);
      toast.info("Capturando dashboard...");

      const tabContent = document.querySelector('[role="tabpanel"][data-state="active"]');
      if (!tabContent) {
        throw new Error("Não foi possível encontrar o conteúdo da aba ativa");
      }

      // Dar um tempo para os gráficos renderizarem completamente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capturar todo o conteúdo da aba
      const canvas = await html2canvas(tabContent as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Ajusta o CSS do clone para garantir que elementos visíveis sejam capturados
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

            // Garantir que gráficos sejam visíveis
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

      // Converter para imagem
      const image = canvas.toDataURL("image/png");
      
      // Criar link para download
      const link = document.createElement('a');
      const currentTabName = document.querySelector('[role="tab"][data-state="active"]')?.textContent || "Dashboard";
      link.download = `dashboard-${currentTabName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
      
      toast.success("Imagem do dashboard exportada com sucesso!");

      // Adicionalmente, tenta capturar cada card individualmente
      try {
        const cards = tabContent.querySelectorAll('.card');
        
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i] as HTMLElement;
          
          // Pular cards muito pequenos ou vazios
          if (card.offsetHeight < 50) continue;
          
          try {
            // Captura o card como imagem
            const cardCanvas = await html2canvas(card, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              onclone: (clonedDoc) => {
                const clonedCard = clonedDoc.querySelector(`#${card.id}`) || clonedDoc.querySelectorAll('.card')[i];
                if (clonedCard) {
                  (clonedCard as HTMLElement).style.display = 'block';
                  (clonedCard as HTMLElement).style.visibility = 'visible';
                  (clonedCard as HTMLElement).style.position = 'static';
                  (clonedCard as HTMLElement).style.overflow = 'visible';
                  (clonedCard as HTMLElement).style.opacity = '1';
                }
              }
            });
            
            // Converter para imagem
            const cardImage = cardCanvas.toDataURL("image/png");
            
            // Criar link para download do card
            const cardLink = document.createElement('a');
            const cardIndex = i + 1;
            cardLink.download = `card-${cardIndex}-${currentTabName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
            cardLink.href = cardImage;
            // Não fazer download automático de cada card para não sobrecarregar
            // cardLink.click();
          } catch (cardError) {
            console.warn(`Falha ao capturar card ${i+1} como imagem:`, cardError);
          }
        }
      } catch (cardsError) {
        console.warn("Não foi possível processar os cards individualmente:", cardsError);
      }
    } catch (error) {
      console.error("Erro ao exportar imagem:", error);
      toast.error("Erro ao exportar a imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {title}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Exportar Dados</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsImage}>
          <Download className="h-4 w-4 mr-2" />
          Exportar como Imagem
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}