import { Metadata } from "next";
import { PaymentsList } from "@/components/customer/payments-list";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Payments & Billing - D.G.Yard",
  description: "View your payment history and invoices",
};

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <PaymentsList />
      </main>
      <Footer />
    </>
  );
}





