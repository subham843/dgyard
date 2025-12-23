import { Metadata } from "next";
import { ComplaintsList } from "@/components/customer/complaints-list";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Complaints - D.G.Yard",
  description: "Track your service complaints and support tickets",
};

export default async function ComplaintsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <ComplaintsList />
      </main>
      <Footer />
    </>
  );
}





