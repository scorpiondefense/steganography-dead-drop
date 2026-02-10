"use client";

import { Painting } from "@/lib/types";
import PaintingCard from "./PaintingCard";

export default function PaintingGrid({
  paintings,
}: {
  paintings: Painting[];
}) {
  if (paintings.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        No paintings found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {paintings.map((p) => (
        <PaintingCard key={p.id} painting={p} />
      ))}
    </div>
  );
}
