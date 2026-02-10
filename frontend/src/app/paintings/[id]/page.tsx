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
      <div className="text-center py-16 text-gray-500">Loading...</div>
    );
  }

  if (!painting) {
    return (
      <div className="text-center py-16 text-gray-500">
        Painting not found.
      </div>
    );
  }

  const inCart = items.some(
    (i) => i.painting.id === painting.id
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <img
            src={imageUrl(painting.image_path)}
            alt={painting.title}
            className="w-full"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{painting.title}</h1>
          {painting.artist && (
            <p className="text-lg text-gray-600 mb-4">by {painting.artist}</p>
          )}
          <p className="text-3xl font-bold text-gray-900 mb-4">
            ${(painting.price_cents / 100).toFixed(2)}
          </p>

          {painting.medium && (
            <div className="mb-4">
              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded">
                {painting.medium}
              </span>
            </div>
          )}

          {painting.description && (
            <p className="text-gray-700 mb-6">{painting.description}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <span>
              Status:{" "}
              <span
                className={`font-medium ${
                  painting.status === "active"
                    ? "text-green-600"
                    : painting.status === "sold"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {painting.status}
              </span>
            </span>
          </div>

          {user && painting.status === "active" && (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || inCart}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors mb-4"
            >
              {inCart
                ? "Already in Cart"
                : addingToCart
                ? "Adding..."
                : "Add to Cart"}
            </button>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">
          Comments ({comments.length})
        </h2>

        {comments.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-lg shadow-sm p-4 mb-3"
          >
            <p className="text-gray-800">{c.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(c.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}

        {user && (
          <form onSubmit={handleComment} className="mt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="submit"
              className="mt-2 bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Post Comment
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
