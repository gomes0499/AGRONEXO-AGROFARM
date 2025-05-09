import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InviteLoading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="flex flex-col items-center justify-center py-4 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <Skeleton className="h-7 w-48 mx-auto" />
      </div>

      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}