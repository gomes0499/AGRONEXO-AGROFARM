import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PropertyDetailLoading() {
  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center gap-4 px-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-48" />
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
      
      <div className="p-4 md:p-6">
        <div className="mb-3">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-40" />
        </div>

        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="leases">Arrendamentos</TabsTrigger>
            <TabsTrigger value="improvements">Benfeitorias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Skeleton className="h-6 w-48 mb-3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leases">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <div className="flex items-center justify-between p-4 border-b">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border-b last:border-b-0 flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="improvements">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <div className="flex items-center justify-between p-4 border-b">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 border-b last:border-b-0 flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-60" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}