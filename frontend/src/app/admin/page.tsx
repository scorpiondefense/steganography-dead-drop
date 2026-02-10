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
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-gray-500">Failed to load stats.</div>;
  }

  const cards = [
    { label: "Users", value: stats.total_users },
    { label: "Paintings", value: stats.total_paintings },
    { label: "Orders", value: stats.total_orders },
    { label: "Comments", value: stats.total_comments },
    {
      label: "Revenue",
      value: `$${(stats.total_revenue_cents / 100).toFixed(2)}`,
    },
    { label: "Steg Paintings", value: stats.steg_paintings },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow-sm p-6 text-center"
          >
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
