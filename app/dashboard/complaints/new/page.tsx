import { Metadata } from "next";
import { ComplaintForm } from "@/components/customer/complaint-form";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Raise Complaint - D.G.Yard",
  description: "Raise a service complaint or support ticket",
};

export default async function NewComplaintPage({
  searchParams,
}: {
  searchParams: { warrantyId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <ComplaintForm warrantyId={searchParams.warrantyId} />
      </main>
      <Footer />
    </>
  );
}





