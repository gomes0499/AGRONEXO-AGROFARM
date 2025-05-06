"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";

interface InviteMemberButtonProps {
  organizationId: string;
}

export function InviteMemberButton({
  organizationId,
}: InviteMemberButtonProps) {
  return (
    <Link
      href={`/dashboard/organization/${organizationId}/invite`}
      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      Convidar
    </Link>
  );
}
