"use client";

import { useState } from "react";

const colors = ["bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-rose-400"];

export default function BlockBuilderGame() {
  const [selected, setSelected] = useState(0);
  const [blocks, setBlocks] = useState<Array<number | null>>(
    Array.from({ length: 64 }, () => null),
  );

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-900 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {colors.map((color, index) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelected(index)}
              className={`h-9 w-9 rounded-md ${color} ${
                selected === index ? "ring-2 ring-white" : ""
              }`}
              aria-label={`Select block color ${index + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setBlocks(Array.from({ length: 64 }, () => null))}
          className="rounded-md bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950"
        >
          Clear
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1 rounded-md bg-slate-950 p-2">
        {blocks.map((block, index) => (
          <button
            key={index}
            type="button"
            onClick={() =>
              setBlocks((current) =>
                current.map((value, blockIndex) =>
                  blockIndex === index ? selected : value,
                ),
              )
            }
            onContextMenu={(event) => {
              event.preventDefault();
              setBlocks((current) =>
                current.map((value, blockIndex) =>
                  blockIndex === index ? null : value,
                ),
              );
            }}
            className={`aspect-square rounded-sm border border-slate-800 ${
              block === null ? "bg-slate-800" : colors[block]
            }`}
            aria-label="Place block"
          />
        ))}
      </div>
    </div>
  );
}
