"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Painting, PaintingList } from "@/lib/types";
import PaintingGrid from "@/components/PaintingGrid";

export default function PaintingsPage() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Gallery</h1>

      <form
        onSubmit={handleFilter}
        className="flex flex-wrap gap-3 mb-8 bg-white p-4 rounded-lg shadow-sm"
      >
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1 min-w-[200px] outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={medium}
          onChange={(e) => setMedium(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All Mediums</option>
          <option value="oil">Oil</option>
          <option value="acrylic">Acrylic</option>
          <option value="watercolor">Watercolor</option>
          <option value="digital">Digital</option>
          <option value="mixed">Mixed Media</option>
        </select>
        <input
          type="number"
          placeholder="Min $"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-24 outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="number"
          placeholder="Max $"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-24 outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Filter
        </button>
      </form>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : (
        <PaintingGrid paintings={paintings} />
      )}
    </div>
  );
}
