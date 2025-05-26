"use client";

import type React from "react";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InviteForm } from "./form";

interface InviteDialogProps {
  organizationId: string;
  organizationName?: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function InviteDialog({
  organizationId,
  organizationName = "organização",
  trigger,
  className,
}: InviteDialogProps) {
  const [open, setOpen] = useState(false);

  // Função para fechar o diálogo após envio bem-sucedido
  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className={className}>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Convidar Novo Membro</DialogTitle>
          <DialogDescription>
            Envie convites para que outras pessoas possam participar da{" "}
            {organizationName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <InviteForm
            organizationId={organizationId}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
