"use client";

import { useState, useRef, useEffect } from "react";
import { ImageUploadCropper } from "@/components/ui/image-upload-cropper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { uploadOrganizationLogo, removeOrganizationLogo } from "@/lib/actions/upload-actions";
import { Loader2 } from "lucide-react";

interface OrganizationLogoUploadProps {
  organizationId?: string;
  currentLogoUrl?: string | null;
  onSuccess?: (logoUrl: string) => void;
  onRemove?: () => void;
  // Modo temporário para quando estamos criando uma nova organização
  isTemporary?: boolean;
}

export function OrganizationLogoUpload({
  organizationId,
  currentLogoUrl,
  onSuccess,
  onRemove,
  isTemporary = false,
}: OrganizationLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [temporaryImage, setTemporaryImage] = useState<File | null>(null);

  const handleImageCropped = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Se estamos no modo temporário (criação de organização),
      // apenas armazenamos o arquivo na memória e enviamos a URL temporária
      if (isTemporary) {
        setTemporaryImage(file);
        
        // Convertemos o arquivo para uma URL temporária
        const tempUrl = URL.createObjectURL(file);
        
        if (onSuccess) {
          onSuccess(tempUrl);
        }
        
        toast.success("Logo selecionada com sucesso. Será salva ao criar a organização.");
      } 
      // Para organizações existentes, fazemos o upload para o servidor
      else if (organizationId) {
        // Cria um FormData para upload
        const formData = new FormData();
        formData.append("file", file);
        
        // Chama a server action para upload
        const result = await uploadOrganizationLogo(organizationId, formData);
        
        if (result.success) {
          // Salva o caminho do arquivo para possível exclusão futura
          setFilePath(result.data?.path);
          toast.success("Logo atualizada com sucesso");
          
          // Callback opcional
          if (onSuccess && result.data?.publicUrl) {
            onSuccess(result.data.publicUrl);
          }
        } else {
          toast.error(result.error || "Erro ao fazer upload da logo");
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
    
    // Para organizações existentes, removemos do servidor
    if (!currentLogoUrl || !filePath || !organizationId) return;
    
    try {
      setIsUploading(true);
      
      // Chama a server action para remover a imagem
      const result = await removeOrganizationLogo(organizationId, filePath);
      
      if (result.success) {
        toast.success("Logo removida com sucesso");
        setFilePath(null);
        
        // Callback opcional
        if (onRemove) {
          onRemove();
        }
      } else {
        toast.error(result.error || "Erro ao remover a logo");
      }
    } catch (error) {
      console.error("Erro ao remover logo:", error);
      toast.error("Ocorreu um erro ao remover a logo");
    } finally {
      setIsUploading(false);
    }
  };

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
    <div className="flex flex-col items-start">
      <div className="mb-2 text-sm font-medium">Logo da Organização</div>
      <div className="w-full">
        {isUploading ? (
          <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full border border-dashed border-gray-300">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div ref={uploadRef} data-organization-upload="true">
            <ImageUploadCropper
              onImageCropped={handleImageCropped}
              currentImageUrl={currentLogoUrl || undefined}
              onRemoveImage={currentLogoUrl ? handleRemoveImage : undefined}
              aspectRatio={1} // Quadrado (1:1) para avatar
              maxWidth={160} // Tamanho reduzido para avatar
              maxHeight={160}
              previewSize={{ width: 80, height: 80 }}
              dropzoneText="Adicionar"
              disabled={isUploading}
              className="flex-grow-0" // Previne expansão
            />
          </div>
        )}
      </div>
    </div>
  );
}