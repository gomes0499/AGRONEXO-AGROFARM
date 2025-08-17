import { OrganizationLogoUpload } from "../../logo-upload";

interface LogoUploadSectionProps {
  logoUrl: string | null;
  onSuccess: (url: string) => void;
  onRemove: () => void;
  organizationId?: string;
  isEditMode?: boolean;
}

export function LogoUploadSection({
  logoUrl,
  onSuccess,
  onRemove,
  organizationId,
  isEditMode = false,
}: LogoUploadSectionProps) {
  return (
    <div className="flex justify-start mb-4">
      <OrganizationLogoUpload
        organizationId={organizationId}
        currentLogoUrl={logoUrl}
        onSuccess={onSuccess}
        onRemove={onRemove}
        isTemporary={!isEditMode || !organizationId} // Só é temporário se NÃO for edição
        variant="avatar"
        size="sm"
      />
    </div>
  );
}