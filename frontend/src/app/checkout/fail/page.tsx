"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function CheckoutFailInner() {
  const params = useSearchParams();
  const router = useRouter();
  const orderNo = params.get("orderNo");

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-8">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-red-700 mb-4">Payment Failed</h1>
        <p className="text-gray-700 mb-4">
          We couldn&apos;t process your payment. {orderNo ? `Order: ${orderNo}` : ""}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Try Again
          </button>
          <Link href="/dashboard/pets" className="text-pink-600 font-semibold hover:underline">
            Back to Pets
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-600">Loading...</div>}>
      <CheckoutFailInner />
    </Suspense>
  );
}


