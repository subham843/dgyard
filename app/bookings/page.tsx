import { Metadata } from "next";
import { BookingManagement } from "@/components/services/booking-management";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "My Bookings - D.G.Yard",
  description: "Manage your service bookings",
};

export default function BookingsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <BookingManagement />
      </main>
      <Footer />
    </>
  );
}

