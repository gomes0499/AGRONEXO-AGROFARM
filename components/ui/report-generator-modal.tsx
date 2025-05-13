"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileBarChart, FileText, AlertCircle } from "lucide-react";

interface ReportGeneratorProps {
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonIcon?: boolean;
  className?: string;
}

export function ReportGeneratorModal({
  buttonText = "Gerar Relatório",
  buttonVariant = "default",
  buttonSize = "default",
  buttonIcon = true,
  className,
}: ReportGeneratorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize} className={className}>
          {buttonIcon && <FileBarChart className="mr-2 h-4 w-4" />}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-muted/40 p-3 rounded-full w-14 h-14 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-amber-500" />
          </div>
          <DialogTitle className="pt-4 text-center">Geração de Relatórios</DialogTitle>
          <DialogDescription className="text-center">
            Esta funcionalidade ainda não está disponível.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/30 p-4 rounded-md border border-border">
          <h4 className="font-medium text-sm mb-2 flex items-center">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            Relatórios em Desenvolvimento
          </h4>
          <p className="text-sm text-muted-foreground">
            A funcionalidade de geração de relatórios permitirá exportar dados e análises em vários formatos como PDF, Excel e CSV, facilitando a apresentação e análise de informações fora do sistema.
          </p>
          <ul className="list-disc text-sm mt-3 ml-5 space-y-1 text-muted-foreground">
            <li>Relatórios financeiros e gerenciais</li>
            <li>Resumos de produção por safra</li>
            <li>Análises de desempenho comercial</li>
            <li>Balanço patrimonial</li>
            <li>Projeções e cenários futuros</li>
          </ul>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}