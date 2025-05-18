"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

// Constante para SSR consistente
const DEFAULT_FALLBACK = "OR";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("relative flex size-8 shrink-0 overflow-hidden", className)}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  children = DEFAULT_FALLBACK,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  // Utilizamos useMemo para garantir que o mesmo conteúdo seja renderizado
  // tanto no servidor quanto no cliente para evitar erros de hidratação
  const content = React.useMemo(() => children, [
    // Convertemos para string para garantir estabilidade
    typeof children === 'string' ? children : DEFAULT_FALLBACK
  ]);
  
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("flex size-full items-center justify-center", className)}
      {...props}
    >
      {content}
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
