import { Metadata } from "next";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard - D.G.Yard",
  description: "Your account dashboard",
};

export default async function DashboardPage() {
  // Middleware already protects this route - if we reach here, user is authenticated
  // Check session for logging only, don't redirect (middleware handles auth)
  const session = await getServerSession(authOptions);
  console.log(`[Dashboard Page Server] ${new Date().toISOString()} - Session exists: ${!!session}, User ID: ${session?.user?.id}, Email: ${session?.user?.email}`);
  
  // If middleware allowed access, session should exist, but don't redirect if it doesn't
  // Let the client-side component handle the session state

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lavender-soft">
        <UserDashboard />
      </main>
      <Footer />
    </>
  );
}

