import { Metadata } from "next";
import { OrderHistory } from "@/components/orders/order-history";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Order History - D.G.Yard",
  description: "View your order history",
};

export default function OrdersPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <OrderHistory />
      </main>
      <Footer />
    </>
  );
}

