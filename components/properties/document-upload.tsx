"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  organizationId: string;
  propertyId?: string;
}

export function DocumentUpload({
  value,
  onChange,
  disabled,
  placeholder = "Nenhum documento anexado",
  organizationId,
  propertyId,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho do arquivo (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. O tamanho máximo é 50MB.");
      return;
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Tipo de arquivo não permitido. Use PDF, JPG, PNG ou documentos Word."
      );
      return;
    }

    try {
      setIsUploading(true);
      const supabase = createClient();

      // Criar um nome único para o arquivo
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split(".").pop();
      const fileName = `${organizationId}/${propertyId || `temp-${randomId}`}/${timestamp}.${fileExt}`;

      // Fazer upload do arquivo
      const { data, error } = await supabase.storage
        .from("property-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Erro no upload:", error);
        toast.error("Erro ao fazer upload do arquivo");
        return;
      }

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from("property-documents")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        onChange(urlData.publicUrl);
        setFileName(file.name);
        toast.success("Documento anexado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload do arquivo");
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir upload do mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      setIsUploading(true);
      const supabase = createClient();

      // Extrair o caminho do arquivo da URL
      const urlParts = value.split("/");
      const bucketIndex = urlParts.indexOf("property-documents");
      if (bucketIndex === -1) return;

      const filePath = urlParts.slice(bucketIndex + 1).join("/");

      // Remover o arquivo do storage
      const { error } = await supabase.storage
        .from("property-documents")
        .remove([filePath]);

      if (error) {
        console.error("Erro ao remover arquivo:", error);
        toast.error("Erro ao remover o documento");
        return;
      }

      onChange("");
      setFileName("");
      toast.success("Documento removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover arquivo:", error);
      toast.error("Erro ao remover o documento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          {value ? (
            <div className="flex items-center gap-2 p-2 border rounded-md bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300 truncate flex-1">
                {fileName || "Documento anexado"}
              </span>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 dark:text-green-400 hover:underline"
              >
                Visualizar
              </a>
            </div>
          ) : (
            <Input
              value=""
              disabled
              placeholder={placeholder}
              className="flex-1"
            />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
        {value ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="text-destructive hover:text-destructive"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload
          </Button>
        )}
      </div>
      {isUploading && (
        <div className="text-xs text-muted-foreground">
          Fazendo upload do arquivo...
        </div>
      )}
    </div>
  );
}