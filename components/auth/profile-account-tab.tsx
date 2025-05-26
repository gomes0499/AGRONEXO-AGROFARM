"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { ChangeEmailForm } from "./change-email-form";
import { ChangePasswordForm } from "./change-password-form";
import { Mail, Lock } from "lucide-react";

interface ProfileAccountTabProps {
  user: any;
  userData: any;
}

export function ProfileAccountTab({ user, userData }: ProfileAccountTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<Mail className="h-4 w-4" />}
          title="Alterar Email"
          description="Atualize o endereço de email associado à sua conta"
        />
        <CardContent className="p-6">
          <ChangeEmailForm />
        </CardContent>
      </Card>

      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<Lock className="h-4 w-4" />}
          title="Alterar Senha"
          description="Atualize sua senha para manter sua conta segura"
        />
        <CardContent className="p-6">
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}