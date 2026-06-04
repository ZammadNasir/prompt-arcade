import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Button({ active, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition",
        active
          ? "border-amber-400 bg-amber-500 text-slate-950 shadow-[0_0_0_2px_rgba(245,158,11,0.18)]"
          : "border-slate-600 bg-slate-800 text-slate-100 hover:border-amber-400 hover:text-amber-200",
        className,
      )}
      {...props}
    />
  );
}
