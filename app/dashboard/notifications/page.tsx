import { Metadata } from "next";
import { NotificationsList } from "@/components/customer/notifications-list";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Notifications - D.G.Yard",
  description: "View your notifications and alerts",
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <NotificationsList />
      </main>
      <Footer />
    </>
  );
}





