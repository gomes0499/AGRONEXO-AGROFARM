"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { ProfileForm } from "./profile-form";
import { User } from "lucide-react";

interface ProfileBasicTabProps {
  user: any;
  userData: any;
}

export function ProfileBasicTab({ user, userData }: ProfileBasicTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<User className="h-4 w-4" />}
          title="Informações Básicas"
          description="Gerencie suas informações pessoais e de contato"
        />
        <CardContent className="p-6">
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}