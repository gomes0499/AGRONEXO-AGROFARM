import type { Metadata } from "next";
import Image from "next/image";
import { ReactNode } from "react";
import { ThemeAwareLogo } from "@/components/dashboard/theme-aware-logo";

export const metadata: Metadata = {
  title: "Autenticação | AGROFARM",
  description: "Sistema de autenticação da plataforma AGROFARM",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Theme provider is handled by the root layout, so we don't need to add it here
  return (
    <div className="flex min-h-screen w-full">
      {/* Lado esquerdo - Formulário */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-80 h-20 flex items-center justify-center">
              <ThemeAwareLogo
                width={240}
                height={80}
                priority={true}
                quality={100}
              />
            </div>
            {children}
          </div>
        </div>
      </div>

      {/* Lado direito - Imagem (visível apenas em telas médias para cima) */}
      <div className="hidden md:flex flex-1 relative border-l">
        <Image
          src="/cover.jpg"
          alt="Imagem de login"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="max-w-full px-8 py-12 bg-white/10 dark:bg-gray-900/80  backdrop-blur-sm">
            <h2 className="text-3xl text-white font-medium text-start mb-2">
              Bem-vindo à AGROFARM
            </h2>
            <p className="text-white text-start">
              Plataforma especializada em gestão e consultoria agrícola,
              oferecendo soluções completas para o produtor rural e empresas do
              agronegócio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
