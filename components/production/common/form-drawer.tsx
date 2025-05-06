"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  showCancelButton?: boolean;
  direction?: "right" | "bottom" | "left" | "top";
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  showCancelButton = true,
  direction = "right",
}: FormDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={direction}
    >
      <DrawerContent
        className={
          direction === "right" || direction === "left"
            ? "h-full max-h-none"
            : undefined
        }
      >
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && (
            <DrawerDescription>{description}</DrawerDescription>
          )}
        </DrawerHeader>
        <div className="px-4 overflow-y-auto flex-1">{children}</div>
        {showCancelButton && (
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}