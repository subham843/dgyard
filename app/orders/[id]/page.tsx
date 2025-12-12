import { Metadata } from "next";
import { OrderDetail } from "@/components/orders/order-detail";
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
    title: `Order Details - D.G.Yard`,
  };
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Middleware already protects this route - if we reach here, user is authenticated
  // Check session for logging and ownership verification
  const session = await getServerSession(authOptions);
  console.log(`[Order Detail Page Server] ${new Date().toISOString()} - Session exists: ${!!session}, User ID: ${session?.user?.id}`);
  
  if (!session?.user?.id) {
    // If somehow no session (shouldn't happen due to middleware), let client handle it
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please login to view order</h1>
            <a href="/auth/signin" className="text-primary-blue hover:underline">
              Go to Login
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      address: true,
      user: true,
    },
  });

  if (!order || order.userId !== session.user?.id) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
            <a href="/orders" className="text-primary-blue hover:underline">
              Back to Orders
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
        <OrderDetail order={order} />
      </main>
      <Footer />
    </>
  );
}

