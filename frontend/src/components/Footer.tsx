import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface-950 text-gray-400 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="font-display text-lg text-white font-semibold">
              Gallery
            </span>
            <p className="mt-2 text-sm leading-relaxed">
              A curated marketplace for original paintings. Every piece tells a
              story &mdash; some more than others.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navigate
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/paintings"
                className="text-sm hover:text-white transition-colors"
              >
                Browse Gallery
              </Link>
              <Link
                href="/sell"
                className="text-sm hover:text-white transition-colors"
              >
                Sell Your Art
              </Link>
              <Link
                href="/orders"
                className="text-sm hover:text-white transition-colors"
              >
                My Orders
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Account
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="text-sm hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm hover:text-white transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 text-center text-xs text-gray-600">
          Painting Gallery &mdash; Fine Art Marketplace
        </div>
      </div>
    </footer>
  );
}
