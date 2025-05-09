import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PricesLoading() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-60 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-5 w-80" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table header */}
            <div className="rounded-md border">
              <div className="flex items-center border-b px-4 py-3">
                <Skeleton className="h-5 w-32 mr-4" />
                <Skeleton className="h-5 w-32 mr-4" />
                <Skeleton className="h-5 w-32 mr-4" />
                <Skeleton className="h-5 w-32 mr-4" />
                <Skeleton className="h-5 w-20 ml-auto" />
              </div>
              
              {/* Table rows */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center border-b last:border-b-0 px-4 py-3">
                  <Skeleton className="h-5 w-32 mr-4" />
                  <Skeleton className="h-5 w-28 mr-4" />
                  <Skeleton className="h-5 w-24 mr-4" />
                  <Skeleton className="h-5 w-24 mr-4" />
                  <div className="flex space-x-2 ml-auto">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}