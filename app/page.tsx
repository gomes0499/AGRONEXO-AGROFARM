import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">SR-Consultoria</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Página de marketing não está pronta.
      </p>
      <Button asChild className="w-full max-w-xs">
        <Link href="/auth/login">Ir para o Login</Link>
      </Button>
    </div>
  );
}
