import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function CommercialLoading() {
  return (
    <div className="container max-w-full p-4">
      {/* Simple Title Loader */}
      <div className="mb-8">
        <div className="border-b pb-2 mb-4">
          <div className="h-8 w-48 rounded bg-gray-200 animate-pulse"></div>
        </div>
      </div>

      {/* Seeds Tab Content */}
      <div className="space-y-6">
        {/* Title and Action Button */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-64" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Controls */}
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
            
            {/* Loading Indicator */}
            <div className="flex items-center justify-center h-60">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin mb-3 text-blue-500" />
                <div className="text-muted-foreground text-center">
                  Carregando dados comerciais...
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Isso pode levar alguns segundos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
