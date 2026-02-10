"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Painting, PaintingList } from "@/lib/types";
import PaintingGrid from "@/components/PaintingGrid";

export default function Home() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PaintingList>("/api/paintings")
      .then((data) => setPaintings(data.paintings.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Discover Original Paintings
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Browse and collect unique artworks from talented artists around the
            world. Every painting tells a story.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/paintings"
              className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Gallery
            </Link>
            <Link
              href="/sell"
              className="border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Sell Your Art
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Recent Paintings</h2>
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading...</div>
        ) : (
          <PaintingGrid paintings={paintings} />
        )}
        {!loading && paintings.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href="/paintings"
              className="text-gray-900 font-semibold hover:underline"
            >
              View all paintings &rarr;
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
