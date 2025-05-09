import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginLoading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="space-y-2 text-center">
        <Skeleton className="h-9 w-32 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>

        <Skeleton className="h-10 w-full" />
      </div>

      <div className="text-center">
        <Skeleton className="h-5 w-48 mx-auto" />
      </div>
    </div>
  );
}