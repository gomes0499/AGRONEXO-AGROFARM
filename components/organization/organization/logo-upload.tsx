"use client";

import { useState, useRef, useEffect } from "react";
import { ImageUploadCropper } from "@/components/shared/image-upload-cropper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  uploadOrganizationLogo,
  removeOrganizationLogo,
} from "@/lib/actions/upload-actions";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const logoUploadVariants = cva("flex flex-col", {
  variants: {
    variant: {
      default: "items-start",
      compact: "items-center",
      avatar: "items-center",
    },
    size: {
      default: "",
      sm: "",
      xs: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

interface OrganizationLogoUploadProps
  extends VariantProps<typeof logoUploadVariants> {
  organizationId?: string;
  currentLogoUrl?: string | null;
  onSuccess?: (logoUrl: string) => void;
  onRemove?: () => void;
  // Modo temporário para quando estamos criando uma nova organização
  isTemporary?: boolean;
  className?: string;
}

export function OrganizationLogoUpload({
  organizationId,
  currentLogoUrl,
  onSuccess,
  onRemove,
  isTemporary = false,
  variant = "default",
  size = "default",
  className,
}: OrganizationLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [temporaryImage, setTemporaryImage] = useState<File | null>(null);
  const [temporaryBlobUrl, setTemporaryBlobUrl] = useState<string | null>(null);

  const handleImageCropped = async (file: File) => {
    setIsUploading(true);

    try {
      // Se estamos no modo temporário (criação de organização),
      // apenas armazenamos o arquivo na memória e enviamos a URL temporária
      if (isTemporary) {
        setTemporaryImage(file);

        // Limpa a URL blob anterior se houver
        if (temporaryBlobUrl) {
          URL.revokeObjectURL(temporaryBlobUrl);
        }

        // Convertemos o arquivo para uma URL temporária
        const tempUrl = URL.createObjectURL(file);
        setTemporaryBlobUrl(tempUrl);

        if (onSuccess) {
          onSuccess(tempUrl);
        }

        toast.success(
          "Logo selecionada com sucesso. Será salva ao criar a organização."
        );
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
          setFilePath(result.data?.path || null);
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
      
      // Limpa a URL blob se houver
      if (temporaryBlobUrl) {
        URL.revokeObjectURL(temporaryBlobUrl);
        setTemporaryBlobUrl(null);
      }

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

  // Limpar URLs blob ao desmontar o componente
  useEffect(() => {
    return () => {
      if (temporaryBlobUrl) {
        URL.revokeObjectURL(temporaryBlobUrl);
      }
    };
  }, [temporaryBlobUrl]);

  // Configurações baseadas nas variantes
  const getPreviewSize = () => {
    if (variant === "avatar" || variant === "compact") {
      switch (size) {
        case "xs":
          return { width: 48, height: 48 };
        case "sm":
          return { width: 64, height: 64 };
        default:
          return { width: 80, height: 80 };
      }
    }
    return { width: 120, height: 120 };
  };

  const getMaxDimensions = () => {
    if (variant === "avatar" || variant === "compact") {
      switch (size) {
        case "xs":
          return { maxWidth: 96, maxHeight: 96 };
        case "sm":
          return { maxWidth: 128, maxHeight: 128 };
        default:
          return { maxWidth: 160, maxHeight: 160 };
      }
    }
    return { maxWidth: 240, maxHeight: 240 };
  };

  const getDropzoneText = () => {
    if (variant === "avatar" || variant === "compact") {
      if (size === "xs") return "+";
      if (size === "sm") return "Logo";
      return "Adicionar";
    }
    return "Adicionar logo";
  };

  const showLabel = variant === "default";
  const previewSize = getPreviewSize();
  const { maxWidth, maxHeight } = getMaxDimensions();
  const dropzoneText = getDropzoneText();

  return (
    <div className={cn(logoUploadVariants({ variant, size }), className)}>
      {showLabel && (
        <div className="mb-2 text-sm font-medium">Logo da Organização</div>
      )}
      <div className={variant === "default" ? "w-full" : ""}>
        {isUploading ? (
          <div
            className="flex items-center justify-center rounded-full border border-dashed border-gray-300"
            style={{
              width: previewSize.width,
              height: previewSize.height,
            }}
          >
            <Loader2
              className={cn(
                "animate-spin text-primary",
                size === "xs" ? "h-4 w-4" : "h-5 w-5"
              )}
            />
          </div>
        ) : (
          <div ref={uploadRef} data-organization-upload="true">
            <ImageUploadCropper
              onImageCropped={handleImageCropped}
              currentImageUrl={currentLogoUrl || undefined}
              onRemoveImage={currentLogoUrl ? handleRemoveImage : undefined}
              aspectRatio={1} // Quadrado (1:1) para avatar
              maxWidth={maxWidth}
              maxHeight={maxHeight}
              previewSize={previewSize}
              dropzoneText={dropzoneText}
              disabled={isUploading}
              className={
                variant === "avatar" || variant === "compact" ? "max-w-fit" : ""
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
