"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, imageUrl } from "@/lib/api";
import { Painting, Comment } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function PaintingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const { addToCart, items } = useCart();

  const [painting, setPainting] = useState<Painting | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Painting>(`/api/paintings/${id}`),
      api.get<Comment[]>(`/api/paintings/${id}/comments`),
    ])
      .then(([p, c]) => {
        setPainting(p);
        setComments(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addToCart(id);
    } catch {
      // error handled by cart context
    } finally {
      setAddingToCart(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const comment = await api.post<Comment>(
        `/api/paintings/${id}/comments`,
        { content: newComment }
      );
      setComments([...comments, comment]);
      setNewComment("");
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-surface-200 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-surface-200 rounded w-2/3 animate-pulse" />
            <div className="h-5 bg-surface-200 rounded w-1/3 animate-pulse" />
            <div className="h-10 bg-surface-200 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!painting) {
    return (
      <div className="text-center py-24 text-gray-400">
        Painting not found.
      </div>
    );
  }

  const inCart = items.some((i) => i.painting.id === painting.id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-surface-200">
          <img
            src={imageUrl(painting.image_path)}
            alt={painting.title}
            className="w-full"
          />
        </div>

        {/* Details */}
        <div className="py-2">
          {painting.medium && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-4">
              {painting.medium}
            </span>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-surface-900 leading-tight">
            {painting.title}
          </h1>
          {painting.artist && (
            <p className="text-lg text-gray-500 mt-2">by {painting.artist}</p>
          )}

          <p className="text-4xl font-bold text-surface-900 mt-6 tabular-nums">
            ${(painting.price_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>

          {painting.description && (
            <p className="text-gray-600 mt-6 leading-relaxed">
              {painting.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                painting.status === "active"
                  ? "bg-green-50 text-green-700"
                  : painting.status === "sold"
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  painting.status === "active"
                    ? "bg-green-500"
                    : painting.status === "sold"
                    ? "bg-red-500"
                    : "bg-gray-400"
                }`}
              />
              {painting.status === "active"
                ? "Available"
                : painting.status === "sold"
                ? "Sold"
                : "Hidden"}
            </span>
          </div>

          {user && painting.status === "active" && (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || inCart}
              className="mt-8 w-full bg-surface-900 text-white py-3.5 rounded-xl font-semibold hover:bg-surface-800 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {inCart
                ? "Already in Cart"
                : addingToCart
                ? "Adding..."
                : "Add to Cart"}
            </button>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Listed on {new Date(painting.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-16 max-w-2xl">
        <h2 className="font-display text-2xl font-bold text-surface-900 mb-6">
          Comments
          <span className="text-gray-400 font-sans text-lg font-normal ml-2">
            ({comments.length})
          </span>
        </h2>

        {comments.length === 0 && (
          <p className="text-gray-400 text-sm mb-6">
            No comments yet. Be the first to share your thoughts.
          </p>
        )}

        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-surface-200 p-4"
            >
              <p className="text-surface-800 text-sm leading-relaxed">
                {c.content}
              </p>
              <p className="text-[11px] text-gray-400 mt-2">
                {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>

        {user && (
          <form onSubmit={handleComment} className="mt-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 placeholder:text-gray-400 transition-all"
            />
            <button
              type="submit"
              className="mt-2 bg-surface-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-surface-800 transition-colors"
            >
              Post Comment
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
