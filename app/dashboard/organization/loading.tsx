import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrganizationLoading() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        {/* Header com bg-primary */}
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Skeleton className="h-4 w-4" />
            </div>
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>

        <CardContent className="mt-4">
          <div className="space-y-6">
            {/* Tabela com header bg-primary */}
            <div className="rounded-md border">
              {/* Table header */}
              <div className="bg-primary rounded-t-md p-3">
                <div className="grid grid-cols-5 gap-4">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
              </div>
              
              {/* Table rows */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 border-b last:border-b-0">
                  <div className="grid grid-cols-5 gap-4 items-center">
                    {/* Coluna Nome */}
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-5 w-[30px] rounded-md" />
                      </div>
                    </div>
                    {/* Coluna Telefone */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                        <Skeleton className="h-4 w-[120px]" />
                      </div>
                      <Skeleton className="h-7 w-7 rounded-md" />
                    </div>
                    {/* Coluna Email */}
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                      <Skeleton className="h-4 w-[160px]" />
                    </div>
                    {/* Coluna Localização */}
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                    {/* Coluna Ações */}
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="h-7 w-7 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}