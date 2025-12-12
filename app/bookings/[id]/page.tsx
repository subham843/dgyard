import { Metadata } from "next";
import { BookingConfirmation } from "@/components/services/booking-confirmation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Booking Confirmation - D.G.Yard`,
  };
}

export default async function BookingConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  // Middleware already protects this route - if we reach here, user is authenticated
  // Check session for logging and ownership verification
  const session = await getServerSession(authOptions);
  console.log(`[Booking Detail Page Server] ${new Date().toISOString()} - Session exists: ${!!session}, User ID: ${session?.user?.id}`);
  
  if (!session?.user?.id) {
    // If somehow no session (shouldn't happen due to middleware), let client handle it
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please login to view booking</h1>
            <a href="/auth/signin" className="text-primary-blue hover:underline">
              Go to Login
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      user: true,
    },
  });

  if (!booking || booking.userId !== session.user?.id) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
            <a href="/bookings" className="text-primary-blue hover:underline">
              Back to Bookings
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <BookingConfirmation booking={booking} />
      </main>
      <Footer />
    </>
  );
}

