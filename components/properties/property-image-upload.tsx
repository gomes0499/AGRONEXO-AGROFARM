"use client";

import { useState, useRef, useEffect } from "react";
import { ImageUploadCropper } from "@/components/ui/image-upload-cropper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { uploadPropertyImage, removePropertyImage } from "@/lib/actions/upload-actions";
import { Loader2 } from "lucide-react";

interface PropertyImageUploadProps {
  propertyId?: string;
  currentImageUrl?: string | null;
  onSuccess?: (imageUrl: string) => void;
  onRemove?: () => void;
  // Modo temporário para quando estamos criando uma nova propriedade
  isTemporary?: boolean;
}

export function PropertyImageUpload({
  propertyId,
  currentImageUrl,
  onSuccess,
  onRemove,
  isTemporary = false,
}: PropertyImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [temporaryImage, setTemporaryImage] = useState<File | null>(null);

  const handleImageCropped = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Se estamos no modo temporário (criação de propriedade),
      // apenas armazenamos o arquivo na memória e enviamos a URL temporária
      if (isTemporary) {
        setTemporaryImage(file);
        
        // Convertemos o arquivo para uma URL temporária
        const tempUrl = URL.createObjectURL(file);
        
        if (onSuccess) {
          onSuccess(tempUrl);
        }
        
        toast.success("Imagem selecionada com sucesso. Será salva ao criar a propriedade.");
      } 
      // Para propriedades existentes, fazemos o upload para o servidor
      else if (propertyId) {
        // Cria um FormData para upload
        const formData = new FormData();
        formData.append("file", file);
        
        // Chama a server action para upload
        const result = await uploadPropertyImage(propertyId, formData);
        
        if (result.success) {
          // Salva o caminho do arquivo para possível exclusão futura
          setFilePath(result.data?.path);
          toast.success("Imagem da propriedade atualizada com sucesso");
          
          // Callback opcional
          if (onSuccess && result.data?.publicUrl) {
            onSuccess(result.data.publicUrl);
          }
        } else {
          toast.error(result.error || "Erro ao fazer upload da imagem");
        }
      }
    } catch (error) {
      console.error("Erro ao processar upload:", error);
      toast.error("Ocorreu um erro ao processar a imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    // Se estamos no modo temporário, apenas limpamos a referência
    if (isTemporary) {
      setTemporaryImage(null);
      
      if (onRemove) {
        onRemove();
      }
      
      return;
    }
    
    // Para propriedades existentes, removemos do servidor
    if (!currentImageUrl || !filePath || !propertyId) return;
    
    try {
      setIsUploading(true);
      
      // Chama a server action para remover a imagem
      const result = await removePropertyImage(propertyId, filePath);
      
      if (result.success) {
        toast.success("Imagem removida com sucesso");
        setFilePath(null);
        
        // Callback opcional
        if (onRemove) {
          onRemove();
        }
      } else {
        toast.error(result.error || "Erro ao remover a imagem");
      }
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      toast.error("Ocorreu um erro ao remover a imagem");
    } finally {
      setIsUploading(false);
    }
  };

  // Função para obter o arquivo temporário (para uso quando criarmos a propriedade)
  const getTemporaryFile = () => temporaryImage;

  // Função para expor o arquivo temporário para o DOM
  // para que possamos acessá-lo quando o formulário for enviado
  const uploadRef = useRef<HTMLDivElement>(null);
  
  // Expor o arquivo temporário no DOM para que o form possa acessá-lo
  useEffect(() => {
    if (uploadRef.current && temporaryImage) {
      (uploadRef.current as any).__temporaryImage = temporaryImage;
    }
  }, [temporaryImage]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Imagem da Propriedade</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {isUploading ? (
          <div className="flex h-[80px] w-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm">Processando imagem...</span>
          </div>
        ) : (
          <div ref={uploadRef} data-property-upload="true">
            <ImageUploadCropper
              onImageCropped={handleImageCropped}
              currentImageUrl={currentImageUrl || undefined}
              onRemoveImage={currentImageUrl ? handleRemoveImage : undefined}
              aspectRatio={16/9} // Proporção paisagem (16:9)
              maxWidth={800} // Limita o tamanho da imagem
              maxHeight={450}
              previewSize={{ width: 240, height: 135 }}
              dropzoneText="Arraste ou clique para adicionar uma imagem"
              disabled={isUploading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}