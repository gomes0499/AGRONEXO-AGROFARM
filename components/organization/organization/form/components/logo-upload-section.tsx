import { OrganizationLogoUpload } from "../../logo-upload";

interface LogoUploadSectionProps {
  logoUrl: string | null;
  onSuccess: (url: string) => void;
  onRemove: () => void;
}

export function LogoUploadSection({
  logoUrl,
  onSuccess,
  onRemove,
}: LogoUploadSectionProps) {
  return (
    <div className="flex justify-start mb-4">
      <OrganizationLogoUpload
        currentLogoUrl={logoUrl}
        onSuccess={onSuccess}
        onRemove={onRemove}
        isTemporary={true}
        variant="avatar"
        size="sm"
      />
    </div>
  );
}