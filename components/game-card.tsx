import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import type { GameCardData } from "@/lib/game-types";

export function GameCard({ game }: { game: GameCardData }) {
  return (
    <Link href={`/game/${game.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-amber-400/80 hover:shadow-amber-500/10">
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
          <Image
            src={game.thumbnailSrc}
            alt={`${game.name} thumbnail`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <StatusBadge status={game.status} />
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-50">{game.name}</h2>
              <p className="text-sm text-slate-400">{game.genre}</p>
            </div>
            <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-amber-200">
              {game.generatedWith}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-slate-300">
            {game.description}
          </p>
        </div>
      </Card>
    </Link>
  );
}
