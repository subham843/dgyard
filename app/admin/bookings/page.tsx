import { Metadata } from "next";
import { BookingManagement } from "@/components/admin/booking-management";
import { AdminLayout } from "@/components/admin/admin-layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Booking Management - Admin",
};

export default async function AdminBookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayout>
      <BookingManagement />
    </AdminLayout>
  );
}

