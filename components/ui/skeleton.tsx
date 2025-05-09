import { cn } from "@/lib/utils"
import * as React from "react"

interface SkeletonProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
}

const Skeleton = React.forwardRef<HTMLElement, SkeletonProps>(
  ({ className, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        data-slot="skeleton"
        className={cn("bg-accent animate-pulse rounded-md", className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
