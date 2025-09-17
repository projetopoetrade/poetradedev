import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
    />
  )
}

export function ProductSkeleton() {
  return (
    <div className="rounded-lg p-4 border border-border/50 space-y-3">
      <Skeleton className="h-[200px] w-full rounded-md" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
    </div>
  )
}

export function LeagueSkeleton() {
  return (
    <div className="w-[380px] h-[360px] rounded-xl overflow-hidden">
      <div className="p-0 shadow-xl rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 space-y-3">
        <div className="p-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  )
} 