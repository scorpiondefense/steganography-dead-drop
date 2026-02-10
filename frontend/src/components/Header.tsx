"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-surface-950/95 backdrop-blur-md border-b border-white/5">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold tracking-tight group-hover:scale-110 transition-transform">
            G
          </div>
          <span className="font-display text-lg text-white font-semibold tracking-wide">
            Gallery
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/paintings"
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            Browse
          </Link>

          {user ? (
            <>
              <Link
                href="/sell"
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Sell
              </Link>
              <Link
                href="/cart"
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all relative"
              >
                Cart
                {items.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-surface-950">
                    {items.length}
                  </span>
                )}
              </Link>
              <Link
                href="/orders"
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Orders
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 text-sm text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 rounded-lg transition-all font-medium"
                >
                  Admin
                </Link>
              )}
              <div className="w-px h-5 bg-white/10 mx-2" />
              <span className="text-xs text-gray-500 font-medium">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="ml-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="ml-1 px-4 py-1.5 text-sm bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
