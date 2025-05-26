"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationFormDrawer } from "@/components/organization/organization/form-drawer";

interface NewOrganizationButtonProps {
  userId: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function NewOrganizationButton({ 
  userId, 
  variant = "default",
  size = "default",
  className 
}: NewOrganizationButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setDrawerOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <Plus className="mr-2 h-4 w-4" />
        Nova Organização
      </Button>

      <OrganizationFormDrawer
        userId={userId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}