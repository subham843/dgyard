"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export function PaymentFailure() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const error = searchParams.get("error") || "Payment could not be processed";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
          <p className="text-gray-600">{error}</p>
        </div>

        <div className="bg-white rounded-lg p-8 border border-gray-200 mb-6">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                Your payment could not be processed. Please try again or use a different payment method.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-semibold">Possible reasons:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>Insufficient funds in your account</li>
                <li>Card declined by bank</li>
                <li>Network connectivity issues</li>
                <li>Payment gateway timeout</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {orderId && (
            <Button
              onClick={() => router.push(`/checkout?orderId=${orderId}`)}
              className="flex-1"
              style={{ backgroundColor: '#3A59FF' }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button variant="outline" asChild className="flex-1">
            <Link href="/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact us at{" "}
            <a href="mailto:support@dgyard.com" className="text-blue-600 hover:underline">
              support@dgyard.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

