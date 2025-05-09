import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function OnboardingLoading() {
  return (
    <div className="mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <Skeleton className="h-20 w-80 mx-auto" />
        <Skeleton className="h-9 w-56 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-8 w-8 rounded-full mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-7 w-48 mb-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}