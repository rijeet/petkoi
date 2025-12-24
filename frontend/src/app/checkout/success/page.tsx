"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import type { Order } from "@/lib/api-types";

function CheckoutSuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const orderNo = params.get("orderNo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderNo) {
      setError("Missing order number");
      setLoading(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;

    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) apiClient.setToken(token);
        const o = await apiClient.getOrder(orderNo);
        if (cancelled) return;
        setOrder(o);
        if (o.status === "PENDING" && attempts < 10) {
          attempts += 1;
          setTimeout(load, 2000);
        } else {
          setLoading(false);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load order");
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [orderNo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-8">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-green-700 mb-4">Payment Successful</h1>
        {loading && <p className="text-gray-600">Loading order...</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {order && (
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">Order No:</span> {order.orderNo}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Status:</span> {order.status}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Total:</span> {order.totalBDT} BDT
            </p>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard/pets" className="text-pink-600 font-semibold hover:underline">
            Back to Pets
          </Link>
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-600">Loading...</div>}>
      <CheckoutSuccessInner />
    </Suspense>
  );
}


