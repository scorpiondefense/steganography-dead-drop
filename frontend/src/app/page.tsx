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
      {/* Hero */}
      <section className="relative bg-surface-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-brand-900)_0%,_transparent_50%)] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-accent)_0%,_transparent_50%)] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-6 py-28 md:py-36">
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-[0.2em] mb-4">
            Fine Art Marketplace
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] max-w-3xl text-balance">
            Discover Original
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500">
              Paintings
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-xl leading-relaxed">
            Browse and collect unique artworks from talented artists around the
            world. Every painting tells a story &mdash; some hide secrets in
            plain sight.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/paintings"
              className="inline-flex items-center px-8 py-3.5 bg-white text-surface-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
            >
              Browse Gallery
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              href="/sell"
              className="inline-flex items-center px-8 py-3.5 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition-colors"
            >
              Sell Your Art
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-surface-900">
              Recent Works
            </h2>
            <p className="text-gray-500 mt-1">
              The latest additions to our collection
            </p>
          </div>
          <Link
            href="/paintings"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors hidden sm:block"
          >
            View all &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-surface-200 rounded-xl" />
                <div className="mt-3 h-4 bg-surface-200 rounded w-2/3" />
                <div className="mt-2 h-3 bg-surface-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <PaintingGrid paintings={paintings} />
        )}

        <div className="text-center mt-10 sm:hidden">
          <Link
            href="/paintings"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View all paintings &rarr;
          </Link>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-t border-surface-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Original Works",
                desc: "Every painting is an authentic, one-of-a-kind original piece from a verified artist.",
              },
              {
                title: "Secure Transactions",
                desc: "Protected checkout with order tracking and guaranteed safe delivery of your artwork.",
              },
              {
                title: "Artist Direct",
                desc: "Buy directly from artists. No middlemen, fair prices, and support for creators.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-lg font-semibold text-surface-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
