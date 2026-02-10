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
      className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
    >
      <div className="aspect-square bg-gray-200 overflow-hidden">
        <img
          src={imgSrc}
          alt={painting.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">
          {painting.title}
        </h3>
        {painting.artist && (
          <p className="text-sm text-gray-500 mt-1">{painting.artist}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-gray-900">
            ${(painting.price_cents / 100).toFixed(2)}
          </span>
          {painting.medium && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {painting.medium}
            </span>
          )}
        </div>
        {painting.status === "sold" && (
          <span className="inline-block mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            Sold
          </span>
        )}
      </div>
    </Link>
  );
}
