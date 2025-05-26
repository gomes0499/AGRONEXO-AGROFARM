"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FullProfileForm } from "./full-profile-form";
import { Settings } from "lucide-react";

interface ProfileDetailsTabProps {
  user: any;
  userData: any;
}

export function ProfileDetailsTab({ user, userData }: ProfileDetailsTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<Settings className="h-4 w-4" />}
          title="Dados Completos"
          description="Informações detalhadas do perfil e documentos pessoais"
        />
        <CardContent className="p-6">
          <FullProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}