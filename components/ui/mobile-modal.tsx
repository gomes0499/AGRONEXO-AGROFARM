"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
  size?: "default" | "lg" | "xl";
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  hideCloseButton = false,
  size = "default",
}: MobileModalProps) {
  const isMobile = useIsMobile();

  const sizeClasses = {
    default: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          // Desktop styles
          !isMobile && sizeClasses[size],
          // Mobile styles - fullscreen
          isMobile && [
            "h-full max-h-full w-full max-w-full m-0 p-0",
            "flex flex-col",
            "rounded-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          ],
          className
        )}
      >
        {/* Mobile Header */}
        {isMobile ? (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            {!hideCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}

        {/* Content */}
        <div
          className={cn(
            "flex-1 overflow-y-auto",
            isMobile ? "p-4" : "py-4"
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              "border-t",
              isMobile ? [
                "p-4 bg-background",
                "sticky bottom-0",
                "safe-area-inset-bottom", // For iOS safe area
              ] : "pt-4"
            )}
          >
            {isMobile ? (
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                {footer}
              </div>
            ) : (
              <DialogFooter>{footer}</DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper component for common action buttons
export function MobileModalActions({
  onCancel,
  onConfirm,
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  isLoading = false,
  confirmVariant = "default",
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  isLoading?: boolean;
  confirmVariant?: "default" | "destructive";
}) {
  const isMobile = useIsMobile();

  return (
    <>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
        className={cn(isMobile && "flex-1")}
      >
        {cancelText}
      </Button>
      <Button
        variant={confirmVariant}
        onClick={onConfirm}
        disabled={isLoading}
        className={cn(isMobile && "flex-1")}
      >
        {confirmText}
      </Button>
    </>
  );
}