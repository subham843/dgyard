import { Metadata } from "next";
import { PaymentFailure } from "@/components/payments/payment-failure";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Payment Failed - D.G.Yard",
  description: "Payment could not be processed",
};

export default function PaymentFailurePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <PaymentFailure />
      </main>
      <Footer />
    </>
  );
}

