import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function VerifyEmailLoading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6 flex flex-col items-center justify-center py-12">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Verificando seu email...</h1>
        <div className="space-y-2">
          <Skeleton className="h-5 w-64 mx-auto" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>
      </div>
    </div>
  );
}