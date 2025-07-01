"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  src?: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ 
  name = "Usuário", 
  src, 
  alt,
  className,
  fallbackClassName 
}: UserAvatarProps) {
  // Memoizar o cálculo das iniciais para evitar recálculos desnecessários
  const initials = React.useMemo(() => {
    if (!name || typeof name !== "string" || name.trim() === "") {
      return "U";
    }

    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    // Pegar primeira letra do primeiro e último nome
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt={alt || name} />}
      <AvatarFallback className={fallbackClassName}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}