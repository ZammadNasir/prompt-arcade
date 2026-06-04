import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GameStatus } from "@/lib/game-types";

const statusStyles: Record<GameStatus, string> = {
  Playable: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
  Broken: "border-red-400/40 bg-red-500/15 text-red-300",
  Experimental: "border-sky-400/40 bg-sky-500/15 text-sky-300",
  "Chaos Mode": "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-300",
  "Actually Good": "border-amber-400/50 bg-amber-500/20 text-amber-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: GameStatus;
  className?: string;
}) {
  return <Badge className={cn(statusStyles[status], className)}>{status}</Badge>;
}
