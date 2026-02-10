"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, imageUrl } from "@/lib/api";
import { OrderWithItems } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .get<OrderWithItems>(`/api/orders/${id}`)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, id]);

  if (!user) {
    return (
      <div className="text-center py-16 text-gray-500">
        Please log in to view this order.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-16 text-gray-500">Order not found.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">
        Order #{order.order.id.slice(0, 8)}
      </h1>
      <p className="text-gray-500 mb-8">
        Placed on {new Date(order.order.created_at).toLocaleDateString()}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.order_item.id}
                className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4"
              >
                <img
                  src={imageUrl(
                    item.painting.thumbnail_path || item.painting.image_path
                  )}
                  alt={item.painting.title}
                  className="w-16 h-16 object-cover rounded"
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
                <p className="font-bold">
                  ${(item.order_item.price_cents / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span
                className={`text-sm px-2 py-1 rounded font-medium ${
                  order.order.status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : order.order.status === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {order.order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold">
                ${(order.order.total_cents / 100).toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm text-gray-500 mb-1">Ship to:</p>
              <p className="font-medium">{order.order.shipping_name}</p>
              <p className="text-sm text-gray-600">
                {order.order.shipping_address}
              </p>
              <p className="text-sm text-gray-600">
                {order.order.shipping_city}, {order.order.shipping_zip}
              </p>
              <p className="text-sm text-gray-600">
                {order.order.shipping_country}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
