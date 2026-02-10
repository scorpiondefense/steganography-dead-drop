"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Comment } from "@/lib/types";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Comment[]>("/api/admin/comments")
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const updated = await api.put<Comment>(
        `/api/admin/comments/${id}/status`,
        { status }
      );
      setComments((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
    } catch {
      // ignore
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Moderate Comments</h1>
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-4"
            >
              <div className="flex-1">
                <p className="text-gray-800">{c.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Painting: {c.painting_id.slice(0, 8)} | User:{" "}
                  {c.user_id.slice(0, 8)} |{" "}
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    c.status === "visible"
                      ? "bg-green-100 text-green-700"
                      : c.status === "flagged"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {c.status}
                </span>
                <select
                  value={c.status}
                  onChange={(e) => updateStatus(c.id, e.target.value)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
