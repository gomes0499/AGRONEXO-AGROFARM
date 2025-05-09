"use client";

import { Wrench, FileCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface UnderConstructionProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

export function UnderConstruction({
  title = "Página em Construção",
  message = "Estamos trabalhando para implementar esta funcionalidade em breve.",
  showBackButton = true,
}: UnderConstructionProps) {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6">
      <Card className="max-w-md border-dashed">
        <CardContent className="pt-6">
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <FileCode className="h-24 w-24 text-muted-foreground opacity-20" />
              <Wrench className="absolute right-0 top-0 h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="mb-2 text-center text-2xl font-bold">{title}</h2>
          <p className="text-center text-muted-foreground">{message}</p>
        </CardContent>
        {showBackButton && (
          <CardFooter className="flex justify-center pb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}