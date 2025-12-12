import { Metadata } from "next";
import { CartPage as CartPageComponent } from "@/components/cart/cart-page";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Shopping Cart - D.G.Yard",
  description: "Review your cart items and proceed to checkout",
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <CartPageComponent />
      </main>
      <Footer />
    </>
  );
}

