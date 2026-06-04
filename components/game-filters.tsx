"use client";

import { useMemo, useState } from "react";
import { GameCard } from "@/components/game-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameCardData, GameGenre } from "@/lib/game-types";

const filters: Array<"All" | GameGenre> = [
  "All",
  "Action",
  "Racing",
  "Puzzle",
  "Sandbox",
  "Shooter",
];

export function GameFilters({ games }: { games: GameCardData[] }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<"All" | GameGenre>("All");

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return games.filter((game) => {
      const matchesGenre = genre === "All" || game.genre === genre;
      const haystack = [
        game.name,
        game.description,
        game.genre,
        game.generatedWith,
        game.status,
      ]
        .join(" ")
        .toLowerCase();

      return matchesGenre && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [games, genre, query]);

  return (
    <section className="space-y-6" aria-label="Game library">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search games, genres, models, or status"
          aria-label="Search games"
        />
        <div className="flex flex-wrap gap-2" aria-label="Filter games by genre">
          {filters.map((filter) => (
            <Button
              key={filter}
              active={genre === filter}
              onClick={() => setGenre(filter)}
              className="h-9 px-3"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {filteredGames.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredGames.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-600 bg-slate-800/70 px-6 py-12 text-center text-slate-300">
          No games match that search.
        </div>
      )}
    </section>
  );
}
