import { SiteHeader } from "@/components/dashboard/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function NewMemberLoading() {
  return (
    <div className="flex flex-col">
      <SiteHeader 
        title="Adicionar Novo Membro"
        showBackButton={true}
        backUrl="/dashboard/organization"
        backLabel="Voltar"
      />
      <main className="flex-1 p-6">
        <div className="max-w-3xl">
          <Card className="border-muted/80 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-6">
                <Skeleton className="h-8 w-40" />
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}