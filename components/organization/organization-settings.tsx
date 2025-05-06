import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OrganizationSettings() {
  return (
    <Card>
      <CardHeader className="border-b pb-6">
        <CardTitle>Configurações da Organização</CardTitle>
        <CardDescription>
          Gerencie as configurações da sua organização
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center p-8 bg-muted/20">
          <p className="text-muted-foreground">
            Configurações avançadas serão implementadas em breve.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}