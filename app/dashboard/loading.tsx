import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center gap-4 px-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
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

      <main className="flex-1 p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="production">Produção</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="assets">Patrimonial</TabsTrigger>
            <TabsTrigger value="projections">Projeções</TabsTrigger>
            <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            <TabsTrigger value="commercial">Comercial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Stat Cards Skeletons */}
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <Skeleton className="h-4 w-24" />
                    </CardTitle>
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <Skeleton className="h-8 w-20" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <Skeleton as="span" className="h-3 w-32 mt-1" />
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart Cards Skeletons */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-5 w-48" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-72" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-5 w-48" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-72" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-6" />

                <Skeleton className="h-5 w-32 mb-4" />
                <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-6" />

                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-md border p-3">
                      <Skeleton className="h-3 w-24 mb-2" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
