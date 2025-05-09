import { Skeleton } from "@/components/ui/skeleton";

export default function ForgotPasswordLoading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <Skeleton className="h-9 w-48 mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>

      {/* Form field skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-12" />
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