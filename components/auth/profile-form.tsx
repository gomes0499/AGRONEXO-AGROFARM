"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/components/auth/user-provider";
import { updateProfile } from "@/lib/auth/actions/auth-actions";
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from "@/schemas/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProfileImageUpload } from "./profile-image-upload";

export function ProfileForm() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Form com validação Zod
  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
      email: user?.email || "",
      phone: user?.user_metadata?.telefone || "",
      image: user?.user_metadata?.avatar_url || "",
    },
  });

  // Função para submeter o formulário
  async function onSubmit(data: UpdateProfileFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateProfile(data);

      if (!result.success) {
        throw new Error(
          result.error || "Ocorreu um erro ao atualizar o perfil."
        );
      }

      // Mostrar mensagem de sucesso
      setSuccess(true);

      // Atualizar a página após alguns segundos
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Função para atualizar a URL da imagem no formulário
  function handleImageChange(imageUrl: string | null) {
    form.setValue("image", imageUrl || "");
  }

  // Obter as iniciais do nome para o fallback do avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert
          variant="default"
          className="bg-green-50 text-green-800 border-green-200"
        >
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Perfil atualizado com sucesso!</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Upload */}
          <div className="flex items-start space-x-4">
            <div className="space-y-3">
              <Label>Foto de Perfil</Label>
              <ProfileImageUpload 
                currentImageUrl={form.watch("image")} 
                onImageChange={handleImageChange}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Seu nome completo"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="seuemail@exemplo.com"
                    type="email"
                    disabled={true} // Email não pode ser alterado
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(00) 00000-0000"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
