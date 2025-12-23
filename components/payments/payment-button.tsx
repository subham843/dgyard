"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentButtonProps {
  orderId: string;
  amount: number;
  orderNumber?: string;
  description?: string;
  onSuccess?: (orderId: string) => void;
  onFailure?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable Payment Button Component
 * Razorpay payment initiate करने के लिए
 * 
 * Usage:
 * <PaymentButton 
 *   orderId="order_123" 
 *   amount={1000} 
 *   orderNumber="ORD-001"
 * />
 */
export function PaymentButton({
  orderId,
  amount,
  orderNumber,
  description,
  onSuccess,
  onFailure,
  className,
  disabled = false,
}: PaymentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      // Step 1: Razorpay order create करें
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment order");
      }

      const paymentData = await response.json();

      // Step 2: Razorpay script load करें
      const loadRazorpayScript = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          // Check if script already loaded
          if ((window as any).Razorpay) {
            resolve();
            return;
          }

          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay script"));
          
          document.body.appendChild(script);
        });
      };

      await loadRazorpayScript();

      // Step 3: Razorpay checkout open करें
      const razorpay = new (window as any).Razorpay({
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency || "INR",
        name: paymentData.name || "D.G.Yard",
        description: description || paymentData.description || `Order ${orderNumber || orderId}`,
        order_id: paymentData.orderId,
        prefill: paymentData.prefill || {},
        theme: paymentData.theme || {
          color: "#3A59FF",
        },
        handler: async function (response: any) {
          try {
            // Step 4: Payment verify करें
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              toast.success("Payment successful!");
              
              // Call success callback if provided
              if (onSuccess) {
                onSuccess(orderId);
              } else {
                // Default: redirect to success page
                router.push(`/payments/success?orderId=${orderId}`);
              }
            } else {
              const errorMsg = verifyData.error || "Payment verification failed";
              toast.error(errorMsg);
              
              // Call failure callback if provided
              if (onFailure) {
                onFailure(errorMsg);
              } else {
                // Default: redirect to failure page
                router.push(
                  `/payments/failure?orderId=${orderId}&error=${encodeURIComponent(errorMsg)}`
                );
              }
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
            
            if (onFailure) {
              onFailure(error.message || "Verification failed");
            } else {
              router.push(
                `/payments/failure?orderId=${orderId}&error=${encodeURIComponent("Verification failed")}`
              );
            }
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
            setLoading(false);
          },
        },
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setLoading(false);
      
      if (onFailure) {
        onFailure(error.message || "Payment failed");
      }
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        "Pay Now"
      )}
    </Button>
  );
}





