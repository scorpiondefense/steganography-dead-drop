"use client";

import { useEffect, useState } from "react";
import { api, imageUrl } from "@/lib/api";
import { Painting } from "@/lib/types";

export default function AdminPaintingsPage() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Painting[]>("/api/admin/paintings")
      .then(setPaintings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const updated = await api.put<Painting>(
        `/api/admin/paintings/${id}/status`,
        { status }
      );
      setPaintings((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    } catch {
      // ignore
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Paintings</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Image</th>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Price</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Steg</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paintings.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <img
                    src={imageUrl(p.thumbnail_path || p.image_path)}
                    alt={p.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">
                  ${(p.price_cents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      p.status === "active"
                        ? "bg-green-100 text-green-700"
                        : p.status === "sold"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.has_steg_message && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      {p.steg_decoded ? "decoded" : "hidden msg"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                    <option value="sold">Sold</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
