import { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Checkout - D.G.Yard",
  description: "Complete your purchase",
};

export default function Checkout() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <CheckoutPage />
      </main>
      <Footer />
    </>
  );
}

