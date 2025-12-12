import { Metadata } from "next";
import { PaymentSuccess } from "@/components/payments/payment-success";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Payment Success - D.G.Yard",
  description: "Your payment was successful",
};

export default function PaymentSuccessPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <PaymentSuccess />
      </main>
      <Footer />
    </>
  );
}

