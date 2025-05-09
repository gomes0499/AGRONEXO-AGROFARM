import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterLoading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="space-y-2 text-center">
        <Skeleton className="h-9 w-40 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-4">
        {/* Name field */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Email field */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Password field */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Terms checkbox */}
        <div className="flex items-start space-x-2">
          <Skeleton className="h-4 w-4 mt-1 rounded" />
          <Skeleton className="h-10 w-full" />
        </div>

        <Skeleton className="h-10 w-full" />
      </div>

      <div className="text-center">
        <Skeleton className="h-5 w-48 mx-auto" />
      </div>
    </div>
  );
}