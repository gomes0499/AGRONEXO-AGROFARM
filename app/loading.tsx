import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center space-y-6 text-center">
        <Skeleton className="h-24 w-80" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />

        <div className="flex gap-4 mt-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
