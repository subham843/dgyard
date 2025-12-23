import { Metadata } from "next";
import { EnhancedProfileSettings } from "@/components/customer/enhanced-profile-settings";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Profile & Settings - D.G.Yard",
  description: "Manage your profile and account settings",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <EnhancedProfileSettings />
      </main>
      <Footer />
    </>
  );
}
