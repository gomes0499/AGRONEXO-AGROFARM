"use client";

import { useEffect } from "react";

// IDs dos indicadores CEPEA que queremos buscar
const CEPEA_INDICATOR_IDS = [54, 2, "381-56", 77, 92, 91, 53, 23];

export function CepeaDataLoader() {
  useEffect(() => {
    // Função para capturar dados do widget CEPEA
    (window as any).onCepeaWidgetData = async (data: any[]) => {
      console.log("Dados CEPEA recebidos:", data);
      
      try {
        // Enviar dados para o backend
        const response = await fetch("/api/cepea/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data }),
        });
        
        if (!response.ok) {
          console.error("Erro ao enviar dados CEPEA para o backend");
        }
      } catch (error) {
        console.error("Erro ao processar dados CEPEA:", error);
      }
    };

    // Criar e adicionar o script do widget CEPEA
    const script = document.createElement("script");
    script.type = "text/javascript";
    
    // Construir URL com todos os indicadores
    const indicatorParams = CEPEA_INDICATOR_IDS.map(id => `id_indicador[]=${id}`).join("&");
    script.src = `https://www.cepea.org.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=400px&corfundo=dbd6b2&cortexto=333333&corlinha=ede7bf&${indicatorParams}`;
    
    // Adicionar script ao documento
    document.body.appendChild(script);

    // Verificar periodicamente se os dados foram carregados
    const checkInterval = setInterval(() => {
      if ((window as any).cepeaData) {
        console.log("Dados CEPEA encontrados em window.cepeaData:", (window as any).cepeaData);
        (window as any).onCepeaWidgetData((window as any).cepeaData);
        clearInterval(checkInterval);
      }
    }, 1000);

    // Limpar após 30 segundos
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      clearInterval(checkInterval);
      delete (window as any).onCepeaWidgetData;
      delete (window as any).cepeaData;
    };
  }, []);

  // Este componente não renderiza nada visível
  return (
    <div 
      id="cepea-widget-container" 
      style={{ display: "none" }}
      aria-hidden="true"
    />
  );
}