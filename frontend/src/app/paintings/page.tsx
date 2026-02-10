"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Painting, PaintingList } from "@/lib/types";
import PaintingGrid from "@/components/PaintingGrid";

export default function PaintingsPage() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [medium, setMedium] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchPaintings = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (medium) params.set("medium", medium);
    if (minPrice) params.set("min_price", String(Number(minPrice) * 100));
    if (maxPrice) params.set("max_price", String(Number(maxPrice) * 100));

    try {
      const data = await api.get<PaintingList>(
        `/api/paintings?${params.toString()}`
      );
      setPaintings(data.paintings);
      setTotal(data.total);
    } catch {
      setPaintings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaintings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPaintings();
  };

  const clearFilters = () => {
    setSearch("");
    setMedium("");
    setMinPrice("");
    setMaxPrice("");
    setTimeout(fetchPaintings, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-surface-900">
          Gallery
        </h1>
        <p className="text-gray-500 mt-1">
          {total} {total === 1 ? "painting" : "paintings"} available
        </p>
      </div>

      <form
        onSubmit={handleFilter}
        className="flex flex-wrap items-center gap-3 mb-10 p-4 bg-white rounded-xl shadow-sm border border-surface-200"
      >
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by title, artist, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-50 border-0 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-gray-400"
          />
        </div>
        <select
          value={medium}
          onChange={(e) => setMedium(e.target.value)}
          className="bg-surface-50 border-0 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 text-surface-700"
        >
          <option value="">All Mediums</option>
          <option value="oil">Oil</option>
          <option value="acrylic">Acrylic</option>
          <option value="watercolor">Watercolor</option>
          <option value="digital">Digital</option>
          <option value="mixed">Mixed Media</option>
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="Min $"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="bg-surface-50 border-0 rounded-lg px-3 py-2.5 text-sm w-24 outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-gray-400"
          />
          <span className="text-gray-300">&ndash;</span>
          <input
            type="number"
            placeholder="Max $"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-surface-50 border-0 rounded-lg px-3 py-2.5 text-sm w-24 outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-gray-400"
          />
        </div>
        <button
          type="submit"
          className="bg-surface-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-surface-800 transition-colors"
        >
          Search
        </button>
        {(search || medium || minPrice || maxPrice) && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
    </div>
  );
}
