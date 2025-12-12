import { Metadata } from "next";
import { BookingForm } from "@/components/booking/booking-form";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Book a Service - D.G.Yard",
  description: "Book installation, networking, digital marketing, demo, repair, or maintenance services.",
};

export default async function BookServicePage({
  searchParams,
}: {
  searchParams: { type?: string; quotationId?: string };
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <BookingForm 
          defaultServiceType={searchParams.type} 
          quotationId={searchParams.quotationId}
        />
      </main>
      <Footer />
    </>
  );
}

