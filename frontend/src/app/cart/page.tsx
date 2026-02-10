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
      <div className="text-center py-24 text-gray-400">
        Please <Link href="/login" className="text-brand-600 font-semibold hover:underline">sign in</Link> to view your cart.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-24 text-gray-400">Loading...</div>;
  }

  const total = items.reduce((sum, i) => sum + i.painting.price_cents, 0);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-4xl font-bold text-surface-900 mb-8">
        Cart
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link href="/paintings" className="text-brand-600 font-semibold hover:text-brand-700 text-sm">
            Browse paintings &rarr;
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.cart_item.id}
                className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-4"
              >
                <img
                  src={imageUrl(item.painting.thumbnail_path || item.painting.image_path)}
                  alt={item.painting.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/paintings/${item.painting.id}`} className="font-display font-semibold text-surface-900 hover:text-brand-600 transition-colors truncate block">
                    {item.painting.title}
                  </Link>
                  {item.painting.artist && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.painting.artist}</p>
                  )}
                </div>
                <p className="font-bold text-surface-900 tabular-nums whitespace-nowrap">
                  ${(item.painting.price_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <button
                  onClick={() => removeFromCart(item.painting.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-xl border border-surface-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500">Total</span>
              <span className="text-3xl font-bold text-surface-900 tabular-nums">
                ${(total / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Link
              href="/checkout"
              className="block text-center bg-surface-900 text-white py-3.5 rounded-xl font-semibold hover:bg-surface-800 transition-all active:scale-[0.98]"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
