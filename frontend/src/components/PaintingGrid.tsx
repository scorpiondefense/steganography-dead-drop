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
      <div className="text-center py-24">
        <p className="text-gray-400 text-lg">No paintings found.</p>
        <p className="text-gray-300 text-sm mt-1">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {paintings.map((p) => (
        <PaintingCard key={p.id} painting={p} />
      ))}
    </div>
  );
}
