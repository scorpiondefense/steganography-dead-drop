"use client";

import Link from "next/link";
import { Painting } from "@/lib/types";
import { imageUrl } from "@/lib/api";

export default function PaintingCard({ painting }: { painting: Painting }) {
  const imgSrc = painting.thumbnail_path
    ? imageUrl(painting.thumbnail_path)
    : imageUrl(painting.image_path);

  return (
    <Link
      href={`/paintings/${painting.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-[4/5] bg-surface-100 overflow-hidden relative">
        <img
          src={imgSrc}
          alt={painting.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
        {painting.status === "sold" && (
          <div className="absolute inset-0 bg-surface-950/40 flex items-center justify-center">
            <span className="bg-white/90 text-surface-900 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
              Sold
            </span>
          </div>
        )}
        {painting.medium && (
          <span className="absolute top-3 left-3 bg-white/85 backdrop-blur-sm text-surface-800 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
            {painting.medium}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-surface-900 truncate leading-tight">
          {painting.title}
        </h3>
        {painting.artist && (
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {painting.artist}
          </p>
        )}
        <p className="text-lg font-bold text-surface-900 mt-2 tabular-nums">
          ${(painting.price_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </Link>
  );
}
