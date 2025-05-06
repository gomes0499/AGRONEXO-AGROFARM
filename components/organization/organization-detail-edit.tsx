import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { OrganizationForm } from "./organization-form";

type OrganizationDetailEditProps = {
  userId: string;
  organization: any;
};

export function OrganizationDetailEdit({ 
  userId, 
  organization 
}: OrganizationDetailEditProps) {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <OrganizationForm
          userId={userId}
          organization={organization}
        />
      </CardContent>
    </Card>
  );
}