import { Card, CardContent } from "@/components/ui/card";
import { OrganizationForm } from "./organization-form";

type OrganizationDetailEditProps = {
  userId: string;
  organization: any;
};

export function OrganizationDetailEdit({
  userId,
  organization,
}: OrganizationDetailEditProps) {
  return <OrganizationForm userId={userId} organization={organization} />;
}
