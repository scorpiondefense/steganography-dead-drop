"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminStats } from "@/lib/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AdminStats>("/api/admin/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-surface-200 p-6 animate-pulse">
            <div className="h-3 bg-surface-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-surface-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-gray-400">Failed to load stats.</div>;
  }

  const cards = [
    { label: "Users", value: stats.total_users, color: "text-surface-900" },
    { label: "Paintings", value: stats.total_paintings, color: "text-surface-900" },
    { label: "Orders", value: stats.total_orders, color: "text-surface-900" },
    { label: "Comments", value: stats.total_comments, color: "text-surface-900" },
    { label: "Revenue", value: `$${(stats.total_revenue_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-green-600" },
    { label: "Steg Signals", value: stats.steg_paintings, color: "text-red-500" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-surface-900 mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-surface-200 p-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {card.label}
            </p>
            <p className={`text-3xl font-bold tabular-nums ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
