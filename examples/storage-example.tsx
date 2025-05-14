"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadFile, getPublicUrl, removeFile } from "@/lib/supabase/storage";
import { Loader2, Upload, X, Image } from "lucide-react";

export default function StorageExample() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload para o storage do Supabase
      const path = `examples/${Date.now()}_${file.name}`;
      const { publicUrl } = await uploadFile(file, path, { upsert: true });

      setUploadedImage(publicUrl);
      setFileName(path);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async () => {
    if (!fileName) return;

    try {
      await removeFile(fileName);
      setUploadedImage(null);
      setFileName(null);

      // Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erro ao remover arquivo:", error);
      alert("Erro ao remover o arquivo");
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Upload de Arquivos - Storage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            accept="image/*"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>

        {uploadedImage && (
          <div className="mt-4 relative">
            <div className="absolute -top-2 -right-2">
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleRemoveFile}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full rounded-md border border-border"
            />
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {fileName}
            </p>
          </div>
        )}

        {!uploadedImage && (
          <div className="flex items-center justify-center h-40 border border-dashed rounded-md">
            <div className="text-center text-muted-foreground">
              <Image className="h-10 w-10 mx-auto mb-2" />
              <p>Nenhuma imagem enviada</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
