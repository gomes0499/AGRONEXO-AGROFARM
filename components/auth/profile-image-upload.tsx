"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "./user-provider";
import { ImageUploadCropper } from "@/components/ui/image-upload-cropper";
import { uploadUserAvatar, removeUserAvatar } from "@/lib/actions/upload-actions";
import { toast } from "sonner";

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  isTemporary?: boolean;
}

export function ProfileImageUpload({
  currentImageUrl,
  onImageChange,
  isTemporary = false,
}: ProfileImageUploadProps) {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [temporaryImage, setTemporaryImage] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(currentImageUrl || null);
  const uploadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Quando a URL de imagem atual mudar externamente, atualize o estado local
    setCurrentLogoUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  // Expose temporary image for later upload
  useEffect(() => {
    if (uploadRef.current && temporaryImage) {
      (uploadRef.current as any).__temporaryImage = temporaryImage;
    }
  }, [temporaryImage]);

  const handleImageCropped = async (file: File) => {
    if (isTemporary) {
      // Apenas guarda o arquivo para uso posterior e cria uma URL temporária
      setTemporaryImage(file);
      const tempUrl = URL.createObjectURL(file);
      setCurrentLogoUrl(tempUrl);
      onImageChange(tempUrl);
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não está autenticado");
      return;
    }

    setIsUploading(true);

    try {
      // Preparar FormData para upload
      const formData = new FormData();
      formData.append("file", file);

      // Enviar para o servidor
      const result = await uploadUserAvatar(user.id, formData);

      if (!result.success) {
        throw new Error(result.error || "Erro ao fazer upload da imagem");
      }

      setCurrentLogoUrl(result.data.publicUrl);
      onImageChange(result.data.publicUrl);
      toast.success("Foto de perfil atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto de perfil");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (isTemporary) {
      // Apenas limpa a URL temporária
      setTemporaryImage(null);
      setCurrentLogoUrl(null);
      onImageChange(null);
      return;
    }

    if (!user?.id || !currentLogoUrl) {
      return;
    }

    setIsUploading(true);

    try {
      // Extrair o caminho do arquivo da URL
      const urlObj = new URL(currentLogoUrl);
      const filePath = urlObj.pathname.replace(`/storage/v1/object/public/${BUCKET_NAME}/`, "");

      // Enviar para o servidor
      const result = await removeUserAvatar(user.id, filePath);

      if (!result.success) {
        throw new Error(result.error || "Erro ao remover a imagem");
      }

      setCurrentLogoUrl(null);
      onImageChange(null);
      toast.success("Foto de perfil removida com sucesso");
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      toast.error("Erro ao remover a foto de perfil");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div ref={uploadRef} data-profile-upload="true">
      <ImageUploadCropper
        onImageCropped={handleImageCropped}
        currentImageUrl={currentLogoUrl || undefined}
        onRemoveImage={currentLogoUrl ? handleRemoveImage : undefined}
        aspectRatio={1} // Quadrado (1:1) para avatar
        maxWidth={400} // Tamanho adequado para avatar de perfil
        maxHeight={400}
        previewSize={{ width: 120, height: 120 }}
        dropzoneText="Adicionar foto"
        disabled={isUploading}
        className="w-full max-w-[300px] mx-auto"
      />
    </div>
  );
}

// Constante para o bucket
const BUCKET_NAME = "sr-consultoria";