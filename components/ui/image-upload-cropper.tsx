"use client";

import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X, CropIcon, Check, Image as ImageIcon, Trash } from "lucide-react";
import Image from "next/image";

// Importa os estilos do react-image-crop
import "react-image-crop/dist/ReactCrop.css";

// Função auxiliar para centralizar o crop com proporção de aspecto específica
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

interface ImageUploadCropperProps {
  /**
   * Função chamada quando uma imagem é selecionada e recortada
   * Retorna o arquivo recortado como um Blob/File
   */
  onImageCropped: (file: File) => void;
  
  /**
   * URL da imagem existente (se houver)
   */
  currentImageUrl?: string;
  
  /**
   * Função para remover a imagem atual
   */
  onRemoveImage?: () => void;
  
  /**
   * Proporção de aspecto para o corte (width/height)
   * Ex: 1 para quadrado, 16/9 para widescreen, etc.
   * Se não for definido, o crop será livre
   */
  aspectRatio?: number;
  
  /**
   * Tamanho máximo do arquivo em bytes
   * Padrão: 5MB
   */
  maxSize?: number;
  
  /**
   * Largura máxima da imagem resultante em pixels
   * Por padrão, mantém a resolução original
   */
  maxWidth?: number;

  /**
   * Altura máxima da imagem resultante em pixels
   * Por padrão, mantém a resolução original
   */
  maxHeight?: number;
  
  /**
   * Formatos de arquivo permitidos
   * Por padrão, aceita jpg, jpeg, png e webp
   */
  acceptedFileTypes?: string[];
  
  /**
   * Classe CSS personalizada para o contêiner
   */
  className?: string;
  
  /**
   * Texto da área de upload
   */
  dropzoneText?: string;
  
  /**
   * Se true, desabilita o componente
   */
  disabled?: boolean;
  
  /**
   * Dimensões do componente de preview
   */
  previewSize?: {
    width: number;
    height: number;
  };
}

export function ImageUploadCropper({
  onImageCropped,
  currentImageUrl,
  onRemoveImage,
  aspectRatio = 1,
  maxSize = 5 * 1024 * 1024, // 5MB por padrão
  maxWidth,
  maxHeight,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"],
  className,
  dropzoneText = "Arraste uma imagem ou clique para selecionar",
  disabled = false,
  previewSize = { width: 200, height: 200 },
}: ImageUploadCropperProps) {
  // Refs e estados
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [imgSrc, setImgSrc] = useState<string>("");
  const [isCropping, setIsCropping] = useState(false);
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [imageType, setImageType] = useState<string>("image/jpeg");
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Handler para quando uma imagem é solta/selecionada
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      setOriginalFile(file);
      setImageType(file.type);
      
      // Cria URL para a imagem
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const imageUrl = reader.result?.toString() || "";
        setImgSrc(imageUrl);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  // Configuração do dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    disabled,
    multiple: false,
  });

  // Quando a imagem é carregada, inicializa o crop
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      if (aspectRatio) {
        setCrop(centerAspectCrop(width, height, aspectRatio));
      }
    },
    [aspectRatio]
  );

  // Função para aplicar o corte e obter a imagem final
  const cropImage = useCallback(async () => {
    if (!imgRef.current || !completedCrop || !originalFile) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calcula as dimensões do crop
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    };

    // Define as dimensões finais da imagem (com redimensionamento, se especificado)
    let finalWidth = pixelCrop.width;
    let finalHeight = pixelCrop.height;
    
    if (maxWidth && finalWidth > maxWidth) {
      const ratio = maxWidth / finalWidth;
      finalWidth = maxWidth;
      finalHeight = finalHeight * ratio;
    }
    
    if (maxHeight && finalHeight > maxHeight) {
      const ratio = maxHeight / finalHeight;
      finalHeight = maxHeight;
      finalWidth = finalWidth * ratio;
    }
    
    // Configura o canvas com as dimensões finais
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    
    // Desenha a imagem recortada no canvas
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      finalWidth,
      finalHeight
    );

    // Converte o canvas para um Blob
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        // Cria um novo arquivo com o mesmo nome mas com um timestamp
        const fileName = originalFile.name.replace(
          /(\.[^.]+)$/,
          `_cropped${RegExp.$1}`
        );
        
        const croppedFile = new File([blob], fileName, {
          type: imageType,
          lastModified: Date.now(),
        });
        
        resolve(croppedFile);
      }, imageType);
    });
  }, [completedCrop, imgRef, originalFile, imageType, maxWidth, maxHeight]);

  // Handler para confirmar o crop
  const handleCropConfirm = async () => {
    try {
      const croppedFile = await cropImage();
      if (croppedFile) {
        onImageCropped(croppedFile);
        setIsCropping(false);
        setImgSrc("");
      }
    } catch (error) {
      console.error("Erro ao recortar imagem:", error);
    }
  };

  // Handler para cancelar o crop
  const handleCropCancel = () => {
    setIsCropping(false);
    setImgSrc("");
    setOriginalFile(null);
  };

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border border-dashed p-4",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20",
          className
        )}
      >
        {currentImageUrl ? (
          <div className="relative flex flex-col items-center">
            <div className="relative overflow-hidden rounded-md">
              <Image
                src={currentImageUrl}
                alt="Imagem carregada"
                width={previewSize.width}
                height={previewSize.height}
                className="h-auto w-auto max-w-full object-cover"
                style={{
                  aspectRatio: aspectRatio ? aspectRatio : "auto",
                }}
              />
              {onRemoveImage && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-2 top-2 h-7 w-7 rounded-full"
                  onClick={onRemoveImage}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Botão para trocar a imagem */}
            <div className="mt-2">
              <div 
                {...getRootProps()} 
                className="cursor-pointer"
              >
                <input {...getInputProps()} />
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={disabled}
                  className="gap-2"
                >
                  <CropIcon className="h-4 w-4" />
                  Alterar imagem
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={cn(
              "flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <input {...getInputProps()} />
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{dropzoneText}</p>
              <p className="text-xs text-muted-foreground">
                Formatos suportados: JPG, PNG, WebP • Máximo: {(maxSize / (1024 * 1024)).toFixed(0)}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de crop */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Recortar imagem</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 overflow-auto">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                minWidth={50}
                circularCrop={false}
              >
                <img
                  ref={imgRef}
                  alt="Imagem para recorte"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-[60vh] max-w-full object-contain"
                />
              </ReactCrop>
            )}
          </div>
          
          <DialogFooter className="mt-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleCropCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button 
              onClick={handleCropConfirm}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}