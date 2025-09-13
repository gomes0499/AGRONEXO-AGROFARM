"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeAwareLogoProps {
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}

export function ThemeAwareLogo({
  width = 200,
  height = 100,
  priority = true,
  quality = 100,
}: ThemeAwareLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use light logo (black text) by default
  let logoSrc = "/logo.svg";

  // Only show different logo if mounted (to avoid hydration mismatch)
  if (mounted && resolvedTheme === "dark") {
    // Use white text logo for dark mode
    logoSrc = "/logo-white.svg";
  }

  return (
    <Image
      src={logoSrc}
      alt="AGROFARM Logo"
      width={width}
      height={height}
      priority={priority}
      quality={quality}
    />
  );
}
