"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { imageUrl } from "@/lib/api";

export default function CartPage() {
  const { user } = useAuth();
  const { items, removeFromCart, loading } = useCart();

  if (!user) {
    return (
      <div className="text-center py-16 text-gray-500">
        Please <Link href="/login" className="underline">log in</Link> to view your cart.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading...</div>;
  }

  const total = items.reduce((sum, i) => sum + i.painting.price_cents, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">Your cart is empty.</p>
          <Link
            href="/paintings"
            className="text-gray-900 font-semibold hover:underline"
          >
            Browse paintings
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.cart_item.id}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4"
              >
                <img
                  src={imageUrl(
                    item.painting.thumbnail_path || item.painting.image_path
                  )}
                  alt={item.painting.title}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <Link
                    href={`/paintings/${item.painting.id}`}
                    className="font-semibold hover:underline"
                  >
                    {item.painting.title}
                  </Link>
                  {item.painting.artist && (
                    <p className="text-sm text-gray-500">
                      {item.painting.artist}
                    </p>
                  )}
                </div>
                <p className="font-bold text-lg">
                  ${(item.painting.price_cents / 100).toFixed(2)}
                </p>
                <button
                  onClick={() => removeFromCart(item.painting.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium">Total</span>
              <span className="text-2xl font-bold">
                ${(total / 100).toFixed(2)}
              </span>
            </div>
            <Link
              href="/checkout"
              className="block text-center bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
