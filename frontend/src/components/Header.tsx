"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Gallery
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/paintings"
            className="hover:text-gray-300 transition-colors"
          >
            Browse
          </Link>

          {user ? (
            <>
              <Link
                href="/sell"
                className="hover:text-gray-300 transition-colors"
              >
                Sell
              </Link>
              <Link
                href="/cart"
                className="hover:text-gray-300 transition-colors relative"
              >
                Cart
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>
              <Link
                href="/orders"
                className="hover:text-gray-300 transition-colors"
              >
                Orders
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="hover:text-gray-300 transition-colors text-amber-400"
                >
                  Admin
                </Link>
              )}
              <span className="text-gray-400 text-sm">{user.username}</span>
              <button
                onClick={logout}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-gray-300 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-white text-gray-900 px-4 py-1.5 rounded font-medium hover:bg-gray-100 transition-colors"
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
