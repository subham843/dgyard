import { Metadata } from "next";
import { WarrantyList } from "@/components/customer/warranty-list";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "My Warranties - D.G.Yard",
  description: "View and manage your warranty coverage",
};

export default async function WarrantiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <WarrantyList />
      </main>
      <Footer />
    </>
  );
}





