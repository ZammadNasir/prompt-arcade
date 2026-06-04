import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-700 bg-slate-800 shadow-lg shadow-slate-950/20",
        className,
      )}
      {...props}
    />
  );
}
