import { Metadata } from "next";
import { RatingsReviews } from "@/components/customer/ratings-reviews";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Ratings & Reviews - D.G.Yard",
  description: "Rate and review your services and products",
};

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <RatingsReviews />
      </main>
      <Footer />
    </>
  );
}





