"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/paintings", label: "Paintings" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/dead-drop", label: "Dead Drop" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading...</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="text-center py-16 text-gray-500">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)]">
      <aside className="w-56 bg-white border-r shrink-0">
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
