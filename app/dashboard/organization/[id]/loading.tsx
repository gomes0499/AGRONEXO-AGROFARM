import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrganizationDetailLoading() {
  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center gap-4 px-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Skeleton className="h-9 w-80 mb-6" />

        <Tabs defaultValue="info" className="">
          <div className="bg-card border-b">
            <div className="container mx-auto px-4">
              <div className="h-9 bg-transparent border-none rounded-none p-0 gap-0 flex">
                <Skeleton className="h-9 w-24 rounded-md mr-2" />
                <Skeleton className="h-9 w-32 rounded-md mr-2" />
                <Skeleton className="h-9 w-28 rounded-md mr-2" />
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
            </div>
          </div>

          <TabsContent value="info" className="mt-0 pt-2">
            <Card className="mt-4 shadow-sm border-muted/80">
              <CardHeader className="bg-primary text-white rounded-t-lg pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-6 w-48" />
                </div>
              </CardHeader>
              <CardContent className="mt-4">
                {/* Grid de cards moderno */}
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="bg-card border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Endereço - largura total */}
                  <div className="col-span-full bg-card border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-0 pt-2">
            <Card className="mt-4 shadow-sm border-muted/80">
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
                <Skeleton className="h-10 w-36" />
              </CardHeader>
              <CardContent className="mt-4">
                <div className="space-y-4">
                  {/* Search and filter bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-40" />
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    {/* Table header */}
                    <div className="bg-primary rounded-t-md p-3">
                      <div className="grid grid-cols-6 gap-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </div>
                    </div>

                    {/* Table rows */}
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-3 border-b last:border-b-0">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          {/* Nome */}
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          {/* Email */}
                          <Skeleton className="h-4 w-32" />
                          {/* Função */}
                          <Skeleton className="h-6 w-20 rounded-md" />
                          {/* Data entrada */}
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="h-3.5 w-3.5" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          {/* Último acesso */}
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="h-3.5 w-3.5" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          {/* Ações */}
                          <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="mt-0 pt-2">
            <Card className="mt-4 shadow-sm border-muted/80">
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
                <Skeleton className="h-10 w-36" />
              </CardHeader>
              <CardContent className="mt-4">
                <div className="space-y-4">
                  {/* Search and filter bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-40" />
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    {/* Table header */}
                    <div className="bg-primary rounded-t-md p-3">
                      <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </div>
                    </div>

                    {/* Table rows */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 border-b last:border-b-0">
                        <div className="grid grid-cols-4 gap-4 items-center">
                          {/* Email */}
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 rounded-full p-1.5">
                              <Skeleton className="h-3.5 w-3.5" />
                            </div>
                            <Skeleton className="h-4 w-32" />
                          </div>
                          {/* Função */}
                          <Skeleton className="h-6 w-20 rounded-md" />
                          {/* Data de envio */}
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="h-3.5 w-3.5" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          {/* Ações */}
                          <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 pt-2">
            <Card className="mt-4 shadow-sm border-muted/80">
              <CardHeader className="bg-primary text-white rounded-t-lg pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-6 w-48" />
                </div>
              </CardHeader>
              <CardContent className="mt-4 space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48 text-destructive" />

                  {/* Alert destructive skeleton */}
                  <div className="border border-destructive rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive">
                        <Skeleton className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>

                  {/* Form skeleton */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
