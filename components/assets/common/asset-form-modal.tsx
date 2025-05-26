"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AssetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  isSubmitting?: boolean;
  onSubmit?: () => void;
  showFooter?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function AssetFormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  isSubmitting = false,
  onSubmit,
  showFooter = true,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
}: AssetFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`p-0 overflow-hidden ${className}`}>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="px-6 py-2 max-h-[65vh] overflow-y-auto">{children}</div>
        {showFooter && (
          <DialogFooter className="p-6 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            {onSubmit && (
              <Button type="submit" onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : submitLabel}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}