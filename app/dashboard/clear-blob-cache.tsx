"use client";

import { useEffect } from "react";

/**
 * Componente para limpar URLs blob em cache
 * Ajuda a prevenir erros de blob resource ao recarregar a página
 */
export function ClearBlobCache() {
  useEffect(() => {
    // Limpar qualquer referência de blob URL em elementos de imagem
    const clearBlobUrls = () => {
      // Encontrar todos os elementos img com src blob
      const images = document.querySelectorAll('img[src^="blob:"]');
      images.forEach((img) => {
        const imgElement = img as HTMLImageElement;
        // Remover o src blob
        imgElement.src = "";
      });

      // Encontrar todos os elementos com background-image blob
      const elementsWithBgImage = document.querySelectorAll('[style*="blob:"]');
      elementsWithBgImage.forEach((el) => {
        const element = el as HTMLElement;
        if (element.style.backgroundImage?.includes('blob:')) {
          element.style.backgroundImage = "";
        }
      });
    };

    // Executar limpeza ao montar
    clearBlobUrls();

    // Executar limpeza ao detectar erros de blob
    const handleError = (e: ErrorEvent) => {
      if (e.message?.includes('WebKitBlobResource') || e.message?.includes('blob:')) {
        console.log("Detectado erro de blob resource, limpando URLs blob...");
        clearBlobUrls();
      }
    };

    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return null;
}