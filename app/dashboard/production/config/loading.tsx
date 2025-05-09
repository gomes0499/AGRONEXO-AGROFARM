import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <Skeleton className="h-9 w-64" />
          </h1>
          <Skeleton className="h-5 w-96 mt-1" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="border-b space-x-4 flex">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="pb-4 pt-2 px-1">
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>

      {/* Tab content skeleton */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                <Skeleton className="h-6 w-36" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-64 mt-1" />
              </CardDescription>
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-md border">
              <div className="h-10 px-4 border-b flex items-center">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32 hidden md:block" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 px-4 flex items-center">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-40 hidden md:block" />
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form skeleton */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-52" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}